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
import { HttpResponse } from '../../net/HttpResponse';

// HTTP Header:
//  Liferay-Portal: Liferay Community Edition Portal 7.0.6 GA7 (Wilberforce / Build 7006 / April 17, 2018)

// THIS PLATFORM REQUIRES THE IHttpClient TO SUPPORT COOKIES!

const LIBRARIES_URL_PORTLET = '?p_p_id=extendedSearch_WAR_arenaportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=/extendedSearch/?wicket:interface=:0:extendedSearchPanel:extendedSearchForm:organisationHierarchyPanel:organisationContainer:organisationChoice::IBehaviorListener:0:&p_p_cacheability=cacheLevelPage&random=0.08709241788681465extended-search?p_p_id=extendedSearch_WAR_arenaportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=/extendedSearch/?wicket:interface=:0:extendedSearchPanel:extendedSearchForm:organisationHierarchyPanel:organisationContainer:organisationChoice::IBehaviorListener:0:&p_p_cacheability=cacheLevelPage&random=0.08709241788681465';
const SEARCH_URL_PORTLET = 'search?p_p_id=searchResult_WAR_arenaportlet&p_p_lifecycle=1&p_p_state=normal&p_r_p_arena_urn:arena_facet_queries=&p_r_p_arena_urn:arena_search_type=solr&p_r_p_arena_urn:arena_search_query=[BOOKQUERY]';
const ITEM_URL_PORTLET = 'results?p_p_id=crDetailWicket_WAR_arenaportlet&p_p_lifecycle=1&p_p_state=normal&p_r_p_arena_urn:arena_search_item_id=[ITEMID]&p_r_p_arena_urn:arena_facet_queries=&p_r_p_arena_urn:arena_agency_name=[ARENANAME]&p_r_p_arena_urn:arena_search_item_no=0&p_r_p_arena_urn:arena_search_type=solr';
const HOLDINGS_URL_PORTLET = 'results?p_p_id=crDetailWicket_WAR_arenaportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=/crDetailWicket/?wicket:interface=:0:recordPanel:holdingsPanel::IBehaviorListener:0:&p_p_cacheability=cacheLevelPage&p_p_col_id=column-2&p_p_col_pos=1&p_p_col_count=3';
const HOLDINGSDETAIL_URL_PORTLET = 'results?p_p_id=crDetailWicket_WAR_arenaportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=[RESOURCEID]&p_p_cacheability=';

export class ArenaV7Implementation implements IImplementation {
    constructor(client: IHttpClient) {
        this._client = client;
    }

    private _client: IHttpClient;

    async getLibraries(service: Service): Promise<LibraryResult> {
        const result = new LibraryResult(service.name, service.code);

        let $ = null;

        if (service.arenaV7.signupUrl) {
            // This service needs to be loaded using the signup page rather
            // than the advanced search page.
            const signupResponse = await this._client.get(service.arenaV7.signupUrl);
            signupResponse.ensureSuccessful();
            $ = cheerio.load(signupResponse.body);
      
            if ($('select[name="branches-div:choiceBranch"] option').length > 1) {
              $('select[name="branches-div:choiceBranch"] option').each(function () {
                if (isLibrary($(this).text())) result.branches.push($(this).text());
              });

              return result;
            }
            else if ($('select[name="BranchId"] option').length > 1) {
              $('select[name="BranchId"] option').each(function () {
                if (isLibrary($(this).text())) result.branches.push($(this).text());
              });

              return result;
            }
          }
      
        // Get the advanced search page
        const advancedSearchResponse = await this._client.get(`${service.arenaV7.url}${service.arenaV7.advancedUrl}`);
        advancedSearchResponse.ensureSuccessful();

        // The advanced search page may have libraries listed on it
        $ = cheerio.load(advancedSearchResponse.body);

        if ($('.arena-extended-search-branch-choice option').length > 1) {
          $('.arena-extended-search-branch-choice option').each(function () {
            if (isLibrary($(this).text())) result.branches.push($(this).text());
          });
          return result;
        }
      
        // If not we'll need to call a portlet to get the data
        const headers = { Accept: 'text/xml', 'Wicket-Ajax': true, 'Wicket-FocusedElementId': 'id__extendedSearch__WAR__arenaportlet____e', 'Content-Type': 'application/x-www-form-urlencoded' };
        const url = `${service.arenaV7.url}${service.arenaV7.advancedUrl}${LIBRARIES_URL_PORTLET}`;
        const responseHeaderRequest = await this._client.post(url, querystring.stringify({ 'organisationHierarchyPanel:organisationContainer:organisationChoice': service.arenaV7.organisationId }), headers);
        responseHeaderRequest.ensureSuccessful();
        
        const js = await xml2js.parseStringPromise(responseHeaderRequest.body);
      
        // Parse the results of the request
        if (js && js !== 'Undeployed' && js['ajax-response']?.component) {
          $ = cheerio.load(js['ajax-response'].component[0]._);
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
            results.push(result);

            let bookQuery = `number_index:${isbn}`;
            if (service.arenaV7.organisationId) 
                bookQuery = `organisationId_index:${service.arenaV7.organisationId}+AND+${bookQuery}`;
          
            const searchUrl = SEARCH_URL_PORTLET.replace('[BOOKQUERY]', bookQuery);
            result.url = `${service.arenaV7.url}${searchUrl}`;
          
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
          
            const itemDetailsUrl = ITEM_URL_PORTLET.replace('[ARENANAME]', service.arenaV7.arenaName).replace('[ITEMID]', itemId);
            const itemUrl = `${service.arenaV7.url}${itemDetailsUrl}`;
        
            const itemPageResponse = await this._client.get(itemUrl, { Connection: 'keep-alive' });
            itemPageResponse.ensureSuccessful();

            // Attempts to fix Bexley; seems very picky on the order of cookies (alphabetical) and insists
            // that there is a space after a semi-colon. However, even after that, it is still unreliable.
            //const cookie = /Cookie:([^\n]+)/gi.exec(itemPageResponse.req._header)[1].trim().split(';').sort().join('; ');
          
            // Get the item holdings widget
            const holdingsPanelHeader = { 
                Accept: 'text/xml', 
                'Wicket-Ajax': true
            };

            const holdingsPanelUrl = `${service.arenaV7.url}${HOLDINGS_URL_PORTLET}`;
        
            const holdingsPanelPortletResponse = await this._client.get(holdingsPanelUrl, holdingsPanelHeader);
            holdingsPanelPortletResponse.ensureSuccessful();

            const js = await xml2js.parseStringPromise(holdingsPanelPortletResponse.body);
        
            if (!js['ajax-response'] || !js['ajax-response'].component) 
                continue;

            let $ = cheerio.load(js['ajax-response'].component[0]._);
          
            if ($('.arena-holding-nof-total, .arena-holding-nof-checked-out, .arena-holding-nof-available-for-loan').length > 0) {
              $('.arena-holding-child-container').each(function (idx: number, container: cheerio.AnyNode) {
                const libName = $(container).find('span.arena-holding-link').text();
                const totalAvailable = parseInt($(container).find('.arena-holding-nof-total span.arena-value').text()) || 
                    (parseInt($(container).find('td.arena-holding-nof-available-for-loan span.arena-value').text() || '0') + parseInt($(container).find('td.arena-holding-nof-checked-out span.arena-value').text() || '0'));
                
                const checkedOut = $(container).find('.arena-holding-nof-checked-out span.arena-value').text();
                const av = ((totalAvailable ?? 0) - (checkedOut ? parseInt(checkedOut) : 0));
                const nav = (checkedOut !== '' ? parseInt(checkedOut) : 0);
        
                if (libName && ((av + nav) > 0)) 
                    result.availability.push(new Availability(libName, av, nav));
                });

                if (result.availability.length > 0) {
                    continue;
                }
            }
          
            let currentOrg = null;
            $('.arena-holding-hyper-container .arena-holding-container a span').each(function (i) { 
                if ($(this).text().trim() === (service.arenaV7.organisationName || service.name)) 
                    currentOrg = i; 
                });
            if (currentOrg == null) continue;
          
            const holdingsHeaders = { 
                Accept: 'text/xml', 
                'Wicket-Ajax': true ,
                'Wicket-FocusedElementId': 'id__crDetailWicket__WAR__arenaportlets____2a'
            };

            let resourceId = `/crDetailWicket/?wicket:interface=:0:recordPanel:holdingsPanel:content:holdingsView:${currentOrg + 1}:holdingContainer:togglableLink::IBehaviorListener:0:`;
            const holdingsUrl = `${service.arenaV7.url}${HOLDINGSDETAIL_URL_PORTLET.replace('[RESOURCEID]', resourceId)}`;
            const holdingsResponse = await this._client.get(holdingsUrl, holdingsHeaders);
            holdingsResponse.ensureSuccessful();

            const holdingsJs = await xml2js.parseStringPromise(holdingsResponse.body);
            $ = cheerio.load(holdingsJs['ajax-response'].component[0]._);
          
            const libsData = $('.arena-holding-container');
            const numLibs = libsData.length;
            if (!numLibs || numLibs === 0) 
                continue;

            const client = this._client;
          
            const availabilityRequests = [];
            libsData.each(function (i) {
              resourceId = `/crDetailWicket/?wicket:interface=:0:recordPanel:holdingsPanel:content:holdingsView:${currentOrg + 1}:childContainer:childView:${i}:holdingPanel:holdingContainer:togglableLink::IBehaviorListener:0:`;
              const libUrl = `${service.arenaV7.url}${HOLDINGSDETAIL_URL_PORTLET.replace('[RESOURCEID]', resourceId)}`;
              const headers = { Accept: 'text/xml', 'Wicket-Ajax': true };
              availabilityRequests.push(client.get(libUrl, headers));
            });
          
            const responses = await Promise.all(availabilityRequests);
          
            responses.forEach(async (response: HttpResponse) => {
                response.ensureSuccessful();
                const availabilityJs = await xml2js.parseStringPromise(response.body);

                if (availabilityJs && availabilityJs['ajax-response']) {
                    $ = cheerio.load(availabilityJs['ajax-response'].component[0]._);
                    const totalAvailable = $('.arena-holding-nof-total span.arena-value').text();
                    const checkedOut = $('.arena-holding-nof-checked-out span.arena-value').text();

                    $ = cheerio.load(availabilityJs['ajax-response'].component[2]._);
                    const av = ((totalAvailable ? parseInt(totalAvailable) : 0) - (checkedOut ? parseInt(checkedOut) : 0));
                    const nav = (checkedOut ? parseInt(checkedOut) : 0);
        
                    if ((av + nav) > 0)
                        result.availability.push(new Availability($('span.arena-holding-link').text(), av, nav));
              }
            });
        }

        return _.uniq(results, x => x.id);
    }
}