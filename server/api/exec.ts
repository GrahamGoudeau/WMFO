import * as express from 'express';
import Logger from '../utils/logger';
import DB from '../db/db';
import { AllUserInfo, PendingCommunityMember, VolunteerHours, CommunityMemberRecord, DBResult } from '../db/db';
import { buildNonObjectArrayShape, KeyShape, RequestShape, validateArray, HTMLEscapedString, COMMON_FIELD_SHAPES, validateKeys } from '../utils/functionalUtils';
import { AuthToken, PermissionLevel, ResponseMessage, badRequest, jsonResponse, successResponse } from '../utils/requestUtils';
import { buildAuthToken, hashPassword } from '../utils/security';
import { Emailer } from "../utils/emailer";

const log: Logger = new Logger('exec-api');
const db: DB = DB.getInstance();

export async function handleGetUnconfirmedAccounts(req: express.Request,
                                                   res: express.Response,
                                                   authToken: AuthToken): Promise<void> {
    try {
        log.INFO('User', authToken.email, 'requesting unconfirmed accounts');
        const data: PendingCommunityMember[] = await db.exec.getUnconfirmedAccounts();
        jsonResponse(res, data);
        return;
    } catch (e) {
        log.ERROR('exception:', e);
        badRequest(res, 'DB_ERROR');
        return;
    }
}

export async function handleChangePermissions(req: express.Request,
                                              res: express.Response,
                                              authToken: AuthToken): Promise<void> {
    if (!req.body) {
        badRequest(res);
        return;
    }

    // must parse community member IDs from strings
    try {
        req.body.communityMemberId = parseInt(req.body.communityMemberId);
    } catch (e) {
        // communityMemberId field did not exist
        badRequest(res);
        return;

    }

    const permissionArrayShape: KeyShape = buildNonObjectArrayShape(COMMON_FIELD_SHAPES.permission);
    permissionArrayShape.validation.push((arr: any[]) => {
        return arr.length > 0
    });

    const updatedPermissions: { communityMemberId: number; permissionLevels: PermissionLevel[] } = req.body;

    if (!validateKeys(updatedPermissions, {
            communityMemberId: COMMON_FIELD_SHAPES.nonnegativeNum,
            permissionLevels: permissionArrayShape })) {
        console.log('failed validation', updatedPermissions);
        badRequest(res);
        return;
    }

    try {
        await db.exec.changePermissions(updatedPermissions);
    } catch (e) {
        log.ERROR('failed to change permissions for user id', updatedPermissions.communityMemberId);
        badRequest(res, 'DB_ERROR');
        return;
    }
    log.INFO(authToken.email, 'changed permissions for user', updatedPermissions.communityMemberId);
    successResponse(res);
}
export async function handleGetUnconfirmedHours(req: express.Request,
                                                res: express.Response,
                                                authToken: AuthToken): Promise<void> {
    try {
        log.INFO('User', authToken.email, 'requesting unconfirmed hours');
        const data: VolunteerHours[] = await db.exec.getUnconfirmedHours();
        jsonResponse(res, data);
        return;
    } catch (e) {
        log.ERROR('exception while getting unconfirmed hours', e);
        badRequest(res, 'DB_ERROR');
        return;
    }
}

export async function handleManageUsers(req: express.Request,
                                        res: express.Response,
                                        authToken: AuthToken): Promise<void> {
    try {
        const data: AllUserInfo[] = await db.exec.getAllUserInfo();

        log.INFO('User', authToken.email, 'requesting all user data');
        jsonResponse(res, { allUserInfo: data });
    } catch (e) {
        log.ERROR('failed to get all user data', e);
        badRequest(res, 'DB_ERROR');
        return;
    }
}
export async function handleResolveHours(req: express.Request,
                                         res: express.Response,
                                         authToken: AuthToken,
                                         toDelete: boolean): Promise<void> {
    if (!req.body || !req.body.hoursId) {
        badRequest(res);
        return;
    }

    const body: { hoursId: number} = req.body;
    body.hoursId = parseInt(req.body.hoursId);

    if (!validateKeys(body, {
            hoursId: COMMON_FIELD_SHAPES.nonnegativeNum, })) {
        badRequest(res);
        return;
    }

    try {
        await db.exec.resolveHours(body.hoursId, toDelete);
        log.INFO('User', authToken.email, toDelete ? 'deleting' : 'approving', 'hours for hours id', body.hoursId);
        successResponse(res);
    } catch (e) {
        log.ERROR('exception while user', authToken.email, toDelete ? 'deleting' : 'approving', 'hours');
        badRequest(res, 'DB_ERROR');
        return;
    }
}
export async function handleAddPendingMembers(req: express.Request,
                                              res: express.Response,
                                              authToken: AuthToken): Promise<void> {
    if (!req.body || !req.body.pendingMembers) {
        badRequest(res);
        return;
    }

    const arr = req.body.pendingMembers;

    // if true, signals to the compiler that arr is of type PendingCommunityMember[]
    const permissionArrayShape: KeyShape = buildNonObjectArrayShape(COMMON_FIELD_SHAPES.permission);
    permissionArrayShape.validation.push((arr: any[]) => {
        return arr.length > 0
    });

    if (!validateArray<PendingCommunityMember>(arr, {
                'email': COMMON_FIELD_SHAPES.email,
                'permissionLevels': permissionArrayShape,
            })) {

        badRequest(res);
        return;
    }
    const result: DBResult<{}> = await db.exec.addPendingMembers(arr.map((entry) => { 
        return {
            email: entry.email.toLowerCase(),
            permissionLevels: entry.permissionLevels
        }
    }));
    result.caseOf({
        right: async (_) => {
            log.INFO('User', authToken.email, 'added', arr.length, 'users');
            // TODO: await? must wait for all emails
            //Emailer.getInstance().registerNotification([{firstName: 'test', email: 'test@gmail.com', url: 'localhost:5000'}]);
            successResponse(res);
        },
        left: async (e) => {
            log.INFO('User', authToken.email, 'failed to add users');
            badRequest(res, e);
        }
    });
}
