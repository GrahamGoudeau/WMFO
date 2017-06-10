import * as express from 'express';
import Logger from '../utils/logger';
import DB from '../db/db';
import { VolunteerHours, CommunityMemberRecord, DBResult } from '../db/db';
import { HTMLEscapedString, COMMON_FIELD_SHAPES, validateKeys } from '../utils/functionalUtils';
import { badJson, Semester, DayOfWeek, AuthToken, PermissionLevel, ResponseMessage, badRequest, jsonResponse, successResponse } from '../utils/requestUtils';
import { buildAuthToken, hashPassword } from '../utils/security';
import { Emailer } from "../utils/emailer";

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
        log.INFO(authToken.email, 'reporting', body.numHours, 'of volunteer hours');
        successResponse(res);
    } catch (e) {
        log.ERROR('exception while logging volunteer hours from', authToken.email);
        log.ERROR(e);
        badRequest(res, 'DB_ERROR');
    }
}

export async function handleGetIdFromEmail(req: express.Request,
                                           res: express.Response,
                                           authToken: AuthToken): Promise<void> {
    const body: { email: string } = req.body;
    if (!body) {
        badRequest(res);
        return;
    }

    if (!validateKeys(body, { email: COMMON_FIELD_SHAPES.email })) {
        badRequest(res);
        return;
    }

    try {
        const id: number = await db.dj.getIdFromEmail(body.email.toLowerCase());
        jsonResponse(res, { id: id });
    } catch (e) {
        log.ERROR('could not get by email- looking for', body.email, e);
        badRequest(res);
        return;
    }
}
export async function handleSubmitShowRequest(req: express.Request,
                                              res: express.Response,
                                              authToken: AuthToken): Promise<void> {
    const body: { otherRequestOwners: number[],
                  showName: string,
                  dayArr: DayOfWeek[],
                  hoursArr: number[],
                  doesAlternate: boolean,
                  semester: Semester,
                  year: number
    } = req.body;

    if (!body) {
        badRequest(res);
        return;
    }

    try {
        body.year = parseInt(body.year as any);
        if (body.otherRequestOwners) {
            body.otherRequestOwners = body.otherRequestOwners.map((x: any) => parseInt(x));
        } else {
            body.otherRequestOwners = [];
        }
        body.hoursArr = body.hoursArr.map((x: any) => parseInt(x));
        body.doesAlternate = JSON.parse(body.doesAlternate as any);
    } catch (e) {
        badRequest(res);
        return;
    }

    if (!validateKeys(body, {
            otherRequestOwners: { type: 'object', validation: [<T>(arr: T[]) => Array.isArray(arr)] },
            showName: COMMON_FIELD_SHAPES.nonemptyString,
            dayArr: COMMON_FIELD_SHAPES.nonemptyArray,
            hoursArr: COMMON_FIELD_SHAPES.nonemptyArray,
            doesAlternate: COMMON_FIELD_SHAPES.boolean,
            semester: COMMON_FIELD_SHAPES.semester,
            year: COMMON_FIELD_SHAPES.nonnegativeNum, })) {
        badRequest(res);
        return;
    }

    if (body.dayArr.length > 15 || body.hoursArr.length > 15 || body.dayArr.length !== body.hoursArr.length) {
        badRequest(res, 'BAD_ARRAY_LENGTH');
        return;
    }

    //TODO: make sure array of days and hours are okay

    const requestOwners: number[] = body.otherRequestOwners.concat([authToken.id]);

    try {
        await db.dj.submitShowRequest(requestOwners,
                                      new HTMLEscapedString(body.showName),
                                      body.dayArr,
                                      body.hoursArr,
                                      body.doesAlternate,
                                      body.semester,
                                      body.year);
    } catch (e) {
        if (e.message === 'prohibited members') {
            badRequest(res, 'NOT_SIGNED_AGREEMENT');
            return;
        }
        log.ERROR('failed to submit show request', body, e);
        badRequest(res);
        return;
    }
    log.INFO(authToken.email, 'submitted a show request for "', body.showName, '"');

    // fire off emails
    db.dj.findEmailsByIds(requestOwners)
        .then(emails => Emailer.getInstance().showRequestSubmission(emails, new HTMLEscapedString(body.showName)))
        .then((_: any) => log.INFO('Sent notification to owners of', body.showName))
        .catch(e => {
            log.ERROR('failed to notify', authToken.email, 'and other owners of show request "', body.showName, '" by email', e);
        });

    successResponse(res);
}
export async function handleGetVolunteerHours(req: express.Request,
                                              res: express.Response,
                                              authToken: AuthToken): Promise<void> {
    try {
        const data: VolunteerHours[] = await db.dj.getVolunteerHours(authToken.id);
        log.INFO(authToken.email, 'requesting their volunteer hours');
        jsonResponse(res, data);
    } catch (e) {
        log.ERROR('exception while retrieving volunteer hours for', authToken.email);
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
