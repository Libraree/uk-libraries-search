import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';
import * as xml2js from 'xml2js';

const ITEM_SEARCH = 'fu=BibSearch&RequestType=ResultSet_DisplayList&NumberToRetrieve=10&StartValue=1&SearchTechnique=Find&Language=eng&Profile=Iguana&ExportByTemplate=Brief&TemplateId=Iguana_Brief&FacetedSearch=Yes&MetaBorrower=&Cluster=0&Namespace=0&BestMatch=99&ASRProfile=&Sort=Relevancy&SortDirection=1&WithoutRestrictions=Yes&Associations=Also&Application=Bib&Database=[DB]&Index=Keywords&Request=[ISBN]&SessionCMS=&CspSessionId=[SID]&SearchMode=simple&SIDTKN=[SID]';
const HEADER = { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' };
const HOME = 'www.main.cls';
const ITEM_PAGE = '?surl=search&p=*#recordId=[ID]&srchDb=[DB]';

export class IguanaImplementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);

        const homePageRequest = await this._client.get(`${service.iguana.url}${HOME}`);
        homePageRequest.ensureSuccessful();

        const sid = this.getSid(service);
        const body = ITEM_SEARCH
            // Search for a word that will exist somewhere in every library service
            // and that isn't a word that will be dropped, like "the".
            .replace('[ISBN]', 'harry')
            .replace('Index=Isbn', 'Index=Keywords')
            .replace('[DB]', service.iguana.database)
            .replace('[TID]', 'Iguana_Brief')
            .replace(/\[SID\]/g, sid);
    
        const searchUrl = `${service.iguana.url}Proxy.SearchRequest.cls`;
        const searchPageRequest = await this._client.post(searchUrl, body, { ...HEADER, Referer: `${service.iguana.url}${HOME}` });
        searchPageRequest.ensureSuccessful();
        
        const searchJs = await xml2js.parseStringPromise(searchPageRequest.body);
    
        if (searchJs && searchJs.searchRetrieveResponse && searchJs.searchRetrieveResponse.records) {
            searchJs.searchRetrieveResponse.records[0].record.forEach(function (record) {
                const recData = record.recordData;

                if (recData && 
                    recData[0] && 
                    recData[0].BibDocument && 
                    recData[0].BibDocument[0] && 
                    recData[0].BibDocument[0].HoldingsSummary && 
                    recData[0].BibDocument[0].HoldingsSummary[0]) {

                    recData[0].BibDocument[0].HoldingsSummary[0].ShelfmarkData.forEach((item) => {
                        if (item.Shelfmark) {
                            const lib = item.Shelfmark[0].split(' : ')[0];

                            if (result.branches.indexOf(lib) === -1) 
                                result.branches.push(lib);
                        }
                    });
                }
            });
        }
        
        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);
            results.push(result);

            const homePageRequest = await this._client.get(`${service.iguana.url}${HOME}`);
            homePageRequest.ensureSuccessful();

            const sid = this.getSid(service);
            const body = ITEM_SEARCH
                .replace('[ISBN]', isbn)
                .replace('[DB]', service.iguana.database)
                .replace('[TID]', 'Iguana_Brief')
                .replace(/\[SID\]/g, sid);

            const searchPageRequest = await this._client.post(`${service.iguana.url}Proxy.SearchRequest.cls`, body, { ...HEADER, Referer: `${service.iguana.url}${HOME}` });
            searchPageRequest.ensureSuccessful();

            const searchJs = await xml2js.parseStringPromise(searchPageRequest.body);
          
            let record = null;
            if (searchJs?.searchRetrieveResponse && 
                !searchJs.searchRetrieveResponse.bestMatch && 
                searchJs.searchRetrieveResponse.records && 
                searchJs.searchRetrieveResponse.records[0].record) 
                
                record = searchJs.searchRetrieveResponse.records[0]?.record[0];
          
            if (record?.recordData && record.recordData[0] && record.recordData[0].BibDocument[0]) {
                result.id = record.recordData[0].BibDocument[0].Id[0];
                result.url = `${service.iguana.url}${HOME}${ITEM_PAGE.replace('[ID]', result.id).replace('[DB]', service.iguana.database)}`;
            }
          
            if (record?.recordData && 
                record.recordData[0] && 
                record.recordData[0].BibDocument[0] && 
                record.recordData[0].BibDocument[0].HoldingsSummary) {
                
                record.recordData[0].BibDocument[0].HoldingsSummary[0].ShelfmarkData.forEach(function (item) {
                    if (item.Shelfmark && item.Available) {
                        const lib = item.Shelfmark[0].split(' : ')[0];
                        result.availability.push(new Availability(lib, item.Available ? parseInt(item.Available[0]) : 0, item.Available[0] === '0' ? 1 : 0));
                    }
                });
            }
        }

        return _.uniq(results, x => x.id);
    }

    private getSid(service: Service): string {
        return (this._client.getCookie(service.iguana.url, 'CSPSESSIONID-SP-443-UP-iguana-') ?? 
            this._client.getCookie(service.iguana.url, 'CSPSESSIONID-SP-80-UP-iguana-')).substring(12, 22);
    }
}