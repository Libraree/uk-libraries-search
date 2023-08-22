import { expect, test } from '@jest/globals';
import { Services } from '../../../src/services/Services';
import { ProxymanHttpClient } from '../../ProxymanHttpClient';
import { DurhamImplementation } from '../../../src/search/implementations/DurhamImplementation';

const folder = `${__dirname}/../data/durham`;
const services = new Services();

test('Gets Libraries', async () => {
    const service = 'Durham';
    const client = new ProxymanHttpClient(`${folder}/durham-libraries.proxymanlogv2`);
    const impl = new DurhamImplementation(client);
    const result = await impl.getLibraries(services.getService(service));
    expect(result.name).toEqual(service);
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Gets Books', async () => {
    const service = 'Durham';
    const client = new ProxymanHttpClient(`${folder}/durham-search.proxymanlogv2`);
    const impl = new DurhamImplementation(client);
    const result = await impl.getBooks(services.getService(service), [
        '9780747532743',
        '9780141187761',
        '9780141439518',
        '0141013079',
        '9780007371464'
    ]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].service).toEqual(service);
    expect(result[0].id).toBeDefined();
    expect(result[0].code).toBeDefined();
    expect(result[0].url).toBeDefined();
    expect(result[0].isbn).toBeDefined();
    expect(result[0].availability.length).toBeGreaterThan(0);
});