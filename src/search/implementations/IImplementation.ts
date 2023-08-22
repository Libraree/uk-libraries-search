import { Service } from '../../services/models/Service';
import { LibraryResult } from '../models/LibraryResult';
import { SearchResult } from '../models/SearchResult';

export interface IImplementation {
    getLibraries(service: Service): Promise<LibraryResult>;
    getBooks(service: Service, isbns: string[]): Promise<SearchResult[]>;
}