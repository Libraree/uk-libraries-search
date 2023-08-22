import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';
import * as cheerio from 'cheerio';
import { isLibrary } from '../IsLibrary';

export class WebpacImplementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);

        const advancedSearchPageRequest = await this._client.get(`${service.webpac.url}search/X`);
        advancedSearchPageRequest.ensureSuccessful();

        const $ = cheerio.load(advancedSearchPageRequest.body);

        $('select[Name=searchscope] option').each((idx, option) => {
          if (isLibrary($(option).text().trim())) result.branches.push($(option).text().trim());
        });

        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);
            results.push(result);

            const libs = {};
            result.url = `${service.webpac.url}search~S1/?searchtype=i&searcharg=${isbn}`;

            const responseHoldingsRequest = await this._client.get(result.url);
            responseHoldingsRequest.ensureSuccessful();

            const $ = cheerio.load(responseHoldingsRequest.body);

            const id = $('#recordnum');
            result.id = id.attr('href').replace('/record=', '');

            $('table.bibItems tr.bibItemsEntry').each(function (idx, tr) {
                const name = $(tr).find('td').eq(0).text().trim();
                const status = $(tr).find('td').eq(3).text().trim();
                if (!libs[name]) 
                    libs[name] = { available: 0, unavailable: 0 };

                status === 'AVAILABLE' || status === 'FOR LOAN' ? libs[name].available++ : libs[name].unavailable++;
            });

            for (const l in libs) 
                result.availability.push(new Availability(l, libs[l].available, libs[l].unavailable));
        }

        return _.uniq(results, (x) => x.id);
    }
}
