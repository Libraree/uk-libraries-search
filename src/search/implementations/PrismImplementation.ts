import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';
import * as cheerio from 'cheerio';
import { isLibrary } from '../IsLibrary';

const AVAILABLE_STATUSES = [
    'http://schema.org/InStock',
    'http://schema.org/InStoreOnly',
];
const HEADER = { 'Content-Type': 'text/xml; charset=utf-8' };
const DEEP_LINK = 'items?query=';

export class PrismImplementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);

        const advancedSearchPageRequest = await this._client.get(
            `${service.prism.url}advancedsearch?target=catalogue`
        );
        advancedSearchPageRequest.ensureSuccessful();

        const $ = cheerio.load(advancedSearchPageRequest.body);

        $('#locdd option').each((idx, option) => {
            if (isLibrary($(option).text().trim()))
                result.branches.push($(option).text().trim());
        });

        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);
            results.push(result);

            result.url = `${service.prism.url}${DEEP_LINK}${isbn}`;

            let $ = null;
            const searchRequest = await this._client.get(
                `${service.prism.url}items.json?query=${isbn}`,
                HEADER
            );
            searchRequest.ensureSuccessful();

            const body = searchRequest.getBodyAsJson();
            if (body.length === 0) continue;

            let itemUrl = '';

            for (const k of Object.keys(body)) {
                let eBook = true;

                if (k.indexOf('/items/') > 0) {
                    itemUrl = k;

                    for (const key of Object.keys(body[k])) {
                        const item = body[k][key];

                        switch (key) {
                            case 'http://purl.org/dc/elements/1.1/format':
                                item.forEach((format) => {
                                    // One record can contain multiple formats. If *any* aren't
                                    // an eBook, we should get the item details.
                                    if (format.value !== 'eBook') eBook = false;
                                });
                                break;
                            case 'http://purl.org/dc/terms/identifier':
                                result.id = item[0].value;
                                break;
                        }
                    }

                    if (itemUrl && eBook) {
                        itemUrl = '';
                        // Try the next record, just in case..
                    } else {
                        // We've found what we needed - leave the "for" loop.
                        break;
                    }
                }
            }

            if (itemUrl !== '') {
                const itemRequest = await this._client.get(itemUrl);
                itemRequest.ensureSuccessful();

                $ = cheerio.load(itemRequest.body);
            } else {
                continue;
            }

            $('#availability ul.options')
                .find('li')
                .each((idx, li) => {
                    const libr = {
                        library: $(li).find('h3 span span').text().trim(),
                        available: 0,
                        unavailable: 0,
                    };
                    $(li)
                        .find('div.jsHidden table tbody tr')
                        .each((i, tr) => {
                            const status = $(tr)
                                .find('link[itemprop = \'availability\']')
                                .attr('href');
                            AVAILABLE_STATUSES.includes(status)
                                ? libr.available++
                                : libr.unavailable++;
                        });
                    result.availability.push(
                        new Availability(
                            libr.library,
                            libr.available,
                            libr.unavailable
                        )
                    );
                });
        }

        return _.uniq(results, (x) => x.id);
    }
}
