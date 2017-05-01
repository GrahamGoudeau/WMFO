import * as express from 'express';
import Logger from '../utils/logger';
import DB from '../db/db';
import { CommunityMemberRecord, DBResult } from '../db/db';
import { HTMLEscapedString, COMMON_FIELD_SHAPES, validateKeys } from '../utils/functionalUtils';
import { PermissionLevel, ResponseMessage, badRequest, jsonResponse, successResponse } from '../utils/requestUtils';
import { buildAuthToken, hashPassword } from '../utils/security';

const log: Logger = new Logger('dj');
const db: DB = DB.getInstance();

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
            right: c => jsonResponse(res, {
                userData: c,
                authToken: buildAuthToken(c.email, c.permissionLevels)
            })
        });

        return;
    } catch (e) {
        log.ERROR(e);
    }
    res.send('login');
}

export async function handleRegister(req: express.Request,
                                     res: express.Response): Promise<void> {
    const body: any = req.body;
    if (!validateKeys(body, {
            'firstName': COMMON_FIELD_SHAPES.nonemptyString,
            'lastName': COMMON_FIELD_SHAPES.nonemptyString,
            'email': COMMON_FIELD_SHAPES.email,
            'password': COMMON_FIELD_SHAPES.nonemptyString })) {
        badRequest(res);
        return;
    }

    const result: DBResult<number> = await db.dj.register(
        new HTMLEscapedString(body.firstName),
        new HTMLEscapedString(body.lastName),
        new HTMLEscapedString(body.email),
        hashPassword(body.email, body.password));

    await result.caseOf({
        left: async (e: ResponseMessage) => badRequest(res, e),
        right: async (id: number) => {
            const permissions: PermissionLevel[] = await db.dj.getPermissionLevels(id);
            jsonResponse(res, {
                authToken: buildAuthToken(new HTMLEscapedString(body.email).value, permissions)
            });
        }
    });
}
