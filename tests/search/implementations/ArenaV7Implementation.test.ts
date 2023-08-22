import { expect, test } from '@jest/globals';
import { ArenaV7Implementation } from '../../../src/search/implementations/ArenaV7Implementation';
import { Services } from '../../../src/services/Services';
import { ProxymanHttpClient } from '../../ProxymanHttpClient';

const folder = `${__dirname}/../data/arenaV7`;
const services = new Services();

test('Gets libraries from search page directly', async () => {
    const service = 'Darlington';
    const client = new ProxymanHttpClient(`${folder}/darlington-libraries.proxymanlogv2`);
    const impl = new ArenaV7Implementation(client);
    const result = await impl.getLibraries(services.getService(service));
    expect(result.name).toEqual(service);
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Gets libraries from portlet', async () => {
    const service = 'North East Lincolnshire';
    const client = new ProxymanHttpClient(`${folder}/nel-libraries.proxymanlogv2`);
    const impl = new ArenaV7Implementation(client);
    const result = await impl.getLibraries(services.getService(service));
    expect(result.name).toEqual(service);
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Gets libraries from signup', async () => {
    const service = 'Shropshire';
    const client = new ProxymanHttpClient(`${folder}/shropshire-libraries.proxymanlogv2`);
    const impl = new ArenaV7Implementation(client);
    const result = await impl.getLibraries(services.getService(service));
    expect(result.name).toEqual(service);
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Gets Books', async () => {
    const service = 'North East Lincolnshire';
    const client = new ProxymanHttpClient(`${folder}/nel-search.proxymanlogv2`);
    const impl = new ArenaV7Implementation(client);
    const result = await impl.getBooks(services.getService(service), [
        '9780747554561',
        '9780141187761',
        '9781593080204',
        '9780198117476',
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