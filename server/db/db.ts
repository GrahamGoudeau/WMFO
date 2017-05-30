import * as pgpLib from 'pg-promise';
import {QueryFile, TQueryFileOptions} from 'pg-promise';
import Config from '../utils/config';
import Logger from '../utils/logger';
import Maybe from '../utils/maybe';
import Either from '../utils/either';
import * as path from 'path';
import { HTMLEscapedString } from '../utils/functionalUtils';
import { PermissionLevel, ResponseMessage } from '../utils/requestUtils';

const CONFIG: Config = Config.getInstance();

function sql(file: string, log: Logger): QueryFile {
        const fullPath: string = path.join(__dirname, file);

        const options: TQueryFileOptions = {
            minify: true,
        };
        const qf: QueryFile = new QueryFile(fullPath, options);
        if (qf.error) {
            log.ERROR(qf.error);
        }
        return qf;
}

export interface CommunityMemberRecord {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    active: boolean;
    tuftsId: number;
    lastAgreementSigned?: number;
    permissionLevels: PermissionLevel[];
}

export interface AllUserInfo extends CommunityMemberRecord {
    dateLastAgreementSigned: Date;
    confirmedVolunteerHours: number;
    pendingVolunteerHours: number;
    numShowsHosted: number;
}

export interface PendingCommunityMember {
    email: string;
    code?: string;
    permissionLevels: PermissionLevel[];
}

export interface UpdatedPermissions {
    communityMemberId: number;
    permissionLevels: PermissionLevel[];
}

export interface VolunteerHours {
    id: number;
    created: Date;
    volunteerDate: Date;
    numHours: number;
    description: string;
    confirmed: boolean;
    email: string;
}

export type DBResult<T> = Either<ResponseMessage, T>;
export type DBAsyncResult<T> = Promise<DBResult<T>>;

function buildMessage(e: any, process: string, log: Logger): ResponseMessage {
    switch (e.code) {
        case '23505':
            return 'ALREADY_EXISTS';
        case 0:
            return 'NOT_FOUND';
        default:
            log.ERROR('error during', process, e.message);
            return 'DB_ERROR';
    }
}

class DJManagement {
    private readonly queries: {
        register: QueryFile,
        findByEmailAndPassword: QueryFile,
        getPermissionLevels: QueryFile,
        hasSignedMostRecentAgreement: QueryFile,
        findById: QueryFile,
        getSingleUnconfirmedAccount: QueryFile,
        getPendingPermissionsByEmail: QueryFile,
        getEmailFromPendingCode: QueryFile,
        claimPendingAccount: QueryFile,
        logVolunteerHours: QueryFile,
        getVolunteerHours: QueryFile,
    };
    private readonly columnSets: {
        addManyPermissions: pgpLib.ColumnSet,
    };

    private readonly log: Logger;
    constructor(private readonly pgp: pgpLib.IMain, private readonly db: pgpLib.IDatabase<any>) {
        this.log = new Logger('dj-management');
        this.queries = {
            register: sql('queries/registerDj.sql', this.log),
            findByEmailAndPassword: sql('queries/findByEmailAndPassword.sql', this.log),
            getPermissionLevels: sql('queries/getPermissionLevels.sql', this.log),
            hasSignedMostRecentAgreement: sql('queries/hasSignedMostRecentAgreement.sql', this.log),
            findById: sql('queries/findById.sql', this.log),
            getSingleUnconfirmedAccount: sql('queries/getSingleUnconfirmedAccount.sql', this.log),
            getPendingPermissionsByEmail: sql('queries/getPendingPermissionsByEmail.sql', this.log),
            getEmailFromPendingCode: sql('queries/getEmailFromPendingCode.sql', this.log),
            claimPendingAccount: sql('queries/claimPendingAccount.sql', this.log),
            logVolunteerHours: sql('queries/logVolunteerHours.sql', this.log),
            getVolunteerHours: sql('queries/getVolunteerHours.sql', this.log),
        };
        this.columnSets = {
            addManyPermissions: new this.pgp.helpers.ColumnSet(['community_member_id', 'permission_level'], {table: 'permission_level_t'}),
        };

    }

    async claimPendingAccount(email: HTMLEscapedString): Promise<void> {
        await this.db.none(this.queries.claimPendingAccount, [email.value]);
    }

    async getPermissionLevels(communityMemberId: number): Promise<PermissionLevel[]> {
        const data = await this.db.any(this.queries.getPermissionLevels, [communityMemberId]);
        return data.map((obj: any) => obj.permission_level);
    }

    async getVolunteerHours(communityMemberId: number): Promise<VolunteerHours[]> {
        const data = await this.db.any(this.queries.getVolunteerHours, [communityMemberId]);
        return data.map((record: any) => {
            const hours: VolunteerHours = {
                id: record.id,
                created: record.created,
                volunteerDate: record.volunteer_date,
                numHours: record.num_hours,
                description: record.description,
                confirmed: record.confirmed,
                email: record.email
            };
            return hours;
        });
    }

    async getSingleUnconfirmedAccount(code: string): DBAsyncResult<PendingCommunityMember> {
        try {
            const result = await this.db.one(this.queries.getSingleUnconfirmedAccount, [code]);
            return Either.Right<ResponseMessage, PendingCommunityMember>({
                email: result.email,
                code: result.code,
                permissionLevels: result.permission_levels
            });
        } catch (e) {
            return Either.Left<ResponseMessage, PendingCommunityMember>(buildMessage(e, 'get single unconfirmed account', this.log));
        }
    }

    async hasSignedMostRecentAgreement(id: number): DBAsyncResult<boolean> {
        try {
            const data = await this.db.one(this.queries.hasSignedMostRecentAgreement, [id]);
            return Either.Right<ResponseMessage, boolean>(data.result);
        } catch (e) {
            return Either.Left<ResponseMessage, boolean>(buildMessage(e, 'check most recent agreement', this.log));
        }
    }

    private buildCommunityMember(data: any): CommunityMemberRecord {
        const permissionLevels: PermissionLevel[] = [];
        data.forEach((record: any) => {
            if (record.permission_level) permissionLevels.push(record.permission_level);
        });
        const member: CommunityMemberRecord = {
            id: data[0].id,
            firstName: data[0].first_name,
            lastName: data[0].last_name,
            email: data[0].email,
            active: data[0].active,
            tuftsId: data[0].tufts_id,
            lastAgreementSigned: data[0].last_agreement_signed,
            permissionLevels: permissionLevels
        };
        return member;
    }

    async logVolunteerHours(volunteerDate: Date, numHours: number, description: HTMLEscapedString, id: number): Promise<void> {
        await this.db.none(this.queries.logVolunteerHours, [volunteerDate, numHours, description.value, id]);
    }

    async findById(id: number): DBAsyncResult<CommunityMemberRecord> {
        try {
            const data = await this.db.many(this.queries.findById, [id]);
            return Either.Right<ResponseMessage, CommunityMemberRecord>(this.buildCommunityMember(data));
        } catch (e) {
            return Either.Left<ResponseMessage, CommunityMemberRecord>(buildMessage(e, 'find by id', this.log));
        }
    }

    async findByEmailAndPassword(email: HTMLEscapedString,
                                 passwordHash: string): DBAsyncResult<CommunityMemberRecord> {
        try {
            const data = await this.db.many(this.queries.findByEmailAndPassword, [email.value, passwordHash]);

            return Either.Right<ResponseMessage, CommunityMemberRecord>(this.buildCommunityMember(data));
        } catch (e) {
            return Either.Left<ResponseMessage, CommunityMemberRecord>(buildMessage(e, 'login', this.log));
        }
    }

    async getEmailFromPendingCode(code: string): DBAsyncResult<string> {
        try {
            return Either.Right<ResponseMessage, string>((await this.db.one(this.queries.getEmailFromPendingCode, [code])).email);
        } catch (e) {
            return Either.Left<ResponseMessage, string>(buildMessage(e, 'get email from pending', this.log));
        }
    }

    async register(firstName: HTMLEscapedString,
                   lastName: HTMLEscapedString,
                   email: HTMLEscapedString,
                   passwordHash: string,
                   tuftsId?: number): DBAsyncResult<number> {
        try {
            let idResult: number;
            await this.db.tx(t => {
                return t.one(this.queries.register, [firstName.value, lastName.value, email.value, passwordHash, tuftsId || null], (a: { id: number }) => +a.id)
                    .then((id: number) => {
                        idResult = id;
                        return t.map(this.queries.getPendingPermissionsByEmail, [email.value], (record: any) => ({
                            community_member_id: idResult,
                            permission_level: record.permission_level
                        }));
                    })
                    .then((insertInfo: { community_member_id: number; permission_level: PermissionLevel }) => {
                        return t.none(this.pgp.helpers.insert(insertInfo, this.columnSets.addManyPermissions));
                    });
            });

            return Either.Right<ResponseMessage, number>(idResult);
        } catch (e) {
            return Either.Left<ResponseMessage, number>(buildMessage(e, 'registration', this.log));
        }
    }
}

class ExecBoardManagement {
    private readonly log = new Logger('exec-management');
    private readonly queries: {
        getUnconfirmedAccounts: QueryFile,
        getHoursByEmail: QueryFile,
        getUnconfirmedHours: QueryFile,
        approveHours: QueryFile,
        deleteHours: QueryFile,
        getAllUserInfo: QueryFile,
        deleteAllPermissions: QueryFile,
    };
    private readonly columnSets: {
        addPendingMembers: pgpLib.ColumnSet,
        addPendingPermissions: pgpLib.ColumnSet,
        changePermissions: pgpLib.ColumnSet,
    };

    constructor(private readonly pgp: pgpLib.IMain, private readonly db: pgpLib.IDatabase<any>) {
        this.log = new Logger('exec-management');
        this.queries = {
            getUnconfirmedAccounts: sql('queries/getUnconfirmedAccounts.sql', this.log),
            getHoursByEmail: sql('queries/getHoursByEmail.sql', this.log),
            getUnconfirmedHours: sql('queries/getUnconfirmedHours.sql', this.log),
            approveHours: sql('queries/approveHours.sql', this.log),
            deleteHours: sql('queries/deleteHours.sql', this.log),
            getAllUserInfo: sql('queries/getAllUserInfo.sql', this.log),
            deleteAllPermissions: sql('queries/deleteAllPermissions.sql', this.log),
        };
        this.columnSets = {
            addPendingMembers: new this.pgp.helpers.ColumnSet(['email'], {table: 'pending_community_members_t'}),
            addPendingPermissions: new this.pgp.helpers.ColumnSet(['pending_community_members_email', 'permission_level'], {table: 'pending_members_permissions_t'}),
            changePermissions: new this.pgp.helpers.ColumnSet(['community_member_id', 'permission_level'], {table: 'permission_level_t'}),
        }
    }

    async changePermissions(updatedPermissions: UpdatedPermissions): Promise<void> {
        const insertValues: { community_member_id: number; permission_level: PermissionLevel }[] = [];

        updatedPermissions.permissionLevels.forEach((newLevel: PermissionLevel) => {
            insertValues.push({
                community_member_id: updatedPermissions.communityMemberId,
                permission_level: newLevel
            });
        });

        const data = await this.db.tx(t => {
            return t.any(this.queries.deleteAllPermissions, [updatedPermissions.communityMemberId])
                .then((deleteData: any[]) => {
                    if (deleteData.length > 0) {
                        return Promise.reject(new Error('Delete permissions failed'));
                    }
                    return t.none(this.pgp.helpers.insert(insertValues, this.columnSets.changePermissions));
                });
        });
    }

    async addPendingMembers(pendingMembers: PendingCommunityMember[]): DBAsyncResult<{}> {
        const values = pendingMembers.map((member: PendingCommunityMember) => { return { email: member.email, code: member.code } });
        const permissionValues: { pending_community_members_email: string; permission_level: PermissionLevel }[] = [];
        pendingMembers.forEach((member: PendingCommunityMember) =>
            member.permissionLevels.forEach((level: PermissionLevel) => {
                permissionValues.push({
                    pending_community_members_email: member.email,
                    permission_level: level
                });
            })
        );
        try {
            const data = await this.db.tx(t => {
                const q1 = t.none(this.pgp.helpers.insert(values, this.columnSets.addPendingMembers));
                const q2 = t.none(this.pgp.helpers.insert(permissionValues, this.columnSets.addPendingPermissions));

                return t.batch([q1, q2]);
            });
        } catch (e) {
            return Either.Left<ResponseMessage, {}>(buildMessage(e, 'add pending members', this.log));
        }
        return Either.Right<ResponseMessage, {}>({});
    }

    async getAllUserInfo(): Promise<AllUserInfo[]> {
        const data = await this.db.many(this.queries.getAllUserInfo);
        return data.map((record: any) => {
            return {
                id: record.id,
                firstName: record.first_name,
                lastName: record.last_name,
                email: record.email,
                active: record.active,
                tuftsId: record.tufts_id,
                lastAgreementSigned: record.last_agreement_signed,
                dateLastAgreementSigned: record.date_last_agreement_signed,
                permissionLevels: record.permission_levels,
                confirmedVolunteerHours: record.confirmed_volunteer_hours,
                pendingVolunteerHours: record.pending_volunteer_hours,
                numShowsHosted: parseInt(record.num_shows_hosted), // the COUNT operator may return an integer larger than JS can represent in the number type, so pg returns a string
            };
        });
    }

    async approveHours(hoursId: number): Promise<void> {
        await this.db.none(this.queries.approveHours, [hoursId]);
    }

    async resolveHours(hoursId: number, toDelete: boolean): Promise<void> {
        if (toDelete) await this.db.none(this.queries.deleteHours, [hoursId]);
        else await this.db.none(this.queries.approveHours, [hoursId]);
    }

    async getUnconfirmedAccounts(): Promise<PendingCommunityMember[]> {
        this.log.DEBUG('getting unconfirmed accounts');
        const data = await this.db.any(this.queries.getUnconfirmedAccounts);
        return data.map((record: any) => {
            const member: PendingCommunityMember = {
                email: record.email,
                code: record.code,
                permissionLevels: record.permission_levels,
            };
            return member;
        });
    }

    async getUnconfirmedHours(): Promise<VolunteerHours[]> {
        return await this.db.map(this.queries.getUnconfirmedHours, [], (record: any) => ({
                id: record.id,
                created: record.created,
                volunteerDate: record.volunteer_date,
                numHours: record.num_hours,
                description: record.description,
                confirmed: record.confirmed,
                email: record.email
            }));
    }
}

export default class Database {
    private static INSTANCE: Database = null;
    private db: pgpLib.IDatabase<any>;
    private pgp: pgpLib.IMain;
    private readonly log = new Logger('db');

    public readonly dj: DJManagement;
    public readonly exec: ExecBoardManagement;

    private constructor() {
        const pgp: pgpLib.IMain = pgpLib({});
        this.pgp = pgp;
        let dbUrl: string;
        const isProduction: boolean = CONFIG.getBooleanConfig('PRODUCTION');
        if (isProduction) {
            this.log.INFO('Using production db');
            dbUrl = CONFIG.getStringConfig('DATABASE_URL');
        } else {
            this.log.INFO('Using dev db');
            dbUrl = CONFIG.getStringConfig('DEV_DATABASE_URL');
        }
        this.db = pgp(`${dbUrl}?${isProduction ? 'ssl=true' : ''}`);
        this.dj = new DJManagement(this.pgp, this.db);
        this.exec = new ExecBoardManagement(this.pgp, this.db);
    }

    public static getInstance(): Database {
        if (this.INSTANCE == null) {
            this.INSTANCE = new Database();
        }
        return this.INSTANCE;
    }
}
