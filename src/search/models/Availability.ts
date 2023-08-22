/**
 * Availability information for a book at a library branch.
 */
export class Availability {
    /** @type {string} The name of the library branch. */
    branch: string;
    /** @type {number} The number of available copies at the library branch. */
    available: number;
    /** @type {number} The number of unavailable copies at the library branch. */
    unavailable: number;

    constructor(library: string, available: number, unavailable: number) {
        this.branch = library;
        this.available = available;
        this.unavailable = unavailable;
    }

    /** @type {number} The total number of copies at the library branch. */
    public get total() : number {
        return this.available + this.unavailable;
    }
}