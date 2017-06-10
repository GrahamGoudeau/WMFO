import * as express from 'express';
import Logger from '../utils/logger';
import DB from '../db/db';
import { Show, ShowRequest, AllUserInfo, PendingCommunityMember, VolunteerHours, CommunityMemberRecord, DBResult } from '../db/db';
import { buildNonObjectArrayShape, KeyShape, RequestShape, validateArray, HTMLEscapedString, COMMON_FIELD_SHAPES, validateKeys } from '../utils/functionalUtils';
import { DayOfWeek, Semester, AuthToken, PermissionLevel, ResponseMessage, badRequest, jsonResponse, successResponse } from '../utils/requestUtils';
import { buildAuthToken, hashPassword } from '../utils/security';
import { Emailer } from "../utils/emailer";
import Config from "../utils/config";

const CONFIG = Config.getInstance();

const log: Logger = new Logger('exec-api');
const db: DB = DB.getInstance();

export async function handleGetUnconfirmedAccounts(req: express.Request,
                                                   res: express.Response,
                                                   authToken: AuthToken): Promise<void> {
    try {
        log.INFO(authToken.email, 'requesting unconfirmed accounts');
        const data: PendingCommunityMember[] = await db.exec.getUnconfirmedAccounts();
        jsonResponse(res, data);
        return;
    } catch (e) {
        log.ERROR('exception:', e);
        badRequest(res, 'DB_ERROR');
        return;
    }
}

export async function handleDeletePendingMember(req: express.Request,
                                                res: express.Response,
                                                authToken: AuthToken): Promise<void> {
    const body: { code: string } = req.body;
    if (!body) {
        badRequest(res);
        return;
    }
    if (!validateKeys(body, { code: COMMON_FIELD_SHAPES.uuid })) {
        badRequest(res);
        return;
    }
    try {
        await db.exec.deletePendingMember(body.code);
    } catch (e) {
        log.ERROR('exception deleting pending member:', e);
        badRequest(res, 'DB_ERROR');
    }
    log.INFO(authToken.email, 'deleted pending member');
    successResponse(res);
}

export async function handleDeleteShow(req: express.Request,
                                       res: express.Response,
                                       authToken: AuthToken): Promise<void> {
    const body: { id: number } = req.body;
    if (!body) {
        badRequest(res);
        return;
    }

    try {
        body.id = parseInt(body.id as any);
    } catch (e) {
        badRequest(res);
        return;
    }

    if (!validateKeys(body, { id: COMMON_FIELD_SHAPES.nonnegativeNum })) {
        badRequest(res);
        return;
    }
    try {
        await db.exec.deleteShow(body.id);
    } catch (e) {
        log.ERROR('exception deleting show', body.id, e);
        badRequest(res, 'DB_ERROR');
        return;
    }
    log.INFO(authToken.email, 'deleted show', body.id);
    successResponse(res);
}

export async function handleDeleteShowRequest(req: express.Request,
                                              res: express.Response,
                                              authToken: AuthToken): Promise<void> {
    const body: { id: number } = req.body;
    if (!body) {
        badRequest(res);
        return;
    }

    try {
        body.id = parseInt(body.id as any);
    } catch (e) {
        badRequest(res);
        return;
    }

    if (!validateKeys(body, { id: COMMON_FIELD_SHAPES.nonnegativeNum })) {
        badRequest(res);
        return;
    }
    try {
        await db.exec.deleteShowRequest(body.id);
    } catch (e) {
        log.ERROR('exception deleting show request', body.id, e);
        badRequest(res, 'DB_ERROR');
        return;
    }
    log.INFO(authToken.email, 'deleted show request', body.id);
    successResponse(res);
}

export async function handleGetScheduleBySemester(req: express.Request,
                                                  res: express.Response,
                                                  authToken: AuthToken): Promise<void> {
    const body: { semester: Semester, year: number } = req.body;
    if (!body) {
        badRequest(res);
        return;
    }
    try {
        body.year = parseInt(body.year as any);
    } catch (e) {
        badRequest(res);
        return;
    }

    if (!validateKeys(body, { semester: COMMON_FIELD_SHAPES.semester, year: COMMON_FIELD_SHAPES.nonnegativeNum })) {
        badRequest(res);
        return;
    }

    try {
        const result: Show[] = await db.exec.getScheduleBySemester(body.semester, body.year);
        log.INFO(authToken.email, 'got schedule for', body.semester, body.year);
        jsonResponse(res, { schedule: result });
    } catch (e) {
        log.ERROR('could not get schedule', body.semester, body.year, e);
        badRequest(res, 'DB_ERROR');
    }
}

export async function handleGetShowRequestsBySemester(req: express.Request,
                                                      res: express.Response,
                                                      authToken: AuthToken): Promise<void> {
    const body: { semester: Semester, year: number } = req.body;
    if (!body) {
        badRequest(res);
        return;
    }
    try {
        body.year = parseInt(body.year as any);
    } catch (e) {
        badRequest(res);
        return;
    }

    if (!validateKeys(body, { semester: COMMON_FIELD_SHAPES.semester, year: COMMON_FIELD_SHAPES.nonnegativeNum })) {
        badRequest(res);
        return;
    }

    try {
        const result: ShowRequest[] = await db.exec.getShowRequestsBySemester(body.semester, body.year);
        log.INFO(authToken.email, 'got show requests for', body.semester, body.year);
        jsonResponse(res, { requests: result });
    } catch (e) {
        log.ERROR('could not get show requests for', body.semester, body.year, e);
        badRequest(res, 'DB_ERROR');
    }
}

export async function handleToggleMemberActive(req: express.Request,
                                               res: express.Response,
                                               authToken: AuthToken): Promise<void> {
    if (!req.body) {
        badRequest(res);
        return;
    }

    const body: { communityMemberId: number } = req.body;
    try {
        body.communityMemberId = parseInt(body.communityMemberId as any);
    } catch (e) {
        badRequest(res);
    }

    if (!validateKeys(body, { communityMemberId: COMMON_FIELD_SHAPES.nonnegativeNum })) {
        badRequest(res);
        return;
    }

    try {
        const active: boolean = await db.exec.toggleMemberActive(body.communityMemberId);
        log.INFO(authToken.email, 'set user id', body.communityMemberId, 'to active =', active);
        jsonResponse(res, { active: active });
    } catch (e) {
        log.ERROR('could not toggle member', body.communityMemberId, 'active', e);
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
        log.INFO(authToken.email, 'requesting unconfirmed hours');
        const data: VolunteerHours[] = await db.exec.getUnconfirmedHours();
        jsonResponse(res, data);
        return;
    } catch (e) {
        log.ERROR('exception while getting unconfirmed hours', e);
        badRequest(res, 'DB_ERROR');
        return;
    }
}

export async function handleAddShowToSchedule(req: express.Request,
                                     res: express.Response,
                                     authToken: AuthToken): Promise<void> {
    const body: {
        showName: string;
        dayOfWeek: DayOfWeek;
        doesAlternate: boolean;
        hour: number;
        semester: Semester;
        year: number;
        communityMemberEmails: string[];
        communityMemberIds: number[];
        requestId: number;
    } = req.body;

    if (!body) {
        badRequest(res);
        return;
    }

    try {
        body.doesAlternate = JSON.parse(body.doesAlternate as any);
        body.hour = parseInt(body.hour as any);
        body.year = parseInt(body.year as any);
        body.communityMemberIds = body.communityMemberIds.map(id => parseInt(id as any));
        body.requestId = parseInt(body.requestId as any);
        body.showName = new HTMLEscapedString(body.showName).value;
    } catch (e) {
        badRequest(res);
        return;
    }

    if (!validateKeys(body, {
            showName: COMMON_FIELD_SHAPES.nonemptyString,
            dayOfWeek: COMMON_FIELD_SHAPES.dayOfWeek,
            doesAlternate: COMMON_FIELD_SHAPES.boolean,
            hour: COMMON_FIELD_SHAPES.nonnegativeNum,
            semester: COMMON_FIELD_SHAPES.semester,
            year: COMMON_FIELD_SHAPES.nonnegativeNum,
            communityMemberEmails: COMMON_FIELD_SHAPES.nonemptyArray,
            communityMemberIds: COMMON_FIELD_SHAPES.nonemptyArray,
            requestId: COMMON_FIELD_SHAPES.nonnegativeNum,
        })) {
        badRequest(res);
        return;
    }

    try {
        const id: number = await db.exec.addShowToSchedule(Object.assign({}, body, { id: null }), body.requestId);
        jsonResponse(res, { showId: id });
        return;
    } catch (e) {
        if (e.message && e.message === 'already scheduled') {
            badRequest(res);
            return;
        }
        log.ERROR('failed to add show to schedule', e, e.message);
        badRequest(res, 'DB_ERROR');
        return;
    }
}
export async function handleManageUsers(req: express.Request,
                                        res: express.Response,
                                        authToken: AuthToken): Promise<void> {
    try {
        const data: AllUserInfo[] = await db.exec.getAllUserInfo();

        log.INFO(authToken.email, 'requesting all user data');
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
        log.INFO(authToken.email, toDelete ? 'deleting' : 'approving', 'hours for hours id', body.hoursId);
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
    const result: DBResult<{ email: string, code: string }[]> = await db.exec.addPendingMembers(arr.map((entry) => {
        return {
            email: entry.email.toLowerCase(),
            permissionLevels: entry.permissionLevels
        }
    }));
    result.caseOf({
        right: async (newUserData) => {
            log.INFO(authToken.email, 'added', arr.length, 'users');
            const recipientData = newUserData.map(newUser => {
                return {
                    email: newUser.email,
                    url: `${CONFIG.getStringConfig('DOMAIN_NAME')}/register/${newUser.code}`,
                }
            });
            Emailer.getInstance().registerNotification(recipientData);
            successResponse(res);
        },
        left: async (e) => {
            log.INFO(authToken.email, 'failed to add users');
            badRequest(res, e);
        }
    });
}
