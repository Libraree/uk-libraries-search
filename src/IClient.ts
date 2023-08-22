import { ServiceResult } from './services/models/ServiceResult';
import { LibraryResult } from './search/models/LibraryResult';
import { SearchResult } from './search/models/SearchResult';

/**
 * The primary interface for querying library services for books and finding other library information.
 */
export interface IClient {
    /**
     * Gets the detail of a library service using its name or code.
     * @param {string} service The name or code for the library service.
     * @returns {ServiceResult} The details of a library service.
     */
    getService(service: string): ServiceResult;

    /**
     * Lists all the library services implemented in this library.
     * @returns {ServiceResult[]} The details of each library service.
     */
    listServices(): ServiceResult[];

    /**
     * Lists all the local libraries within a library service.
     * @param {string} service The name or code for the library service.
     * @returns {LibraryResult} The details of the local libraries within a library service.
     */
    listLibraries(service: string): Promise<LibraryResult>;

    /**
     * Gets book and library branch availability information by ISBN.
     * @param {string} service The name or code for the library service.
     * @param {string} isbn The ISBN for the book.
     * @returns {SearchResult} The book and library branch availability information.
     */
    searchBook(service: string, isbn: string): Promise<SearchResult>;

    /**
     * Gets book and library branch availability information by ISBN.
     * @param {string} service The name or code for the library service.
     * @param {string} isbn The ISBNs for several books.
     * @returns {SearchResult[]} The book and library branch availability information.
     */
    searchBooks(service: string, isbn: string[]): Promise<SearchResult[]>;
}