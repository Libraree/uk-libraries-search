import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';
import * as cheerio from 'cheerio';
import { isLibrary } from '../IsLibrary';

const CAT_URL = 'Search/Results?lookfor=[ISBN]&searchIndex=Keyword&sort=relevance&view=rss&searchSource=local';
const LIBS_URL = 'Union/Search?view=list&showCovers=on&lookfor=&searchIndex=advanced&searchSource=local';

export class KohaV22Implementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);
        const url = `${service.kohaV22.url}${LIBS_URL}`;
  
        const libraryPageRequest = await this._client.get(url);
        libraryPageRequest.ensureSuccessful();

        const $ = cheerio.load(libraryPageRequest.body);
    
        $('option').each((idx, option) => {
            if ((option.attribs['value'].startsWith('owning_location_main:') || option.attribs['value'].startsWith('owning_location:')) && isLibrary($(option).text().trim()))
                result.branches.push($(option).text().trim());
        });
        
        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);
            results.push(result);

            result.url = service.kohaV22.url;

            const searchUrl = `${service.kohaV22.url}${CAT_URL.replace('[ISBN]', isbn)}`;
            const searchPageRequest = await this._client.get(searchUrl);
            searchPageRequest.ensureSuccessful();

            let $ = cheerio.load(searchPageRequest.body, { xmlMode: true });
            result.url = $('item > link').first().text();
          
            let bibLink = $('guid').text();
            if (!bibLink) 
                continue;
          
            result.id = bibLink.substring(bibLink.lastIndexOf('/') + 1);
            bibLink = `${bibLink}/AJAX?method=getCopyDetails&format=Reference&recordId=${result.id}`;
          
            const itemPageRequest = await this._client.get(bibLink);
            itemPageRequest.ensureSuccessful();

            $ = cheerio.load(itemPageRequest.getBodyAsJson().modalBody as string);
          
            const libs = {};
        
            $('table').find('tbody > tr').each((idx, row) => {
                const lib = $(row).find('td.notranslate').first().text().trim();

                if (!libs[lib]) 
                    libs[lib] = { available: 0, unavailable: 0 };

                const quantity = $(row).find('td').first().text().trim().split(' of ');
                libs[lib].available += parseInt(quantity[0]);
                libs[lib].unavailable +=  parseInt(quantity[1]) - parseInt(quantity[0]);
              });
        
            for (const l in libs) 
                result.availability.push(new Availability(l, libs[l].available, libs[l].unavailable));
        }

        return _.uniq(results, x => x.id);
    }
}