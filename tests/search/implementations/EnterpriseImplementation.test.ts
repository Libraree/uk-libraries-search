import { expect, test } from '@jest/globals';
import { Services } from '../../../src/services/Services';
import { ProxymanHttpClient } from '../../ProxymanHttpClient';
import { EnterpriseImplementation } from '../../../src/search/implementations/EnterpriseImplementation';

const folder = `${__dirname}/../data/enterprise`;
const services = new Services();

test('Gets Libraries', async () => {
    const service = 'Sir Ceredigion - Ceredigion';
    const client = new ProxymanHttpClient(`${folder}/ceredigion-libraries.proxymanlogv2`);
    const impl = new EnterpriseImplementation(client);
    const result = await impl.getLibraries(services.getService(service));
    expect(result.name).toEqual(service);
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Gets Books with redirects', async () => {
    const service = 'Sir Ceredigion - Ceredigion';
    const client = new ProxymanHttpClient(`${folder}/ceredigion-search.proxymanlogv2`);
    const impl = new EnterpriseImplementation(client);
    const result = await impl.getBooks(services.getService(service), [
        '9780747532743',
        '9780141187761',
        '9780141439518',
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

test('Gets Books without redirects', async () => {
    const service = 'Somerset';
    const client = new ProxymanHttpClient(`${folder}/somerset-search.proxymanlogv2`);
    const impl = new EnterpriseImplementation(client);
    const result = await impl.getBooks(services.getService(service), [
        '9780747532743',
        '9780141187761',
        '9780553213102',
        '9780521618748',
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