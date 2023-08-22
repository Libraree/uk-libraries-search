/**
 * A list of branches within a library service.
 */
export class LibraryResult {
    /** @type {string} The name of the library service. */
    name: string;
    /** @type {string} The Office for National Statistics GSS (Government Statistical Service) code for the local authority. */
    code: string;
    /** @type {string} The library branch names. */
    branches: string[] = [];

    constructor(name: string, code: string) {
        this.name = name;
        this.code = code;
    }
}