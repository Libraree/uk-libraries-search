/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpResponse } from '../src/net/HttpResponse';
import { IHttpClient } from '../src/net/IHttpClient';
import * as AdmZip from 'adm-zip';
import * as _ from 'underscore';

/**
 * Reads a Proxyman log file and uses it as the basis for returning
 * canned responses to unit tests. Redirects (301, 302, 308) are ignored.
 * 
 * Test requests must be made in the same order as the requests in the
 * log file. No check is made on the HTTP method; i.e. if the ordering is wrong,
 * it's possible to receive the result of a GET to a POST request.
 * 
 * https://proxyman.io/
 */
export class ProxymanHttpClient implements IHttpClient {
    private _mocks: ProxymanResponse[] = [];

    /**
     * Creates a Proxyman IHttpClient using a log file.
     * @param filename The filename and path to a Proxyman log file.
     */
    constructor(filename: string) {
        // Proxyman log files are actually renamed Zip archives. Each file within
        // the archive is a JSON file without a file extension. The filename is the
        // request ID from Proxyman.
        const zip = new AdmZip(filename);

        // Ensure we process the requests in order.
        const zipEntries = _.sortBy(zip.getEntries(), x => x.name); 

        for (const zipEntry of zipEntries) {
            const obj = JSON.parse(zipEntry.getData().toString('utf8'));

            if ((obj.request.method.name == 'GET' || obj.request.method.name == 'POST') 
                && obj.response.status.code != 301 && obj.response.status.code != 302 && obj.response.status.code != 308) {
                this._mocks.push(new ProxymanResponse(
                                        obj.request.method.name == 'GET' ? Method.Get : Method.Post, 
                                        obj.request.fullPath, 
                                        obj.response.status.code, 
                                        // The bodyData value is Base64 encoded.
                                        Buffer.from(obj.response.bodyData, 'base64').toString('utf-8')));
            }
        }
    }

    async get(url: string, headers?: Record<string, unknown> | undefined): Promise<HttpResponse> {
        const response = this._mocks.shift();
        return new HttpResponse(response.code, response.url, response.text);
    }

    async post(url: string, body?: string | Record<string, unknown> | undefined, headers?: Record<string, unknown> | undefined): Promise<HttpResponse> {
        const response = this._mocks.shift();
        return new HttpResponse(response.code, response.url, response.text);
    }

    getCookie(url:string, name: string): string {
        // The returned value needs to be long enough for substring operations in the Iguana implementation.
        // The actual value is not used meaningfully in the unit tests themselves.
        return '3770518017d14f16a2a77c9b70ba6cf86fa5ca1fefc64581b25332ae1e8dea15';
    }
}

enum Method {
    Get,
    Post
}

class ProxymanResponse {
    method: Method;
    url: string;
    code: number;
    text: string;

    constructor(method: Method, url: string, code: number, text: string) {
        this.method = method;
        this.url = url;
        this.code = code;
        this.text = text;
    }
}
