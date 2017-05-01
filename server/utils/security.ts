import * as crypto from 'crypto';
import Maybe from './maybe';
import { AuthToken, PermissionLevel } from './requestUtils';
import { getAllRegexMatches } from './functionalUtils';

const algorithm = 'aes-256-ctr';
const hash = 'sha512';
const encoding: crypto.Utf8AsciiBinaryEncoding = 'utf8';
const formatBinary: crypto.HexBase64BinaryEncoding = 'hex';
const formatLatin: crypto.HexBase64Latin1Encoding = 'hex';
const password: string = process.env['CRYPT_PASS'];

export function encrypt(text: string): string {
    try {
        const cipher = crypto.createCipher(algorithm, password);
        const encrypted = cipher.update(text, encoding, formatBinary);

        return encrypted + cipher.final(formatBinary);
    } catch (e) {
        console.log('crypto error in encrypt', e.message);
        throw e;
    }
}

export function decrypt(encrypted: string): string {
    try {
        const decipher = crypto.createDecipher(algorithm, password);
        const dec = decipher.update(encrypted, formatBinary, encoding);

        return dec + decipher.final(encoding);
    } catch (e) {
        console.log('crypto error in decrypt', e.message);
        throw e;
    }
}

export function hashPassword(salt: string, password: string): string {
    try {
        const hashMethod = crypto.createHmac(hash, salt);
        hashMethod.update(password);
        return hashMethod.digest(formatLatin);
    } catch (e) {
        console.log('could not hash password', password, 'with salt', salt, 'internal message:', e.message);
        // TODO: probably a bad idea?
        throw e;
    }
}

export function buildAuthToken(email: string, permissionLevels: PermissionLevel[]): string {
    const token: AuthToken = {
        email: email,
        authorizedAt: new Date(),
        permissionLevels: permissionLevels
    };

    return encrypt(JSON.stringify(token));
}

export function parseCookie(cookie: string): Maybe<AuthToken> {
    const fail: Maybe<AuthToken> = Maybe.nothing<AuthToken>();
    if (!cookie) {
        return fail;
    }

    const cookiePrelude: string = 'IgetbackAuth=';

    const allMatches: string[] = getAllRegexMatches(cookie, `${cookiePrelude}([a-f0-9]+)`);

    // attempt to get the latest cookie added to the session- not great
    const token = allMatches[allMatches.length - 1];
    if (!token) {
        return fail;
    }

    try {
        const deserializedResult: any = JSON.parse(decrypt(token));
        if (!deserializedResult.email || !deserializedResult.authorizedAt || !deserializedResult.permissionLevel) {
            return fail;
        }
        const result: AuthToken = {
            email: deserializedResult.email,
            authorizedAt: new Date(deserializedResult.authorizedAt),
            permissionLevels: deserializedResult.permissionLevels
        };

        return Maybe.just(result);
    } catch (e) {
        console.log('JSON exception parsing cookie:', e.message);
        console.log('token:', token, 'cookie:', cookie);
    }

    return fail;
}

export async function validateCookie(cookie: string): Promise<boolean> {
    const tokenResult: Maybe<AuthToken> = parseCookie(cookie);

    return tokenResult.caseOf({
        just: (token: AuthToken) => {
            return validateAuthToken(token);
        },
        nothing: () => false
    });
}

export function validateAuthToken(token: AuthToken): boolean {
    const currentTime = new Date();
    const oneHour = 3600000;
    const expiresAt = new Date(token.authorizedAt.getTime() + oneHour);
    return expiresAt > currentTime;
}
