import { expect, test } from '@jest/globals';
import { Services } from '../../../src/services/Services';
import { ProxymanHttpClient } from '../../ProxymanHttpClient';
import { PrismImplementation } from '../../../src/search/implementations/PrismImplementation';

const folder = `${__dirname}/../data/prism`;
const services = new Services();

test('Gets Libraries', async () => {
    const service = 'Walsall';
    const client = new ProxymanHttpClient(`${folder}/walsall-libraries.proxymanlogv2`);
    const impl = new PrismImplementation(client);
    const result = await impl.getLibraries(services.getService(service));
    expect(result.name).toEqual(service);
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Gets Books', async () => {
    const service = 'Walsall';
    const client = new ProxymanHttpClient(`${folder}/walsall-search.proxymanlogv2`);
    const impl = new PrismImplementation(client);
    const result = await impl.getBooks(services.getService(service), [
        '9781408855652',
        '9780141187761',
        '9780141439518',
        '9780486272788',
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