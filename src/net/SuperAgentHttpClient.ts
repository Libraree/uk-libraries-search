import { CookieAccessInfo } from 'cookiejar';
import { HttpResponse } from './HttpResponse';
import { IHttpClient } from './IHttpClient';
import * as request from 'superagent';
import { UserAgent } from './Constants';

export class SuperAgentHttpClient implements IHttpClient {
    private _agent = request.agent();

    async get(url: string, headers?: Record<string, unknown>): Promise<HttpResponse> {
        try {
            headers = headers ?? {};

            if (!Object.keys(headers).includes('User-Agent'))
                headers['User-Agent'] = UserAgent;

            const response = await this._agent.get(url).set(headers).timeout(30000);
            return new HttpResponse(response.status, response.request.url, response.text);
        }
        catch(e) {
            return new HttpResponse(e.status ?? 0, e.response?.request?.url, e.text ?? e.message);
        }
    }

    async post(url: string, body?: string | Record<string, unknown>, headers?: Record<string, unknown>): Promise<HttpResponse> {
        try {
            headers = headers ?? {};

            if (!Object.keys(headers).includes('User-Agent'))
                headers['User-Agent'] = UserAgent;

            const response = await this._agent.post(url).set(headers).send(body).timeout(30000);
            return new HttpResponse(response.status, response.request.url, response.text);
        }
        catch(e) {
            return new HttpResponse(e.status ?? 0, e.response?.request?.url, e.text ?? e.message);
        }
    }

    getCookie(url: string, name: string): string {
        const parsed = new URL(url);
        const info = new CookieAccessInfo(parsed.host, parsed.pathname, 'https:' == parsed.protocol);
        return this._agent.jar.getCookie(name, info)?.value;
    }
}