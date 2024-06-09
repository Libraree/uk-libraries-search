import { expect, test } from '@jest/globals';
import * as services from '../src/services/services.json';
import * as data from './tests.json';
import * as _ from 'underscore';
import { ProxyCookieHttpClient } from '../tests/ProxyCookieHttpClient';
import { Client } from '../src';

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
    'Halton' // Cloudflare
];

const booksIgnoreList = [
    'Bexley', // LFR_SESSION_STATE cookie - JS-generated
    'Oxfordshire', // always fails on GitHub but works locally.,
    'Telford and Wrekin', // ability to search by ISBN removed.
    'Halton' // Cloudflare
];

const allTypes: string[] = [
    'arenaV6',
    'arenaV7',
    'durham',
    'enterprise',
    'iguana',
    'kohaV20',
    'kohaV22',
    'luci',
    'prism',
    'spydus',
    'vega'
];

const getServices = (type: string, ignoreList: string[]): string[][] => {
    return _.chain(services)
        .filter(x => x[type] !== undefined && !ignoreList.includes(x.name))
        .map(x => [ x.name, x.code ])
        .value();
};

const testLibraries = async (client: Client, name: string, code: string) => {
    const result = await client.listLibraries(code);
    
    expect(result.code).toEqual(code);
    expect(result.name).toEqual(name);
    expect(result.branches.length).toBeGreaterThan(0);
};

const testBooks = async(client: Client, name: string, code: string) => {
    const isbns = _.find(data, x => x.name == name)?.isbns as string[];
    const results = await client.searchBooks(code, isbns);

    expect(results).not.toHaveLength(0);

    const result = _.find(results, x => x.availability.length > 0);
    expect(result).toBeDefined();
    expect(result!.availability).not.toHaveLength(0);

    for(const a of result!.availability) {
        expect(a.total).toBeGreaterThan(0);
    }

    expect(result!.id).toBeTruthy();
};

const getProxy = (type: string): string => {
    return process.env[`${type.toUpperCase()}_PROXY`] ?? process.env.DEFAULT_PROXY;
};

/*
Tests are ordered so that proxied tests are run first. This is because an unused
SSH port forwarding connection will get disconnected if we prioritise direct tests.
*/

// Proxy
describe.each(_.chain(allTypes).filter(t => getProxy(t)).map(t => [ t ]).value())('Proxy: %p', (type: string) => {
    const httpClient = new ProxyCookieHttpClient(getProxy(type));
    const client = new Client(httpClient);
    
    describe('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string) => {
            await testLibraries(client, name, code);
        }, 600000);
    });

    describe('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string) => {
            await testBooks(client, name, code);
        }, 600000);
    });
});

// Direct
describe.each(_.chain(allTypes).filter(t => !getProxy(t)).map(t => [ t ]).value())('Direct: %p', (type: string) => {
    const httpClient = new ProxyCookieHttpClient();
    const client = new Client(httpClient);
    
    describe('Libraries', () => {
        test.concurrent.each(getServices(type, librariesIgnoreList))('%p %p', async (name: string, code: string) => {
            await testLibraries(client, name, code);
        }, 600000);
    });

    describe('Books', () => {
        test.concurrent.each(getServices(type, booksIgnoreList))('%p %p', async (name: string, code: string) => {
            await testBooks(client, name, code);
        }, 600000);
    });
});