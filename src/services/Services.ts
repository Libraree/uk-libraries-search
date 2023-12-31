import * as _ from 'underscore'
;import { 
    ArenaV6, 
    ArenaV7, 
    Blackpool, 
    Durham, 
    Enterprise, 
    Iguana, 
    KohaV20, 
    KohaV22, 
    Luci, 
    Prism, 
    Service, 
    Spydus, 
    Webpac } from './models/Service';
import * as services from './services.json';

export class Services {
    listServices(): Service[] {
        return _.chain(services)
            .map(x => this.mapService(x))
            .sortBy(x => x.name)
            .value();
    }

    getService(identifier: string): Service {
        const service = _.find(services, x => x.code == identifier || x.name == identifier);
        
        if (service != null) 
            return this.mapService(service);
        
        throw 'Service not found';
    }

    private mapService(service: Record<string, unknown>): Service {
        // service is an object, not a Service (class). That means the 'type' property
        // won't work unless we cast it to a concrete class. However, Object.assign
        // doesn't work on child-level objects, so we must do these separately. Casting
        // child-level objects allows us to review code coverage and remove properties
        // that have become redundant over time.
        const result = new Service();
        Object.assign(result, service);

        switch(result.type) {
            case 'ArenaV6':
                result.arenaV6 = Object.assign(new ArenaV6(), service.arenaV6);
                break;
            case 'ArenaV7':
                result.arenaV7 = Object.assign(new ArenaV7(), service.arenaV7);
                break;
            case 'Blackpool':
                result.blackpool = Object.assign(new Blackpool(), service.blackpool);
                break;
            case 'Durham':
                result.durham = Object.assign(new Durham(), service.durham);
                break;
            case 'Enterprise':
                result.enterprise = Object.assign(new Enterprise(), service.enterprise);
                break;
            case 'Iguana':
                result.iguana = Object.assign(new Iguana(), service.iguana);
                break;
            case 'KohaV20':
                result.kohaV20 = Object.assign(new KohaV20(), service.kohaV20);
                break;
            case 'KohaV22':
                result.kohaV22 = Object.assign(new KohaV22(), service.kohaV22);
                break;
            case 'Luci':
                result.luci = Object.assign(new Luci(), service.luci);
                break;
            case 'Prism':
                result.prism = Object.assign(new Prism(), service.prism);
                break;
            case 'Spydus':
                result.spydus = Object.assign(new Spydus(), service.spydus);
                break;
            case 'Webpac':
                result.webpac = Object.assign(new Webpac(), service.webpac);
                break;
        }

        return result;
    }
}