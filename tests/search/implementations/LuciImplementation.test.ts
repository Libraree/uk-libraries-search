import { expect, test } from '@jest/globals';
import { Services } from '../../../src/services/Services';
import { ProxymanHttpClient } from '../../ProxymanHttpClient';
import { LuciImplementation } from '../../../src/search/implementations/LuciImplementation';

const folder = `${__dirname}/../data/luci`;
const services = new Services();

test('Gets Libraries', async () => {
    const service = 'Sutton';
    const client = new ProxymanHttpClient(`${folder}/sutton-libraries.proxymanlogv2`);
    const impl = new LuciImplementation(client);
    const result = await impl.getLibraries(services.getService(service));
    expect(result.name).toEqual(service);
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Gets Books', async () => {
    const service = 'Sutton';
    const client = new ProxymanHttpClient(`${folder}/sutton-search.proxymanlogv2`);
    const impl = new LuciImplementation(client);
    const result = await impl.getBooks(services.getService(service), [
        '9780747532743',
        '9781405807043',
        '9781405862462',
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