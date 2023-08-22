import { Availability } from './Availability';

/**
 * An ISBN search result, including branch availability information.
 */
export class SearchResult {
    /** @type {string} The identifier for the book in the library service's catalogue. */
    id: string;
    /** @type {string} The name of the library service. */
    service: string;
    /** @type {string} The Office for National Statistics GSS (Government Statistical Service) code for the local authority. */
    code: string;
    /** @type {string} The ISBN for the book. */
    isbn: string;
    /** @type {string} The URL at which the detail of the holding can be viewed in the library service's catalogue. */
    url: string;
    /** @type {Availability[]} Availability information for the book at local branches. */
    availability: Availability[] = [];

    constructor(service: string, code: string, isbn: string) {
        this.service = service;
        this.code = code;
        this.isbn = isbn;
    }
}