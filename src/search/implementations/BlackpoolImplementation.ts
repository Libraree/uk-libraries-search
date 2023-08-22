import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import * as cheerio from 'cheerio';
import { isLibrary } from '../IsLibrary';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';

export class BlackpoolImplementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);
        const libraries = await this.getLibrariesInternal(service);
        result.branches = libraries.map(x => x.name);
        return result;
    }

    private async getLibrariesInternal(service: Service): Promise<BlackpoolLibrary[]> {
        const result: BlackpoolLibrary[] = [];
        const libraries = await this._client.get(service.blackpool.url);
        libraries.ensureSuccessful();
        
        const select = /<select id="library-ddl"[\s\S]+?<\/select>/gm.exec(libraries.body)[0];
        const $ = cheerio.load(select);

        $('#library-ddl').find('option').each((i, option) => {
          if (isLibrary($(option).text().trim()))
            result.push(new BlackpoolLibrary($(option).text().trim(), $(option).attr('value')));
        });

        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);
            results.push(result);

            result.url = service.blackpool.url;

            const isbnSearch = `https://api.blackpool.gov.uk/live/api/library/standard/catalogsearchrest/?Term1=${isbn}&Term2=&SearchType=General&HitsToDisplay=5&LibraryFilter=&LanguageFilter=&ItemTypeFilter=&ExactMatch=false&Token=`;
  
            let item = {titleIDField: undefined};
            
            const isbnResponse = await this._client.get(isbnSearch);
            isbnResponse.ensureSuccessful();

            let body = isbnResponse.getBodyAsJson();

            if (body.hitlistTitleInfoField && (body.hitlistTitleInfoField as []).length > 0) {
                item = body.hitlistTitleInfoField[0];
            } 
            else {
                continue;
            }
        
            const titleId = item?.titleIDField;
            if (!titleId) continue;
        
            result.id = `${titleId}`;

            const libs = await this.getLibrariesInternal(service);
        
            const titleSearch = `https://api.blackpool.gov.uk/live/api/library/standard/lookupTitleInformation/${titleId}`;
            const titleResponse = await this._client.get(titleSearch);

            titleResponse.ensureSuccessful();
            body = titleResponse.getBodyAsJson();

            if (!body.callInfoField) continue;

            (body.callInfoField as []).forEach((info: Record<string, unknown>) => {
                const lib = _.find(libs, l => l.code === info.libraryIDField);
                const copiesAvailable = _.filter(info.itemInfoField as [], (i: Record<string, unknown>) => i.homeLocationIDField === i.currentLocationIDField);
                const copiesUnavailable = _.filter(info.itemInfoField as [], (i: Record<string, unknown>) => i.homeLocationIDField !== i.currentLocationIDField);
                result.availability.push(new Availability(lib.name, copiesAvailable.length, copiesUnavailable.length));
            });
        }

        return _.uniq(results, x => x.id);
    }
}

class BlackpoolLibrary {
    name: string;
    code: string;

    constructor(name: string, code: string) {
        this.name = name;
        this.code = code;
    }
}