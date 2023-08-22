import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';
import * as cheerio from 'cheerio';
import { isLibrary } from '../IsLibrary';

const CAT_URL = 'cgi-bin/koha/opac-search.pl?format=rss2&idx=nb&q=';
const LIBS_URL = 'cgi-bin/koha/opac-search.pl?do=Search&expand=holdingbranch#holdingbranch_id';

export class KohaV20Implementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);
        const url = `${service.kohaV20.url}${LIBS_URL}`;
  
        const libraryPageRequest = await this._client.get(url);
        libraryPageRequest.ensureSuccessful();

        const $ = cheerio.load(libraryPageRequest.body);
    
        $('#branchloop option').each((idx, option) => {
            if (isLibrary($(option).text())) 
                result.branches.push($(option).text().trim());
        });

        $('li#holdingbranch_id ul li span.facet-label').each((idx, label) => {
            result.branches.push($(label).text().trim());
        });

        $('li#homebranch_id ul li span.facet-label').each((idx, label) => {
            result.branches.push($(label).text().trim());
        });
        
        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);
            results.push(result);

            result.url = service.kohaV20.url;

            const searchPageRequest = await this._client.get(`${service.kohaV20.url}${CAT_URL}${isbn}`);
            searchPageRequest.ensureSuccessful();

            let $ = cheerio.load(searchPageRequest.body, { xmlMode: true });
            result.url = $('link').first().text();
        
            const bibLink = $('guid').text();
            if (!bibLink) 
                continue;
        
            result.id = bibLink.substring(bibLink.lastIndexOf('=') + 1);
            result.url = bibLink;
        
            const itemPageRequest = await this._client.get(`${bibLink}&viewallitems=1`);
            itemPageRequest.ensureSuccessful();

            $ = cheerio.load(itemPageRequest.body);
        
            const libs = {};
            $('#holdingst tbody, .holdingst tbody').find('tr').each((idx, table) => {
                const lib = $(table).find('td.location span span').first().text().trim();

                if (!libs[lib]) 
                    libs[lib] = { available: 0, unavailable: 0 };

                $(table).find('td.status span').text().trim() === 'Available' ? libs[lib].available++ : libs[lib].unavailable++;
            });

            for (const l in libs) 
                result.availability.push(new Availability(l, libs[l].available, libs[l].unavailable));
        }

        return _.uniq(results, x => x.id);
    }
}