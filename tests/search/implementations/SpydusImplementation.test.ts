import { expect, test } from '@jest/globals';
import { SpydusImplementation } from '../../../src/search/implementations/SpydusImplementation';
import { Services } from '../../../src/services/Services';
import { ProxymanHttpClient } from '../../ProxymanHttpClient';

const folder = `${__dirname}/../data/spydus`;
const services = new Services();

test('Gets Libraries', async () => {
    const service = 'Wigan';
    const client = new ProxymanHttpClient(`${folder}/wigan-libraries.proxymanlogv2`);
    const impl = new SpydusImplementation(client);
    const result = await impl.getLibraries(services.getService(service));
    expect(result.name).toEqual(service);
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Gets Books', async () => {
    const service = 'Wigan';
    const client = new ProxymanHttpClient(`${folder}/wigan-search.proxymanlogv2`);
    const impl = new SpydusImplementation(client);
    const result = await impl.getBooks(services.getService(service), [
        '9780747532743',
        '9780141036144',
        '9780141439518',
        '9781904271338',
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