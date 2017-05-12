import * as express from 'express';
import Logger from '../utils/logger';
import DB from '../db/db';
import { CommunityMemberRecord, DBResult } from '../db/db';
import { HTMLEscapedString, COMMON_FIELD_SHAPES, validateKeys } from '../utils/functionalUtils';
import { AuthToken, PermissionLevel, ResponseMessage, badRequest, jsonResponse, successResponse } from '../utils/requestUtils';
import { buildAuthToken, hashPassword } from '../utils/security';

const log: Logger = new Logger('dj-api');
const db: DB = DB.getInstance();

export async function handleLogHours(req: express.Request,
                                     res: express.Response,
                                     authToken: AuthToken): Promise<void> {
    const body: { volunteerDate: string, // string in mm/dd/yyyy format
                  numHours: number,
                  description: string,
    } = req.body;
    body.numHours = parseFloat(req.body.numHours as string);
    if (!validateKeys(body, {
            volunteerDate: COMMON_FIELD_SHAPES.dateString,
            numHours: COMMON_FIELD_SHAPES.nonnegativeNum,
            description: COMMON_FIELD_SHAPES.nonemptyString })) {
        badRequest(res);
        return;
    }
    try {
        await db.dj.logVolunteerHours(new Date(body.volunteerDate), body.numHours, new HTMLEscapedString(body.description), authToken.id);
        successResponse(res);
    } catch (e) {
        log.ERROR('exception while logging volunteer hours from', authToken.email);
        log.ERROR(e);
        badRequest(res, 'DB_ERROR');
    }
}

export async function handleCheckMostRecentAgreement(req: express.Request,
                                                     res: express.Response,
                                                     authToken: AuthToken): Promise<void> {
    const data: DBResult<boolean> = await db.dj.hasSignedMostRecentAgreement(authToken.id);
    data.caseOf({
        right: data => jsonResponse(res, {
                hasSignedMostRecentAgreement: data
            }),
        left: e => badRequest(res, e)
    });
}
