import {describe, expect, test} from '@jest/globals';
import { Services } from '../../src/services/Services';
import * as json from '../../src/services/services.json';
import * as _ from 'underscore';

const services = new Services();

describe('Services', () => {
    test('Finds by code', () => {
        const result = services.getService('E08000010');
        expect(result).not.toBeUndefined();
        expect(result.name).toEqual('Wigan');
        expect(result.spydus).not.toBeUndefined();
        expect(result.enterprise).toBeUndefined();
        expect(result.type).toEqual('Spydus');
    });

    test('Finds by name', () => {
        const result = services.getService('Wigan');
        expect(result).not.toBeUndefined();
        expect(result.name).toEqual('Wigan');
        expect(result.spydus).not.toBeUndefined();
        expect(result.enterprise).toBeUndefined();
        expect(result.type).toEqual('Spydus');
    });

    test('Not found', () => {
        expect(() => services.getService('notfound')).toThrowError();
    });

    test('Lists', () => {
        const result = services.listServices();
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].name).toBeDefined();
        expect(result[0].code).toBeDefined();
        expect(result[0].type).toBeDefined();
        expect(result[0].catalogueUrl).toBeDefined();
    });

    test('No redundant service types', () => {
        expect(_.find(json, x => x.arenaV6 !== undefined)).toBeDefined();
        expect(_.find(json, x => x.arenaV7 !== undefined)).toBeDefined();
        expect(_.find(json, x => x.blackpool !== undefined)).toBeDefined();
        expect(_.find(json, x => x.durham !== undefined)).toBeDefined();
        expect(_.find(json, x => x.enterprise !== undefined)).toBeDefined();
        expect(_.find(json, x => x.iguana !== undefined)).toBeDefined();
        expect(_.find(json, x => x.kohaV20 !== undefined)).toBeDefined();
        expect(_.find(json, x => x.kohaV22 !== undefined)).toBeDefined();
        expect(_.find(json, x => x.luci !== undefined)).toBeDefined();
        expect(_.find(json, x => x.prism !== undefined)).toBeDefined();
        expect(_.find(json, x => x.spydus !== undefined)).toBeDefined();
        expect(_.find(json, x => x.webpac !== undefined)).toBeDefined();
    });
});