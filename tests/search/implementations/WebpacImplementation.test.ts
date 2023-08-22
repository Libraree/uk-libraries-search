import { expect, test } from '@jest/globals';
import { Services } from '../../../src/services/Services';
import { ProxymanHttpClient } from '../../ProxymanHttpClient';
import { WebpacImplementation } from '../../../src/search/implementations/WebpacImplementation';

const folder = `${__dirname}/../data/webpac`;
const services = new Services();

test('Gets Libraries', async () => {
    const service = 'South Ayrshire';
    const client = new ProxymanHttpClient(`${folder}/southayrshire-libraries.proxymanlogv2`);
    const impl = new WebpacImplementation(client);
    const result = await impl.getLibraries(services.getService(service));
    expect(result.name).toEqual(service);
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Gets Books', async () => {
    const service = 'South Ayrshire';
    const client = new ProxymanHttpClient(`${folder}/southayrshire-search.proxymanlogv2`);
    const impl = new WebpacImplementation(client);
    const result = await impl.getBooks(services.getService(service), [
        '9780590353427',
        '9780141187761',
        '9780141040349',
        '9780140620580',
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