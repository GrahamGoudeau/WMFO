import * as express from 'express';
import Logger from '../utils/logger';
import DB from '../db/db';
import { VolunteerHours, CommunityMemberRecord, DBResult } from '../db/db';
import { HTMLEscapedString, COMMON_FIELD_SHAPES, validateKeys } from '../utils/functionalUtils';
import { AuthToken, PermissionLevel, ResponseMessage, badRequest, jsonResponse, successResponse } from '../utils/requestUtils';
import { buildAuthToken, hashPassword } from '../utils/security';

const log: Logger = new Logger('exec-api');
const db: DB = DB.getInstance();

export async function handleGetUnconfirmedAccounts(req: express.Request,
                                                   res: express.Response,
                                                   authToken: AuthToken): Promise<void> {
    try {
        const data: CommunityMemberRecord[] = await db.exec.getUnconfirmedAccounts();
        jsonResponse(res, data);
        return;
    } catch (e) {
        log.ERROR('exception:', e);
        badRequest(res, 'DB_ERROR');
        return;
    }
}

export async function handleGetUnconfirmedHours(req: express.Request,
                                                res: express.Response,
                                                authToken: AuthToken): Promise<void> {
    try {
        const data: VolunteerHours[] = await db.exec.getUnconfirmedHours();
        jsonResponse(res, data);
        return;
    } catch (e) {
        log.ERROR('exception while getting unconfirmed hours', e);
        badRequest(res, 'DB_ERROR');
        return;
    }
}
