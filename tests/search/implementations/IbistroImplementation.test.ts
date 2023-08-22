import { expect, test } from '@jest/globals';
import { Services } from '../../../src/services/Services';
import { ProxymanHttpClient } from '../../ProxymanHttpClient';
import { IbistroImplementation } from '../../../src/search/implementations/IbistroImplementation';

const folder = `${__dirname}/../data/ibistro`;
const services = new Services();

test('Gets Libraries', async () => {
    const service = 'Kingston upon Hull';
    const client = new ProxymanHttpClient(`${folder}/hull-libraries.proxymanlogv2`);
    const impl = new IbistroImplementation(client);
    const result = await impl.getLibraries(services.getService(service));
    expect(result.name).toEqual(service);
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Gets Books', async () => {
    const service = 'Kingston upon Hull';
    const client = new ProxymanHttpClient(`${folder}/hull-search.proxymanlogv2`);
    const impl = new IbistroImplementation(client);
    const result = await impl.getBooks(services.getService(service), [
        '9780747532743',
        '9780141187761',
        '9781904633013',
        '9780521618748',
        '9780007371464'
    ]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[1].service).toEqual(service);
    expect(result[1].id).toBeDefined();
    expect(result[1].code).toBeDefined();
    expect(result[1].url).toBeDefined();
    expect(result[1].isbn).toBeDefined();
    expect(result[1].availability.length).toBeGreaterThan(0);
});