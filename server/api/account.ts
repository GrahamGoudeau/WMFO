import * as express from 'express';
import Logger from '../utils/logger';
import DB from '../db/db';
import { PendingCommunityMember, CommunityMemberRecord, DBResult } from '../db/db';
import { validateArrayNonobject, HTMLEscapedString, COMMON_FIELD_SHAPES, validateKeys } from '../utils/functionalUtils';
import { AuthToken, PermissionLevel, ResponseMessage, badRequest, jsonResponse, successResponse } from '../utils/requestUtils';
import { buildAuthToken, hashPassword } from '../utils/security';
import Either from '../utils/either';

const log: Logger = new Logger('account-api');
const db: DB = DB.getInstance();

export async function handleProfile(req: express.Request,
                                    res: express.Response,
                                    authToken: AuthToken): Promise<void> {
    const id: number = authToken.id;
    const result: DBResult<CommunityMemberRecord> = await db.dj.findById(id);
    result.caseOf({
        left: e => badRequest(res, e),
        right: c => {
            log.INFO('Getting profile data for', c.email);
            jsonResponse(res, c);
        }
    });
}

export async function handleGetUnconfirmedAccount(req: express.Request,
                                                  res: express.Response): Promise<void> {
    const body: { code: string } = req.body;
    if (!validateKeys(body, { code: COMMON_FIELD_SHAPES.uuid })) {
        badRequest(res);
        return;
    }
    try {
        const result: DBResult<PendingCommunityMember> = await db.dj.getSingleUnconfirmedAccount(body.code);
        result.caseOf({
            left: e => badRequest(res, e),
            right: p => jsonResponse(res, p)
        });
    } catch (e) {
        log.ERROR('oops:', e);
        badRequest(res, 'DB_ERROR');
    }
}


export async function handleLogin(req: express.Request,
                                  res: express.Response): Promise<void> {
    const body: { email: string, password: string } = req.body;
    if (!validateKeys(body, {
            'email': COMMON_FIELD_SHAPES.email,
            'password': COMMON_FIELD_SHAPES.nonemptyString })) {
        badRequest(res);
        return;
    }
    try {
        const result: DBResult<CommunityMemberRecord> = await db.dj.findByEmailAndPassword(new HTMLEscapedString(body.email),
                                                                                       hashPassword(body.email, body.password));
        result.caseOf({
            left: e => badRequest(res, e),
            right: c => {
                log.INFO('Validating user', c.email);
                jsonResponse(res, {
                    userData: c,
                    authToken: buildAuthToken(c.email, c.id, c.permissionLevels)
                });
            }
        });

        return;
    } catch (e) {
        log.ERROR(e);
        badRequest(res, 'DB_ERROR');
    }
}

export async function handleRegister(req: express.Request,
                                     res: express.Response): Promise<void> {
    const body: { firstName: string; lastName: string; code: string; password: string } = req.body;
    if (!validateKeys(body, {
            'firstName': COMMON_FIELD_SHAPES.nonemptyString,
            'lastName': COMMON_FIELD_SHAPES.nonemptyString,
            'code': COMMON_FIELD_SHAPES.uuid,
            'password': COMMON_FIELD_SHAPES.nonemptyString })) {
        badRequest(res);
        return;
    }

    let userEmail: string;
    let emailResult: DBResult<string>;
    try {
        emailResult = await db.dj.getEmailFromPendingCode(body.code);
    } catch (e) {
        log.ERROR('Could not get email from code', body.code);
        emailResult = Either.Left<ResponseMessage, string>('DB_ERROR');
    }

    const operationResult = await emailResult.asyncBind(async (email: string) => {
        userEmail = email;
        try {
            const escapedEmail: HTMLEscapedString = new HTMLEscapedString(email);
            const result: DBResult<number> = await db.dj.register(
                new HTMLEscapedString(body.firstName),
                new HTMLEscapedString(body.lastName),
                escapedEmail,
                hashPassword(email, body.password));
            await db.dj.claimPendingAccount(escapedEmail);
            return result;
        } catch (e) {
            log.ERROR('register blew up:', e);
            badRequest(res);
            return null;
        }
    });

    await operationResult.caseOf({
        left: async (e: ResponseMessage) => {
            badRequest(res, e);
        },
        right: async (id: number) => {
            log.INFO('Registered user', userEmail);
            const permissionLevels: PermissionLevel[] = await db.dj.getPermissionLevels(id);
            jsonResponse(res, {
                authToken: buildAuthToken(new HTMLEscapedString(userEmail).value, id, permissionLevels)
            });
        }
    });
}
