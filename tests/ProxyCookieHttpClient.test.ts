import { ProxyCookieHttpClient } from './ProxyCookieHttpClient';

describe.skip('With Proxy', () => {
    const client = new ProxyCookieHttpClient('http://127.0.0.1:3128');

    test('GET 200 simple', async () => {
        const url = 'https://httpbin.org/status/200';
        const response = await client.get(url);
        expect(response.status).toEqual(200);
        expect(response.url).toEqual(url);
    }, 600000);

    test('GET 200 with cookies and after redirect', async () => {
        const response = await client.get('https://httpbin.org/cookies/set/foo/bar');
        expect(response.status).toEqual(200);
        expect(response.url).toEqual('https://httpbin.org/cookies');
        expect(response.getBodyAsJson().cookies.foo).toEqual('bar');
    }, 600000);

    test('GET 200 with cookies, headers and after redirect', async () => {
        const response = await client.get('https://httpbin.org/cookies/set/foo/bar', { 'X-Foo': 'Bar' });
        expect(response.status).toEqual(200);
        expect(response.url).toEqual('https://httpbin.org/cookies');
        expect(response.getBodyAsJson().cookies.foo).toEqual('bar');
    }, 600000);

    test('GET 403', async () => {
        const url = 'https://httpbin.org/status/403';
        const response = await client.get(url);
        expect(response.status).toEqual(403);
        expect(response.url).toEqual(url);
    }, 600000);

    test('POST 200 simple', async () => {
        const url = 'https://httpbin.org/status/200';
        const response = await client.post(url, '');
        expect(response.status).toEqual(200);
        expect(response.url).toEqual(url);
    }, 600000);

    test('POST 403', async () => {
        const url = 'https://httpbin.org/status/403';
        const response = await client.post(url, '');
        expect(response.status).toEqual(403);
        expect(response.url).toEqual(url);
    }, 600000);
});

describe.skip('No Proxy', () => {
    const client = new ProxyCookieHttpClient();

    test('GET 200 simple', async () => {
        const url = 'https://httpbin.org/status/200';
        const response = await client.get(url);
        expect(response.status).toEqual(200);
        expect(response.url).toEqual(url);
    }, 600000);

    test('GET 200 with cookies and after redirect', async () => {
        const response = await client.get('https://httpbin.org/cookies/set/foo/bar');
        expect(response.status).toEqual(200);
        expect(response.url).toEqual('https://httpbin.org/cookies');
        expect(response.getBodyAsJson().cookies.foo).toEqual('bar');
    }, 600000);

    test('GET 200 with cookies, headers and after redirect', async () => {
        const response = await client.get('https://httpbin.org/cookies/set/foo/bar', { 'X-Foo': 'Bar' });
        expect(response.status).toEqual(200);
        expect(response.url).toEqual('https://httpbin.org/cookies');
        expect(response.getBodyAsJson().cookies.foo).toEqual('bar');
    }, 600000);

    test('GET 403', async () => {
        const url = 'https://httpbin.org/status/403';
        const response = await client.get(url);
        expect(response.status).toEqual(403);
        expect(response.url).toEqual(url);
    }, 600000);

    test('POST 200 simple', async () => {
        const url = 'https://httpbin.org/status/200';
        const response = await client.post(url, '');
        expect(response.status).toEqual(200);
        expect(response.url).toEqual(url);
    }, 600000);
    
    test('POST 403', async () => {
        const url = 'https://httpbin.org/status/403';
        const response = await client.post(url, '');
        expect(response.status).toEqual(403);
        expect(response.url).toEqual(url);
    }, 600000);
});