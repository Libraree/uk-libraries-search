import { HttpResponse } from '../src/net/HttpResponse';
import { IHttpClient } from '../src/net/IHttpClient';
import { HttpsProxyAgent, HttpProxyAgent } from 'hpagent';
import * as needle from 'needle';
import { Cookie, CookieJar } from 'tough-cookie';
import { URL} from 'node:url';
import _ = require('underscore');
import { UserAgent } from '../src/net/Constants';

/**
 * Used in Node integration tests and supports both a proxy and the collection
 * and managemed of cookies.
 */
export class ProxyCookieHttpClient implements IHttpClient {
    private _useProxy = false;
    private _httpProxy: HttpProxyAgent;
    private _httpsProxy: HttpsProxyAgent;
    private _cookies = new CookieJar();

    /**
     * Creats a new ProxyCookieHttpClient.
     * @param proxy The optional URL of a proxy server, e.g. http://127.0.0.1:9090.
     */
    constructor(proxy?: string) {
        if (proxy) {
            this._useProxy = true;

            this._httpProxy = new HttpProxyAgent({
                keepAlive: true,
                keepAliveMsecs: 1000,
                maxSockets: 256,
                maxFreeSockets: 256,
                scheduling: 'lifo',
                proxy: proxy
              });
    
            this._httpsProxy = new HttpsProxyAgent({
                keepAlive: true,
                keepAliveMsecs: 1000,
                maxSockets: 256,
                maxFreeSockets: 256,
                scheduling: 'lifo',
                proxy: proxy
              });
        }
    }

    async get(url: string, headers?: Record<string, unknown>): Promise<HttpResponse> {
        let status = 300;
        let needleResponse: needle.NeedleResponse;

        while (status >= 300 && status <= 399) {
            needleResponse = await this.getInternal(url, headers);
            status = needleResponse.statusCode;

            if (needleResponse.headers.location) {
                headers ??= {};
                headers['referer'] = url;
                const temp = new URL(needleResponse.headers.location, url);
                url = temp.toString();
            }
        }

        return new HttpResponse(needleResponse.statusCode, url, needleResponse.body);
    }

    async post(url: string, body?: string | Record<string, unknown>, headers?: Record<string, unknown>): Promise<HttpResponse> {
        const needleResponse = await this.postInternal(url, body, headers);

        if (needleResponse.statusCode >= 300 && needleResponse.statusCode <= 399) {
            const temp = new URL(needleResponse.headers.location, url);
            url = temp.toString();

            headers ??= {};
            headers['referer'] = url;
            delete headers['content-type'];

            return await this.get(url, headers);
        }

        return new HttpResponse(needleResponse.statusCode, url, needleResponse.body);
    }

    getCookie(url: string, name: string): string {
        const cookies = this._cookies.getCookiesSync(url);
        return _.find(cookies, x => x.key == name)?.value;
    }

    private async getInternal(url: string, headers?: Record<string, unknown>): Promise<needle.NeedleResponse> {
        const sendCookies = await this._cookies.getCookies(url);
        const cookieObject: Record<string, string> = {};
        
        for (const c of sendCookies) {
            cookieObject[c.key] = c.value;
        }

        const response = await needle('get', url, {
            cookies: cookieObject,
            parse: false,
            headers,
            user_agent: UserAgent,
            agent: this._useProxy && url.indexOf('https') == 0 ? this._httpsProxy : (this._useProxy ? this._httpProxy : undefined),
            rejectUnauthorized: false
          });

        if (response.cookies) {
            const receiveCookies = response.headers['set-cookie'].map(x => Cookie.parse(x));
            receiveCookies.forEach(async x => await this._cookies.setCookie(x, url));
        }

        return response;
    }

    private async postInternal(url: string, body?: string | Record<string, unknown>, headers?: Record<string, unknown>): Promise<needle.NeedleResponse> {
        const sendCookies = await this._cookies.getCookies(url);
        const cookieObject: Record<string, string> = {};
        
        for (const c of sendCookies) {
            cookieObject[c.key] = c.value;
        }

        const response = await needle('post', url, body, {
            cookies: cookieObject,
            parse: false,
            headers: headers as Record<string, string>,
            user_agent: UserAgent,
            agent: this._useProxy && url.indexOf('https') == 0 ? this._httpsProxy : (this._useProxy ? this._httpProxy : undefined),
            rejectUnauthorized: false,
            json: typeof body !== 'string' 
          });

        if (response.cookies) {
            const receiveCookies = response.headers['set-cookie'].map(x => Cookie.parse(x));
            receiveCookies.forEach(async x => await this._cookies.setCookie(x, url));
        }

        return response;
    }
}