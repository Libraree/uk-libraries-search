import {expect, test} from '@jest/globals';
import { SuperAgentHttpClient } from '../../src/net/SuperAgentHttpClient';

const client = new SuperAgentHttpClient();

test.skip('Get Without Header', async () => {
    const response = await client.get('https://httpstat.us/200');
    expect(response.status).toBe(200);
    expect(response.url).toBe('https://httpstat.us/200');
});

test.skip('Get With Header', async () => {
    const response = await client.get('https://httpstat.us/200', { 'X-Foo-Bar' : 'blah' });
    expect(response.status).toBe(200);
    expect(response.url).toBe('https://httpstat.us/200');
});

test.skip('Get Fails', async () => {
    const response = await client.get('https://httpstat.us/404', { 'X-Foo-Bar' : 'blah' });
    expect(response.status).toBe(404);
    expect(response.url).toBe('https://httpstat.us/404');
});

test.skip('Post', async () => {
    const response = await client.post('https://httpstat.us/200', 'foo=bar', { 'X-Foo-Bar' : 'blah' });
    expect(response.status).toBe(200);
    expect(response.url).toBe('https://httpstat.us/200');
});

test.skip('Post No Body', async () => {
    const response = await client.post('https://httpstat.us/200', undefined, { 'X-Foo-Bar' : 'blah' });
    expect(response.status).toBe(200);
    expect(response.url).toBe('https://httpstat.us/200');
});

test.skip('Post Fails', async () => {
    const response = await client.post('https://httpstat.us/404', 'foo=bar', { 'X-Foo-Bar' : 'blah' });
    expect(response.status).toBe(404);
    expect(response.url).toBe('https://httpstat.us/404');
});