import { expect, test } from '@jest/globals';
import { Services } from '../../../src/services/Services';
import { ProxymanHttpClient } from '../../ProxymanHttpClient';
import { KohaV22Implementation } from '../../../src/search/implementations/KohaV22Implementation';

const folder = `${__dirname}/../data/kohaV22`;
const services = new Services();

test('Gets Libraries', async () => {
    const service = 'Sefton';
    const client = new ProxymanHttpClient(`${folder}/sefton-libraries.proxymanlogv2`);
    const impl = new KohaV22Implementation(client);
    const result = await impl.getLibraries(services.getService(service));
    expect(result.name).toEqual(service);
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Gets Books', async () => {
    const service = 'Sefton';
    const client = new ProxymanHttpClient(`${folder}/sefton-search.proxymanlogv2`);
    const impl = new KohaV22Implementation(client);
    const result = await impl.getBooks(services.getService(service), [
        '9781408855652',
        '9780141036144',
        '9780141439518',
        '9780521434942',
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