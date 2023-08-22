import { HttpResponse } from './HttpResponse';

/**
 * An interface supporting HTTP requests via GET and POST. This interface allows a custom HTTP agent to be used, if required.
 */
export interface IHttpClient {
    /**
     * Performs a GET on the given URL and passes the provided headers.
     * @param url The URL to be used in the request.
     * @param headers Optional headers to be included in the request.
     */
    get(url: string, headers?: Record<string, unknown>): Promise<HttpResponse>;

    /**
     * Performs a POST on the given URL and passes the provided optional body and headers.
     * @param url The URL to be used in the request.
     * @param body An optional string or object body. An object will be serialised.
     * @param headers Optional headers to be included in the request.
     */
    post(url: string, body?: string | Record<string, unknown>, headers?: Record<string, unknown>): Promise<HttpResponse>;
    
    /**
     * Retrieve a cookie value for a URL by name.
     * @param url The URL associated with the cookie.
     * @param name The cookie name.
     */
    getCookie(url:string, name: string): string;
}