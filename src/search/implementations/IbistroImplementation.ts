import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import * as cheerio from 'cheerio';
import { isLibrary } from '../IsLibrary';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';

export class IbistroImplementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);
        
        const homePage = await this._client.get(`${service.ibistro.url}${service.ibistro.home}`);
        homePage.ensureSuccessful();

        const $ = cheerio.load(homePage.body);

        $('#library option').each((idx, option) => {
          if (isLibrary($(option).text())) result.branches.push($(option).text());
        });

        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);
            results.push(result);

            result.url = `${service.ibistro.url}${service.ibistro.search}${isbn}`;

            const searchPageRequest = await this._client.get(result.url);
            searchPageRequest.ensureSuccessful();

            const itemPage = searchPageRequest.body;
            let $ = cheerio.load(itemPage);
        
            const re = /put_keepremove_button\('(?<id>[0-9]+)'/.exec(itemPage);

            if (!re || re.length <= 1) 
                continue;

            result.id = re[1];
        
            if ($('form[name=hitlist]').length > 0) {
                const itemUrl = `${service.ibistro.url}${$('form[name=hitlist]').attr('action')}`;
                const itemPageRequest = await this._client.post(itemUrl, 'first_hit=1&form_type=&last_hit=2&VIEW%5E1=Details');
                itemPageRequest.ensureSuccessful();

                $ = cheerio.load(itemPageRequest.body);
            }
        
            const libs = {};
            let currentLib = '';

            $('tr').each((idx, tr) => {
                let libr = $(tr).find('td.holdingsheader,th.holdingsheader').eq(0).text().trim();

                if (libr === 'Copies') 
                    libr = $(tr).find('.holdingsheader_users_library').eq(0).text().trim();

                const status = $(tr).find('td').eq(3).text().trim();

                if (libr)
                    currentLib = libr;

                if (!libr && status) {
                    if (!libs[currentLib]) 
                        libs[currentLib] = { available: 0, unavailable: 0 };

                    service.ibistro.available.indexOf(status) > -1 ? libs[currentLib].available++ : libs[currentLib].unavailable++;
                }
            });

            for (const l in libs) 
                result.availability.push(new Availability(l, libs[l].available, libs[l].unavailable));
        }

        return _.uniq(results, x => x.id);
    }
}