import { HttpError } from './HttpError';

/**
 * A response to an HTTP request.
 */
export class HttpResponse {
    status = 0;
    url: string;
    body?: string;

    /**
     * Creates an HTTP response.
     * @param status The HTTP status code.
     * @param url The final URL (after any redirects).
     * @param body The response body as a string.
     */
    constructor(status: number, url:string, body?: string) {
        this.status = status;
        this.url = url;
        this.body = body;
    }

    /**
     * Returns true if the HTTP status code is between 200 and 399 inclusive.
     */
    get successful(): boolean {
        return this.status >= 200 && this.status < 400;
    }

    /**
     * Converts the HTTP response body into a JSON object.
     * @returns An object.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getBodyAsJson(): any {
        return JSON.parse(this.body);
    }

    /**
     * Throws an exception if the HTTP request wasn't successful (i.e. the HTTP status code is not between 200 and 399 inclusive).
     */
    ensureSuccessful(): void {
        if (!this.successful) {
            if (this.status > 0) {
                throw { status: this.status, body: this.body, message: `HTTP request failed with status code ${this.status}.`} as HttpError;
            }
            else {
                throw { body: this.body, message: 'HTTP request failed.'} as HttpError;
            }
        }
    }
}