import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import * as cheerio from 'cheerio';
import { isLibrary } from '../IsLibrary';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';

const SEARCH_URL = 'search/results?qu=';
const ITEM_URL = 'search/detailnonmodal/ent:[ILS]/one';
const HEADER_POST = { 'X-Requested-With': 'XMLHttpRequest' };

export class EnterpriseImplementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);

        const advancedPage = await this._client.get(
            `${service.enterprise.url}search/advanced`
        );
        advancedPage.ensureSuccessful();

        const $ = cheerio.load(advancedPage.body);

        $('#libraryDropDown option').each((idx, lib) => {
            const name = $(lib).text().trim();
            if (
                isLibrary(name) &&
                ((service.enterprise.libraryNameFilter &&
                    name.indexOf(service.enterprise.libraryNameFilter) !==
                        -1) ||
                    !service.enterprise.libraryNameFilter)
            )
                result.branches.push(name);
        });

        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);
            results.push(result);

            result.url = `${service.enterprise.url}${SEARCH_URL}${isbn}`;
            let itemPage = '';

            let itemId = null;
            let $ = null;
            let deepLinkPageUrl = null;

            // We could also use RSS https://wales.ent.sirsidynix.net.uk/client/rss/hitlist/ynysmon_en/qu=9780747538493
            const deepLinkPageRequest = await this._client.get(result.url);
            deepLinkPageRequest.ensureSuccessful();

            if (deepLinkPageRequest.url.indexOf('ent:') > 0) {
                deepLinkPageUrl = deepLinkPageRequest.url;
            }
            else {
                deepLinkPageUrl = result.url;
            }

            if (deepLinkPageUrl.indexOf('ent:') > 0) {
                itemId =
                    deepLinkPageUrl.substring(
                        deepLinkPageUrl.lastIndexOf('ent:') + 4,
                        deepLinkPageUrl.lastIndexOf('/one')
                    ) || '';
                result.id = itemId;
            }

            $ = cheerio.load(deepLinkPageRequest.body);
            itemPage = deepLinkPageRequest.body;

            if (deepLinkPageUrl.lastIndexOf('ent:') === -1) {
                // In this situation we're probably still on the search page (there may be duplicate results).
                const items = $('input.results_chkbox.DISCOVERY_ALL');

                for (const item of items) {
                    itemId = item.attribs.value;
                    itemId = itemId.substring(itemId.lastIndexOf('ent:') + 4);
                    itemId = itemId.split('/').join('$002f');
                    result.id = itemId;

                    if (itemId === '') continue;

                    const itemPageUrl = `${service.enterprise.url}${ITEM_URL.replace('[ILS]', itemId)}`;
                    const itemPageRequest = await this._client.get(itemPageUrl);
                    itemPageRequest.ensureSuccessful();

                    itemPage = itemPageRequest.body;

                    result.availability = await this.processItemPage(
                        itemId,
                        itemPage,
                        service
                    );

                    if (result.availability.length > 0) break;
                }
            }
            else {
                result.availability = await this.processItemPage(itemId, itemPage, service);
            }
        }

        return _.uniq(results, (x) => x.id);
    }

    async processItemPage(itemId: string, itemPage: string, service: Service): Promise<Availability[]> {
        let availabilityJson = null;
        const availability: Availability[] = [];

        // Get CSRF token, if available
        const csrfMatches = /__sdcsrf\s+=\s+"([a-f0-9-]+)"/gm.exec(itemPage);
        let csrf = null;
        if (csrfMatches && csrfMatches[1]) csrf = csrfMatches[1];

        const $ = cheerio.load(itemPage);

        if (service.enterprise.availabilityUrl) {
            // e.g. /search/detailnonmodal.detail.detailavailabilityaccordions:lookuptitleinfo/ent:$002f$002fSD_ILS$002f0$002fSD_ILS:548433/ILS/0/true/true?qu=9780747538493&d=ent%3A%2F%2FSD_ILS%2F0%2FSD_ILS%3A548433%7E%7E0&ps=300
            const availabilityUrl =
                `${service.enterprise.url}${service.enterprise.availabilityUrl.replace('[ITEMID]',itemId.split('/').join('$002f'))}`;
            const availabilityPageRequest = await this._client.post(availabilityUrl, null, { ...{sdcsrf: csrf}, ...HEADER_POST });
            availabilityPageRequest.ensureSuccessful();

            const availabilityResponse = availabilityPageRequest.getBodyAsJson();

            if (availabilityResponse.ids || availabilityResponse.childRecords)
                availabilityJson = availabilityResponse;
        }

        if (availabilityJson?.childRecords) {
            const libs = {};
            $(availabilityJson.childRecords).each(function (i, c) {
                const name = c.LIBRARY;
                const status = c.SD_ITEM_STATUS;

                if (!libs[name]) libs[name] = { available: 0, unavailable: 0 };

                service.enterprise.available.indexOf(status) > 0
                    ? libs[name].available++
                    : libs[name].unavailable++;
            });

            for (const lib in libs)
                availability.push(new Availability(lib, libs[lib].available, libs[lib].unavailable));

            return availability;
        }

        if (service.enterprise.titleDetailUrl) {
            const titleUrl =
                `${service.enterprise.url}${service.enterprise.titleDetailUrl.replace('[ITEMID]', itemId.split('/').join('$002f'))}`;

            const titleDetailRequest = await this._client.post(titleUrl, null, { ...{sdcsrf: csrf}, ...HEADER_POST });
            const titles = titleDetailRequest.getBodyAsJson();
            const libs = {};

            $(titles.childRecords as []).each(function (i: number, c: Record<string, string>) {
                const name = c.LIBRARY;
                const status = c.SD_ITEM_STATUS;

                if (!libs[name]) libs[name] = { available: 0, unavailable: 0 };

                service.enterprise.available.indexOf(status) > 0
                    ? libs[name].available++
                    : libs[name].unavailable++;
            });

            for (const lib in libs)
                availability.push(new Availability(lib, libs[lib].available, libs[lib].unavailable));

            return availability;
        }
    }
}
