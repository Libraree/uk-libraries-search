import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';

const SEARCH_URL = 'https://eu.iiivega.com/api/search-result/search/format-groups';
const AVAILABILITY_URL = 'https://eu.iiivega.com/api/search-result/facet/FormatGroup';
const LIBS_URL = 'https://eu.iiivega.com/api/search-result/customer/locations';

export class VegaImplementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);

        const response = await this._client.get(LIBS_URL, {
            'Iii-Customer-Domain': service.vega.domain, 
            'Iii-Host-Domain': service.vega.domain, 
            'Api-Version': 1
        });

        response.ensureSuccessful();

        const items = response.getBodyAsJson();

        result.branches = _.chain(items)
            .filter(x => x.chosen)
            .map(x => x.name as string)
            .value();

        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);

            const isbnResponse = await this._client.post(SEARCH_URL, 
                {
                    'searchText': isbn,
                    'sorting': 'relevance',
                    'sortOrder': 'asc',
                    'searchType': 'everything',
                    'pageNum': 0,
                    'pageSize': 10,
                    'resourceType': 'FormatGroup'
                },
                {
                    'Iii-Customer-Domain': service.vega.domain, 
                    'Iii-Host-Domain': service.vega.domain, 
                    'Api-Version': 2
                }
            );

            const isbnResult = isbnResponse.getBodyAsJson();

            if (isbnResult.totalResults == 0)
                continue;

            const record = isbnResult.data[0];

            result.id = record.id;
            result.url = `https://${service.vega.domain}/search/card?id=${record.id}&entityType=FormatGroup`;

            const availabilityResponse = await this._client.post(AVAILABILITY_URL, 
                {
                    'dateFrom': null,
                    'dateTo': null,
                    'catalogDate': null,
                    'facetTypes': [
                      'universalLimiter',
                      'materialType',
                      'collection',
                      'intendedAudience',
                      'literaryForm',
                      'language',
                      'fullText',
                      'location',
                      'publisher'
                    ],
                    'searchText': isbn,
                    'searchType': 'everything',
                    'metadataBoolQuery': null,
                    'resourceIds': null
                  },
                {
                    'Iii-Customer-Domain': service.vega.domain, 
                    'Iii-Host-Domain': service.vega.domain, 
                    'Api-Version': 1
                }
            );

            availabilityResponse.ensureSuccessful();

            const availabilityResult = availabilityResponse.getBodyAsJson();

            if (availabilityResult.location.totalResults > 0) {
                result.availability = _.chain(availabilityResult.location.data)
                    .map(x => new Availability(x.label, 1, 1 - x.count))
                    .value();
            }

            results.push(result);
        }

        return _.uniq(results, x => x.url);
    }
}