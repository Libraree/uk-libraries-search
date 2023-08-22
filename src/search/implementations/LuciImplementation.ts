import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';

export class LuciImplementation implements IImplementation {
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

    private async getLibrariesInternal(service: Service): Promise<LuciLibrary[]> {
        const result: LuciLibrary[] = [];

        let resp = await this._client.get(`${service.luci.url}${service.luci.home}`);
        resp.ensureSuccessful();

        const frontEndId = /\/_next\/static\/([^/]+)\/_buildManifest.js/gm.exec(resp.body)[1];

        resp = await this._client.get(`${service.luci.url}_next/data/${frontEndId}/user/register.json`);
        resp.ensureSuccessful();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const libraries = _.find(resp.getBodyAsJson().pageProps.patronFields as any[], x => x.code == 'patron_homeLocation').optionList;

        for(const library of libraries) {
            result.push({
                name: library.value.trim(),
                code: library.key.trim()
            });
        }

        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        let resp = await this._client.get(`${service.luci.url}${service.luci.home}`);
        resp.ensureSuccessful();

        const appId = /\?appid=([a-f0-9-]+)/gm.exec(resp.body)[1];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);
            results.push(result);
        
            resp = await this._client
                .post(`${service.luci.url}api/manifestations/searchresult`,
                    {
                        searchTerm: isbn,
                        searchTarget: '',
                        searchField: '',
                        sortField: 'any',
                        searchLimit: '196',
                        offset: 0,
                        facets: [
                            {
                                Name: 'LANGUAGE',
                                Selected: ['ENG']
                            }
                        ],
                        count: 40
                    },
                    {
                        'Content-Type': 'application/json',
                        'solus-app-id': appId
                    }
                );
        
            const isbnResult = resp.getBodyAsJson().records.find(x => x.isbnList.includes(isbn));
        
            if (!isbnResult || isbnResult.eContent)
                continue;
        
            result.id = isbnResult.recordID;
            result.url = `${service.luci.url}manifestations/${isbnResult.recordID}`;
        
            resp = await this._client.get(`${service.luci.url}api/record?id=${isbnResult.recordID}&source=ILSWS`,
                { 'solus-app-id': appId });
                resp.ensureSuccessful();
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const copies = resp.getBodyAsJson().data.copies as any[];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const libraries = _.chain(resp.getBodyAsJson().data.copies as any[])
                .map(x => x.location.locationName as string)
                .uniq()
                .value();

            // Get unique library values.
            //libraries = libraries.filter((v, i, s) => s.indexOf(v) === i);
        
            for (const library of libraries) {
                result.availability.push(new Availability(
                    library, 
                    _.filter(copies, x => x.location.locationName == library && x.available).length,
                    _.filter(copies, x => x.location.locationName == library && !x.available).length
                ));
            }
        }

        return _.uniq(results, x => x.id);
    }
}

class LuciLibrary {
    name: string;
    code: string;
}