import { IHttpClient } from '../../net/IHttpClient';
import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';
import { IImplementation } from './IImplementation';
import * as cheerio from 'cheerio';
import { isLibrary } from '../IsLibrary';
import { Availability } from '../models/Availability';
import * as _ from 'underscore';
import * as querystring from 'querystring';
import * as xml2js from 'xml2js';

// HTTP Header:
//  Liferay-Portal: Liferay Portal Community Edition 6.2 CE GA6 (Newton / Build 6205 / January 6, 2016)

// THIS PLATFORM REQUIRES THE IHttpClient TO SUPPORT COOKIES!

const LIBRARIES_URL_PORTLETS = '?p_p_id=extendedSearch_WAR_arenaportlets&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=/extendedSearch/?wicket:interface=:0:extendedSearchPanel:extendedSearchForm:organisationHierarchyPanel:organisationContainer:organisationChoice::IBehaviorListener:0:&p_p_cacheability=cacheLevelPage&random=0.08709241788681465extended-search?p_p_id=extendedSearch_WAR_arenaportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=/extendedSearch/?wicket:interface=:0:extendedSearchPanel:extendedSearchForm:organisationHierarchyPanel:organisationContainer:organisationChoice::IBehaviorListener:0:&p_p_cacheability=cacheLevelPage&random=0.08709241788681465';
const SEARCH_URL_PORTLETS = 'search?p_p_id=searchResult_WAR_arenaportlets&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_r_p_687834046_facet_queries=&p_r_p_687834046_search_type=solr&p_r_p_687834046_search_query=[BOOKQUERY]';
const ITEM_URL_PORTLETS = 'results?p_p_id=crDetailWicket_WAR_arenaportlets&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-2&p_p_col_pos=2&p_p_col_count=4&p_r_p_687834046_facet_queries=&p_r_p_687834046_search_item_no=0&p_r_p_687834046_sort_advice=field%3DRelevance%26direction%3DDescending&p_r_p_687834046_search_type=solr&p_r_p_687834046_search_item_id=[ITEMID]&p_r_p_687834046_agency_name=[ARENANAME]';
const HOLDINGS_URL_PORTLETS = 'results?p_p_id=crDetailWicket_WAR_arenaportlets&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=/crDetailWicket/?wicket:interface=:0:recordPanel:holdingsPanel::IBehaviorListener:0:&p_p_cacheability=cacheLevelPage&p_p_col_id=column-2&p_p_col_pos=1&p_p_col_count=3';

export class ArenaV6Implementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);
    
        // Get the advanced search page and initial cookies
        const advancedSearchResponse = await this._client.get(`${service.arenaV6.url}${service.arenaV6.advancedUrl}`);
        advancedSearchResponse.ensureSuccessful();
    
        // If not, we'll need to call a portlet to get the data
        const headers = { Accept: 'text/xml', 'Wicket-Ajax': true, 'Wicket-FocusedElementId': 'id__extendedSearch__WAR__arenaportlet____e', 'Content-Type': 'application/x-www-form-urlencoded' };
        const url = `${service.arenaV6.url}${service.arenaV6.advancedUrl}${LIBRARIES_URL_PORTLETS}`;
        const responseHeaderRequest = await this._client.post(url, querystring.stringify({ 'organisationHierarchyPanel:organisationContainer:organisationChoice': service.arenaV6.organisationId }), headers);
        responseHeaderRequest.ensureSuccessful();
        
        const js = await xml2js.parseStringPromise(responseHeaderRequest.body);
    
        // Parse the results of the request
        if (js && js !== 'Undeployed' && js['ajax-response']?.component) {
            const $ = cheerio.load(js['ajax-response'].component[0]._);

            $('option').each(function () {
                if (isLibrary($(this).text())) result.branches.push($(this).text());
            });
        }

        return result;
    }

    async getBooks(service: Service, isbns: string[]): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        for (const isbn of isbns) {
            const result = new SearchResult(service.name, service.code, isbn);

            let bookQuery = `number_index:${isbn}`;
            if (service.arenaV6.organisationId) 
                bookQuery = `organisationId_index:${service.arenaV6.organisationId}+AND+${bookQuery}`;
          
            const searchUrl = SEARCH_URL_PORTLETS.replace('[BOOKQUERY]', bookQuery);
            result.url = `${service.arenaV6.url}${searchUrl}`;
          
            const searchResponse = await this._client.get(result.url);
            searchResponse.ensureSuccessful();
          
            // No item found
            if (!searchResponse || !searchResponse.body || 
                (searchResponse.body && searchResponse.body.lastIndexOf('search_item_id') === -1)) 
                continue;
          
            // Call to the item page
            const pageText = searchResponse.body.replace(/\\x3d/g, '=').replace(/\\x26/g, '&');
            let itemId = pageText.substring(pageText.lastIndexOf('search_item_id=') + 15);
            itemId = itemId.substring(0, itemId.indexOf('&'));
            result.id = itemId;
          
            const itemDetailsUrl = ITEM_URL_PORTLETS.replace('[ARENANAME]', service.arenaV6.arenaName).replace('[ITEMID]', itemId);
            const itemUrl = `${service.arenaV6.url}${itemDetailsUrl}`;
        
            const itemPageResponse = await this._client.get(itemUrl, { Connection: 'keep-alive' });
            itemPageResponse.ensureSuccessful();

            // Get the item holdings widget
            const holdingsPanelHeader = { Accept: 'text/xml', 'Wicket-Ajax': true };
            const holdingsPanelUrl = `${service.arenaV6.url}${HOLDINGS_URL_PORTLETS}`;
          
            const holdingsPanelPortletResponse = await this._client.get(holdingsPanelUrl, holdingsPanelHeader);
            holdingsPanelPortletResponse.ensureSuccessful();

            const js = await xml2js.parseStringPromise(holdingsPanelPortletResponse.body);

            if (!js['ajax-response'] || !js['ajax-response'].component)
                continue;

            const $ = cheerio.load(js['ajax-response'].component[0]._);
          
            if ($('.arena-holding-nof-total, .arena-holding-nof-checked-out, .arena-holding-nof-available-for-loan').length > 0) {
              $('.arena-holding-child-container').each(function (idx: number, container: cheerio.AnyNode) {
                const libName = $(container).find('span.arena-holding-link').text();
                const totalAvailable = parseInt($(container).find('.arena-holding-nof-total span.arena-value').text()) || (parseInt($(container).find('td.arena-holding-nof-available-for-loan span.arena-value').text() || '0') + parseInt($(container).find('td.arena-holding-nof-checked-out span.arena-value').text() || '0'));
                const checkedOut = $(container).find('.arena-holding-nof-checked-out span.arena-value').text();
        
                const av = ((totalAvailable ?? 0) - (checkedOut ? parseInt(checkedOut) : 0));
                const nav = (checkedOut !== '' ? parseInt(checkedOut) : 0);
        
                if (libName && ((av + nav) > 0)) 
                  result.availability.push(new Availability(libName, av, nav));
              });
            }

            results.push(result);
        }

        return _.uniq(results, x => x.id);
    }
}