import * as fs from 'fs';

export type JSType =
    'number' |
    'boolean' |
    'string';

export function o<A, B, C>(f: (y: B) => C,
                           g: (x: A) => B): (z: A) => C {
    return x => f(g(x));
}

export const dateRegex: RegExp = /^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{1,4}$/;

export function readLines(filePath: string): string[] {
    return fs.readFileSync(filePath).toString().split('\n');
};

export function defaults<T>(value: T, other: T): T {
    if (value == null) {
        return other;
    }
    return value;
}

export function getDateString(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

export function getAllRegexMatches(input: string, pattern: string): string[] {
    const result: string[] = [];
    let m: RegExpExecArray = null;
    const regex: RegExp = new RegExp(pattern, 'g');
    do {
        m = regex.exec(input);
        if (m) {
            result.push(m[1]);
        }
    } while (m);
    return result;
}

export function combineObjects(...objs: any[]): any {
    const result: any = {};
    objs.forEach(x => Object.assign(result, x));
    return result;
}

export interface KeyShape {
    type: JSType,
    validation?: ((value: any) => boolean)[],
}

export interface RequestShape {
    [keys: string]: KeyShape
}

export const COMMON_FIELD_SHAPES: any = {
    nonemptyString: { type: 'string', validation: [(s: string) => s.length > 0]},
    email: { type: 'string', validation: [
            (s: string) => s.length > 0,
            (s: string) => s.indexOf('@') !== -1,
            (s: string) => s.indexOf('.') !== -1
        ] },
    dateString: { type: 'string', validation: [(s: string) => dateRegex.test(s)] },
    num: { type: 'number' },
    nonnegativeNum: { type: 'number', validation: [(n: number) => n >= 0] },
    uuid: { type: 'string', validation: [(s: string) => /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(s)] },
};

export function validateKeys(obj: any, requestShape: RequestShape): boolean {
    if (!obj) return false;

    return Object.keys(obj).length === Object.keys(requestShape).length &&
        Object.keys(requestShape).reduce((acc, key) => {
            if (acc && obj[key] != null
                    && typeof obj[key] === requestShape[key].type) {
                if (requestShape[key].validation) {
                    return requestShape[key].validation.every(f => f(obj[key]));
                }
                return true;
            }
            return false;
    }, true);
}

export function validateArray<T>(arr: any, shape: RequestShape): arr is T[] {
    return Array.isArray(arr) && arr.every((x: any) =>
            validateKeys(x, shape));
}

export class HTMLEscapedString {
    private readonly _value: string;
    constructor(unescapedString: string) {
        this._value = HTMLEscapedString.escapeHTML(unescapedString);
    }

    get value() { return this._value; }

    private static escapeHTML(s: string): string { 
        return s.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}
