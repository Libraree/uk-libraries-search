import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import * as cheerio from 'cheerio';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';
import * as uuid from 'uuid';
import * as querystring from 'querystring';

export class DurhamImplementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);
 
        let response = await this._client.get(service.durham.url);
        response.ensureSuccessful();

        response = await this._client.post(`${service.durham.url}pgLogin.aspx?CheckJavascript=1&AspxAutoDetectCookieSupport=1`);
        response.ensureSuccessful();

        const libraries = await this._client.get(`${service.durham.url}pgLib.aspx`);
        libraries.ensureSuccessful();

        const $ = cheerio.load(libraries.body);

        $('ol.list-unstyled li a').each(function () {
            result.branches.push($(this).text());
        });

        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        let response = await this._client.get(service.durham.url);
        response.ensureSuccessful();

        response = await this._client.post(`${service.durham.url}pgLogin.aspx?CheckJavascript=1`);
        response.ensureSuccessful();

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);
            result.id = uuid.v4();
            results.push(result);

            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
                };

            const cataloguePage = await this._client.post(`${service.durham.url}pgCatKeywordSearch.aspx`);
            cataloguePage.ensureSuccessful();

            let $ = cheerio.load(cataloguePage.body);

            const form1 = {
                __VIEWSTATE: $('input[name=__VIEWSTATE]').val(),
                __VIEWSTATEGENERATOR: $('input[name=__VIEWSTATEGENERATOR]').val(),
                __EVENTVALIDATION: $('input[name=__EVENTVALIDATION]').val(),
                ctl00$ctl00$cph1$cph2$cbBooks: 'on',
                ctl00$ctl00$cph1$cph2$Keywords: isbn,
                ctl00$ctl00$cph1$cph2$btSearch: 'Search'
            };

            const resultPage = await this._client.post(`${service.durham.url}pgCatKeywordSearch.aspx`, querystring.stringify(form1), headers);
            resultPage.ensureSuccessful();

            $ = cheerio.load(resultPage.body);
            result.url = resultPage.url;

            if ($('#cph1_cph2_lvResults_lnkbtnTitle_0').length === 0)
                continue;

            const form2 = {
                __EVENTARGUMENT: '',
                __EVENTTARGET: 'ctl00$ctl00$cph1$cph2$lvResults$ctrl0$lnkbtnTitle',
                __LASTFOCUS: '',
                __VIEWSTATE: $('input[name=__VIEWSTATE]').val(),
                __VIEWSTATEENCRYPTED: '',
                __VIEWSTATEGENERATOR: $('input[name=__VIEWSTATEGENERATOR]').val(),
                ctl00$ctl00$cph1$cph2$lvResults$DataPagerEx2$ctl00$ctl00: 10
                };

            const itemPage = await this._client.post(result.url, querystring.stringify(form2), headers);
            itemPage.ensureSuccessful();

            $ = cheerio.load(itemPage.body);

            const form3 = {
                __EVENTARGUMENT: '',
                __EVENTTARGET: '',
                __EVENTVALIDATION: $('input[name=__EVENTVALIDATION]').val(),
                __LASTFOCUS: '',
                __VIEWSTATE: $('input[name=__VIEWSTATE]').val(),
                __VIEWSTATEENCRYPTED: '',
                __VIEWSTATEGENERATOR: $('input[name=__VIEWSTATEGENERATOR]').val(),
                ctl00$ctl00$cph1$cph2$lvResults$DataPagerEx2$ctl00$ctl00: 10,
                ctl00$ctl00$cph1$ucItem$lvTitle$ctrl0$btLibraryList: 'Libraries'
            };

            const availabilityPage = await this._client.post(result.url, querystring.stringify(form3), headers);
            availabilityPage.ensureSuccessful();

            $ = cheerio.load(availabilityPage.body);

            const libs = {};
            $('#cph1_ucItem_lvTitle2_lvLocation_0_itemPlaceholderContainer_0 table tr').slice(1).each(function () {
                const name = $(this).find('td').eq(0).text().trim();
                const status = $(this).find('td').eq(1).text().trim();

                if (!libs[name]) { 
                    libs[name] = { available: 0, unavailable: 0 };
                }

                status !== 'Yes' ? libs[name].available++ : libs[name].unavailable++;
            });

            for (const l in libs) 
                result.availability.push(new Availability(l, libs[l].available, libs[l].unavailable));
        }

        return _.uniq(results, x => x.id);
    }
}