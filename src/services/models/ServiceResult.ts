export class ServiceResult {
    /** @type {string} The name of the library service. */
    name: string;
    /** @type {string} The Office for National Statistics GSS (Government Statistical Service) code for the local authority. */
    code: string;
    /** @type {string} The application name of the library service's catalogue system. */
    type: string;
    /** @type {string} The URL for the library catalogue's home page. */
    catalogueUrl: string;

    constructor(name: string, code: string, type: string, catalogueUrl: string) {
        this.name = name;
        this.code = code;
        this.type = type;
        this.catalogueUrl = catalogueUrl;
    }
}