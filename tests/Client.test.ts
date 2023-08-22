import { Client } from '../src/Client';
import { ProxymanHttpClient } from './ProxymanHttpClient';

const folder = `${__dirname}/search/data/spydus`;

test('Service', () => {
    const client = new Client();
    const result = client.getService('Wigan');

    expect(result).not.toBeUndefined();
    expect(result.name).toEqual('Wigan');
    expect(result.type).toEqual('Spydus');
    expect(result.catalogueUrl).toEqual('https://wigan.spydus.co.uk/');
});

test('Services', () => {
    const client = new Client();
    const result = client.listServices();

    expect(result.length).toBeGreaterThan(0);
});

test('Libraries', async () => {
    const httpClient = new ProxymanHttpClient(`${folder}/wigan-libraries.proxymanlogv2`);
    const client = new Client(httpClient);
    const result = await client.listLibraries('Wigan');

    expect(result.code).toEqual('E08000010');
    expect(result.name).toEqual('Wigan');
    expect(result.branches.length).toBeGreaterThan(0);
});

test('Books', async () => {
    const httpClient = new ProxymanHttpClient(`${folder}/wigan-search.proxymanlogv2`);
    const client = new Client(httpClient);
    const result = await client.searchBook('Wigan', '9780747532743');

    expect(result).toBeDefined();
    expect(result.code).toEqual('E08000010');
    expect(result.service).toEqual('Wigan');
    expect(result!.availability).not.toHaveLength(0);

    for(const a of result!.availability) {
        expect(a.total).toBeGreaterThan(0);
    }

    expect(result!.id).toBeTruthy();
});