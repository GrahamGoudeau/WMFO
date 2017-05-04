import * as express from 'express';
import { defaults } from './functionalUtils';

export type PermissionLevel =
    'COMMUNITY_DJ' |
    'STUDENT_DJ' |
    'GENERAL_MANAGER' |
    'ASSISTANT_GENERAL_MANAGER' |
    'OPERATIONS_DIRECTOR' |
    'PROGRAMMING_DIRECTOR' |
    'SCHEDULING_COORDINATOR' |
    'VOLUNTEER_COORDINATOR' |
    'WEBMASTER';

export const ALL_PERMISSIONS: PermissionLevel[] = [
    'COMMUNITY_DJ',
    'STUDENT_DJ',
    'GENERAL_MANAGER',
    'ASSISTANT_GENERAL_MANAGER',
    'OPERATIONS_DIRECTOR',
    'PROGRAMMING_DIRECTOR',
    'SCHEDULING_COORDINATOR',
    'VOLUNTEER_COORDINATOR',
    'WEBMASTER'
];

export const EXEC_BOARD_PERMISSIONS: PermissionLevel[] = [
    'GENERAL_MANAGER',
    'ASSISTANT_GENERAL_MANAGER',
    'OPERATIONS_DIRECTOR',
    'PROGRAMMING_DIRECTOR',
    'SCHEDULING_COORDINATOR',
    'VOLUNTEER_COORDINATOR'
];

export const DJ_PERMISSIONS: PermissionLevel[] = [
    'STUDENT_DJ',
    'COMMUNITY_DJ'
];

export type ResponseMessage =
    'DB_ERROR' |
    'ALREADY_EXISTS' |
    'BAD_REQUEST' |
    'INTERNAL_ERROR' |
    'UNAUTHORIZED' |
    'ACCOUNT_DEACTIVATED' |
    'NOT_SIGNED_AGREEMENT' |
    'NOT_FOUND';


export interface AuthToken {
    email: string,
    id: number,
    authorizedAt: Date,
    permissionLevels: PermissionLevel[]
}

export interface WMFOResponse {
    error?: {
        message: string
        exn?: any
    },
    data?: any
}

function buildWMFOError(message: ResponseMessage, error?: any): WMFOResponse {
    const errorResponse: WMFOResponse = {
        error: {
            message: message
        }
    };

    if (error != null) {
        errorResponse.error.exn = error;
    }

    return errorResponse;
}

export function badRequest(res: express.Response, message?: ResponseMessage, error?: any): void {
    const response: WMFOResponse = buildWMFOError(defaults(message, 'BAD_REQUEST'), error);

    res.status(400).json(response);
}

export function internalError(res: express.Response, message?: ResponseMessage, error?: any): void {
    const response: WMFOResponse = buildWMFOError(defaults(message, 'INTERNAL_ERROR'), error);

    res.status(500).json(response);
}

export function unauthorizedError(res: express.Response, message?: ResponseMessage, error?: any): void {
    const response: WMFOResponse = buildWMFOError(defaults(message, 'UNAUTHORIZED'), error);

    res.status(401).json(response);
}

export function jsonResponse(res: express.Response, result: any): void {
    const response: WMFOResponse = {
        data: result
    };

    res.status(200).json(response);
}

export function successResponse(res: express.Response): void {
    res.status(200).send();
}
