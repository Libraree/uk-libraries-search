import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import * as cheerio from 'cheerio';
import { isLibrary } from '../IsLibrary';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';

const SEARCH_URL = 'cgi-bin/spydus.exe/ENQ/WPAC/BIBENQ?NRECS=1&ISBN=';
const LIBS_URL = 'cgi-bin/spydus.exe/MSGTRN/WPAC/COMB';

export class SpydusImplementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);

        if (service.spydus.branches) {
            result.branches = service.spydus.branches;
            return result;
        }

        const response = await this._client.get(`${service.spydus.url}${LIBS_URL}`, { 'Cookie': 'ALLOWCOOKIES_443=1' });
        response.ensureSuccessful();

        const $ = cheerio.load(response.body);

        $('#LOC option').each(function (idx, option) {
          if (isLibrary($(option).text().trim())) {
            result.branches.push($(option).text().trim());
          }
        });

        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);
            results.push(result);

            result.url = `${service.spydus.url}${SEARCH_URL}${isbn}`;

            const itemResponse = await this._client.get(result.url);
            itemResponse.ensureSuccessful();

            let $ = cheerio.load(itemResponse.body);

            if ($('#result-content-list').length === 0) {
                continue;
            }

            result.id = $('.card.card-list').first().find('a').attr('name');

            if (!result.id) {
                result.id = $('.card.card-list').first().find('input.form-check-input').attr('value');
            }

            const availabilityUrl = $('.card-text.availability').first().find('a').attr('href');
            const availabilityResponse = await this._client.get(`${service.spydus.url}${availabilityUrl}`);
            availabilityResponse.ensureSuccessful();

            $ = cheerio.load(availabilityResponse.body);

            const libs = {};
            $('table tr').slice(1).each(function (i, tr) {
                const name = $(tr).find('td').eq(0).text().trim();
                const status = $(tr).find('td').eq(3).text().trim();
                
                if (!libs[name]) 
                    libs[name] = { available: 0, unavailable: 0 };
            
                status === 'Available' ? libs[name].available++ : libs[name].unavailable++;
            });
            
            for (const l in libs) {
                result.availability.push(new Availability(l, libs[l].available, libs[l].unavailable));
            }
        }

        return _.uniq(results, x => x.url);
    }
}