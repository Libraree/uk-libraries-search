import {expect, test} from '@jest/globals';
import { HttpResponse } from '../../src/net/HttpResponse';

test('200 Text', async () => {
    const response = new HttpResponse(200, 'https://localhost/', 'OK');
    expect(response.status).toBe(200);
    expect(response.url).toBe('https://localhost/');
    expect(response.body).toContain('OK');
    expect(response.successful).toBeTruthy();
    expect(() => response.ensureSuccessful()).not.toThrowError();
});

test('200 JSON', async () => {
    const response = new HttpResponse(200, 'https://localhost/', '{ "foo": "bar" }');
    expect(response.status).toBe(200);
    expect(response.url).toBe('https://localhost/');
    expect(response.successful).toBeTruthy();
    expect(response.getBodyAsJson().foo).toBe('bar');
    expect(() => response.ensureSuccessful()).not.toThrowError();
});

test('404 Text', async () => {
    const response = new HttpResponse(404, 'https://localhost/', 'Not Found');
    expect(response.status).toBe(404);
    expect(response.url).toBe('https://localhost/');
    expect(response.body).toContain('Not Found');
    expect(response.successful).not.toBeTruthy();
    expect(() => response.ensureSuccessful()).toThrowError();
});