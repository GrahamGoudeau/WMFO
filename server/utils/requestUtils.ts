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

export type ResponseMessage =
    'DB_ERROR' |
    'ALREADY_EXISTS' |
    'ACCOUNT_DEACTIVATED' |
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

function buildWMFOError(message: string, error?: any): WMFOResponse {
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

export function badRequest(res: express.Response, message?: string, error?: any): void {
    const response: WMFOResponse = buildWMFOError(defaults(message, 'bad request'), error);

    res.status(400).json(response);
}

export function internalError(res: express.Response, message?: string, error?: any): void {
    const response: WMFOResponse = buildWMFOError(defaults(message, 'internal server error'), error);

    res.status(500).json(response);
}

export function unauthorizedError(res: express.Response, message?: string, error?: any): void {
    const response: WMFOResponse = buildWMFOError(defaults(message, 'unauthorized'), error);

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
