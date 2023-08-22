import { expect, test } from '@jest/globals';
import * as services from '../src/services/services.json';
import * as data from './tests.json';
import { Service } from '../src/services/models/Service';
import { IImplementation } from '../src/search/implementations/IImplementation';
import { BlackpoolImplementation } from '../src/search/implementations/BlackpoolImplementation';
import { SpydusImplementation } from '../src/search/implementations/SpydusImplementation';
import { ArenaV6Implementation } from '../src/search/implementations/ArenaV6Implementation';
import { ArenaV7Implementation } from '../src/search/implementations/ArenaV7Implementation';
import { DurhamImplementation } from '../src/search/implementations/DurhamImplementation';
import { EnterpriseImplementation } from '../src/search/implementations/EnterpriseImplementation';
import { IbistroImplementation } from '../src/search/implementations/IbistroImplementation';
import { IguanaImplementation } from '../src/search/implementations/IguanaImplementation';
import { KohaV20Implementation } from '../src/search/implementations/KohaV20Implementation';
import { KohaV22Implementation } from '../src/search/implementations/KohaV22Implementation';
import { LuciImplementation } from '../src/search/implementations/LuciImplementation';
import { PrismImplementation } from '../src/search/implementations/PrismImplementation';
import { WebpacImplementation } from '../src/search/implementations/WebpacImplementation';
import * as _ from 'underscore';
import { ProxyCookieHttpClient } from '../tests/ProxyCookieHttpClient';

/*
The sequence of ISBNs is generally as follows:

1. Harry Potter and the Philosopher's Stone
2. Nineteen Eighty Four
3. Pride and Prejudice
4. Hamlet
5. Gangsta Granny

Where a library doesn't have one of the above books, a similar book
has been substituted: another J K Rowling, Jane Austin or David Walliams
book, for example.
*/

//process.env.DEFAULT_PROXY = 'http://127.0.0.1:9090';
//process.env.LUCI_PROXY = 'http://127.0.0.1:3128';

const librariesIgnoreList = [
];

const booksIgnoreList = [
    'Bexley', // LFR_SESSION_STATE cookie - JS-generated
    'Bournemouth' // No availability information on item pages.
];

const getServices = (type: string, ignoreList: string[]): (string | Service)[][] => {
    return _.chain(services)
        .filter(x => x[type] !== undefined && !ignoreList.includes(x.name))
        .map(x => [ x.name, x.code, x as Service ])
        .value();
};

const testLibraries = async (implementation: IImplementation, name: string, code: string, srv: Service) => {
    const service = Object.assign(new Service(), srv);
    const result = await implementation.getLibraries(service);
    
    expect(result.code).toEqual(code);
    expect(result.name).toEqual(name);
    expect(result.branches.length).toBeGreaterThan(0);
};

const testBooks = async(implementation: IImplementation, name: string, code: string, srv: Service) => {
    const service = Object.assign(new Service(), srv);
    const isbns = _.find(data, x => x.name == name)?.isbns as string[];
    const results = await implementation.getBooks(service, isbns);

    expect(results).not.toHaveLength(0);

    const result = _.find(results, x => x.availability.length > 0);
    expect(result).toBeDefined();
    expect(result!.availability).not.toHaveLength(0);

    for(const a of result!.availability) {
        expect(a.total).toBeGreaterThan(0);
    }

    expect(result!.id).toBeTruthy();
};

describe.skip('Arena V6', () => {
    const type = 'arenaV6';
    const client = new ProxyCookieHttpClient(process.env.ARENAV6_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new ArenaV6Implementation(client);
    
    describe.skip('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});

describe.skip('Arena V7', () => {
    const type = 'arenaV7';
    const client = new ProxyCookieHttpClient(process.env.ARENAV7_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new ArenaV7Implementation(client);
    
    describe.skip('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});

describe.skip('Blackpool', () => {
    const type = 'blackpool';
    const client = new ProxyCookieHttpClient(process.env.BLACKPOOL_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new BlackpoolImplementation(client);
    
    describe.skip('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});

describe.skip('Durham', () => {
    const type = 'durham';
    const client = new ProxyCookieHttpClient(process.env.DURHAM_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new DurhamImplementation(client);
    
    describe.skip('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});

describe.skip('Enterprise', () => {
    const type = 'enterprise';
    const client = new ProxyCookieHttpClient(process.env.ENTERPRISE_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new EnterpriseImplementation(client);
    
    describe.skip('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});

describe.skip('Ibistro', () => {
    const type = 'ibistro';
    const client = new ProxyCookieHttpClient(process.env.IBISTRO_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new IbistroImplementation(client);
    
    describe.skip('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});

describe.skip('Iguana', () => {
    const type = 'iguana';
    const client = new ProxyCookieHttpClient(process.env.IGUANA_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new IguanaImplementation(client);
    
    describe.skip('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});

describe.skip('Koha V20', () => {
    const type = 'kohaV20';
    const client = new ProxyCookieHttpClient(process.env.KOHAV20_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new KohaV20Implementation(client);
    
    describe.skip('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});

describe.skip('Koha V22', () => {
    const type = 'kohaV22';
    const client = new ProxyCookieHttpClient(process.env.KOHAV22_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new KohaV22Implementation(client);
    
    describe.skip('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});

describe('Luci', () => {
    const type = 'luci';
    const client = new ProxyCookieHttpClient(process.env.LUCI_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new LuciImplementation(client);
    
    describe('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});

describe.skip('Prism', () => {
    const type = 'prism';
    const client = new ProxyCookieHttpClient(process.env.PRISM_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new PrismImplementation(client);
    
    describe.skip('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});

describe.skip('Spydus', () => {
    const type = 'spydus';
    const client = new ProxyCookieHttpClient(process.env.SPYDUS_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new SpydusImplementation(client);
    
    describe.skip('Libraries', () => {
            test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
                await testLibraries(implementation, name, code, service);
            }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
                await testBooks(implementation, name, code, service);
            }, 600000);
    });
});

describe.skip('Webpac', () => {
    const type = 'webpac';
    const client = new ProxyCookieHttpClient(process.env.WEBPAC_PROXY ?? process.env.DEFAULT_PROXY);
    const implementation = new WebpacImplementation(client);
    
    describe.skip('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testLibraries(implementation, name, code, service);
        }, 600000);
    });

    describe.skip('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string, service: Service) => {
            await testBooks(implementation, name, code, service);
        }, 600000);
    });
});