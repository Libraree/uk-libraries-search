import { IClient } from './IClient';
import { LibraryResult } from './search/models/LibraryResult';
import { SearchResult } from './search/models/SearchResult';
import { Services } from './services/Services';
import { ServiceResult } from './services/models/ServiceResult';
import { IImplementation } from './search/implementations/IImplementation';
import { IHttpClient } from './net/IHttpClient';
import { SuperAgentHttpClient } from './net/SuperAgentHttpClient';
import { ArenaV6Implementation } from './search/implementations/ArenaV6Implementation';
import { ArenaV7Implementation } from './search/implementations/ArenaV7Implementation';
import { BlackpoolImplementation } from './search/implementations/BlackpoolImplementation';
import { DurhamImplementation } from './search/implementations/DurhamImplementation';
import { EnterpriseImplementation } from './search/implementations/EnterpriseImplementation';
import { IbistroImplementation } from './search/implementations/IbistroImplementation';
import { IguanaImplementation } from './search/implementations/IguanaImplementation';
import { KohaV20Implementation } from './search/implementations/KohaV20Implementation';
import { KohaV22Implementation } from './search/implementations/KohaV22Implementation';
import { LuciImplementation } from './search/implementations/LuciImplementation';
import { PrismImplementation } from './search/implementations/PrismImplementation';
import { SpydusImplementation } from './search/implementations/SpydusImplementation';
import { WebpacImplementation } from './search/implementations/WebpacImplementation';

/**
 * Queries library services for books and finds other library information.
 */
export class Client implements IClient {
    private _services = new Services();
    private _implementations: Record<string, IImplementation> = {};

    /**
     * 
     * @param httpClient {IHttpClient} An optional IHttpClient instance to cater for custom HTTP implementations. Defaults to a SuperAgent implementation, if not specified.
     */
    constructor(httpClient?: IHttpClient) {
        httpClient ??= new SuperAgentHttpClient();
        this._implementations['ArenaV6'] = new ArenaV6Implementation(httpClient);
        this._implementations['ArenaV7'] = new ArenaV7Implementation(httpClient);
        this._implementations['Blackpool'] = new BlackpoolImplementation(httpClient);
        this._implementations['Durham'] = new DurhamImplementation(httpClient);
        this._implementations['Enterprise'] = new EnterpriseImplementation(httpClient);
        this._implementations['Ibistro'] = new IbistroImplementation(httpClient);
        this._implementations['Iguana'] = new IguanaImplementation(httpClient);
        this._implementations['KohaV20'] = new KohaV20Implementation(httpClient);
        this._implementations['KohaV22'] = new KohaV22Implementation(httpClient);
        this._implementations['Luci'] = new LuciImplementation(httpClient);
        this._implementations['Prism'] = new PrismImplementation(httpClient);
        this._implementations['Spydus'] = new SpydusImplementation(httpClient);
        this._implementations['Webpac'] = new WebpacImplementation(httpClient);
    }

    getService(service: string): ServiceResult {
        const srv = this._services.getService(service);        
        return new ServiceResult(srv.name, srv.code, srv.type, srv.catalogueUrl);
    }

    listServices(): ServiceResult[] {
        return this._services.listServices().map(x => new ServiceResult(x.name, x.code, x.type, x.catalogueUrl));
    }

    async listLibraries(service: string): Promise<LibraryResult> {
        const srv = this._services.getService(service);
        const client = this._implementations[srv.type];
        return await client.getLibraries(srv);
    }

    async searchBook(service: string, isbn: string): Promise<SearchResult> {
        const result = await this.searchBooks(service, [ isbn ]);

        if (result && result.length >= 1)
            return result[0];

        return null;
    }

    async searchBooks(service: string, isbns: string[]): Promise<SearchResult[]> {
        const srv = this._services.getService(service);
        const client = this._implementations[srv.type];
        return await client.getBooks(srv, isbns);
    }

}