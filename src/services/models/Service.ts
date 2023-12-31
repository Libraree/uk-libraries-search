export class Service {
    name: string;
    code: string;
    catalogueUrl: string;
    arenaV6?: ArenaV6;
    arenaV7?: ArenaV7;
    blackpool?: Blackpool;
    durham?: Durham;
    enterprise?: Enterprise;
    iguana?: Iguana;
    kohaV20?: KohaV20;
    kohaV22?: KohaV22;
    luci?: Luci;
    prism?: Prism;
    spydus?: Spydus;
    webpac?: Webpac;

    get type(): string {
        if (this.arenaV6 !== undefined) return 'ArenaV6';
        if (this.arenaV7 !== undefined) return 'ArenaV7';
        if (this.blackpool !== undefined) return 'Blackpool';
        if (this.durham !== undefined) return 'Durham';
        if (this.enterprise !== undefined) return 'Enterprise';
        if (this.iguana !== undefined) return 'Iguana';
        if (this.kohaV20 !== undefined) return 'KohaV20';
        if (this.kohaV22 !== undefined) return 'KohaV22';
        if (this.luci !== undefined) return 'Luci';
        if (this.prism !== undefined) return 'Prism';
        if (this.spydus !== undefined) return 'Spydus';
        if (this.webpac !== undefined) return 'Webpac';
        throw 'Unknown service type.';
    }
}

export class ArenaV6 {
    url: string;
    organisationName?: string;
    organisationId: string;
    arenaName: string;
    advancedUrl: string;
}

export class ArenaV7 {
    url: string;
    isbnAlias: string;
    organisationName: string;
    organisationId: string;
    arenaName: string;
    advancedUrl: string;
    signupUrl?: string;
}

export class Blackpool {
    url: string;
}

export class Durham {
    url: string;
}

export class Enterprise {
    url: string;
    titleDetailUrl?: string;
    libraryNameFilter?: string;
    availabilityUrl?: string;
    available: string[];
}

export class Iguana {
    url: string;
    database: string;
}

export class KohaV20 {
    url: string;
}

export class KohaV22 {
    url: string;
}

export class Luci {
    url: string;
    home: string;
}

export class Prism {
    url: string;
    available: string[];
}

export class Spydus {
    url: string;
    branches?: string[];
}

export class Webpac {
    url: string;
}