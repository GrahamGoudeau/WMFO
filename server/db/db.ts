import * as pgpLib from 'pg-promise';
import {QueryFile, TQueryFileOptions} from 'pg-promise';
import Config from '../utils/config';
import Logger from '../utils/logger';
import Maybe from '../utils/maybe';
import Either from '../utils/either';
import * as path from 'path';
import { HashedPassword, HTMLEscapedString } from '../utils/functionalUtils';
import { PermissionLevel, ResponseMessage } from '../utils/requestUtils';

const CONFIG: Config = Config.getInstance();

function buildQueryFile(file: string, log: Logger): QueryFile {
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

abstract class ActionManagement {
    protected abstract queries: { [queryName: string]: QueryFile };
    protected abstract columnSets: { [columnSetName: string]: pgpLib.ColumnSet };
    protected log: Logger;
    protected pgp: pgpLib.IMain;
    protected db: pgpLib.IDatabase<any>;
    protected buildSql(filePath: string): QueryFile {
        return buildQueryFile(filePath, this.log);
    }
    protected buildColumnSet(fields: string[], tableName: string): pgpLib.ColumnSet {
        return new this.pgp.helpers.ColumnSet(fields, { table: tableName });
    }
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

class DJManagement extends ActionManagement {
    protected readonly queries: {
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
        changePassword: QueryFile,
        checkIfPendingMemberIsValid: QueryFile,
    };
    protected readonly columnSets: {
        addManyPermissions: pgpLib.ColumnSet,
    };

    constructor(protected readonly pgp: pgpLib.IMain, protected readonly db: pgpLib.IDatabase<any>) {
        super();
        this.log = new Logger('dj-management');
        this.queries = {
            register: this.buildSql('queries/registerDj.sql'),
            findByEmailAndPassword: this.buildSql('queries/findByEmailAndPassword.sql'),
            getPermissionLevels: this.buildSql('queries/getPermissionLevels.sql'),
            hasSignedMostRecentAgreement: this.buildSql('queries/hasSignedMostRecentAgreement.sql'),
            findById: this.buildSql('queries/findById.sql'),
            getSingleUnconfirmedAccount: this.buildSql('queries/getSingleUnconfirmedAccount.sql'),
            getPendingPermissionsByEmail: this.buildSql('queries/getPendingPermissionsByEmail.sql'),
            getEmailFromPendingCode: this.buildSql('queries/getEmailFromPendingCode.sql'),
            claimPendingAccount: this.buildSql('queries/claimPendingAccount.sql'),
            logVolunteerHours: this.buildSql('queries/logVolunteerHours.sql'),
            getVolunteerHours: this.buildSql('queries/getVolunteerHours.sql'),
            changePassword: this.buildSql('queries/changePassword.sql'),
            checkIfPendingMemberIsValid: this.buildSql('queries/checkIfPendingMemberIsValid.sql'),
        };
        this.columnSets = {
            addManyPermissions: this.buildColumnSet(['community_member_id', 'permission_level'], 'permission_level_t'),
        };

    }

    async changePassword(communityMemberId: number, newPasswordHash: HashedPassword): Promise<void> {
        await this.db.none(this.queries.changePassword, [newPasswordHash.value, communityMemberId]);
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
                                 passwordHash: HashedPassword): DBAsyncResult<CommunityMemberRecord> {
        try {
            const data = await this.db.many(this.queries.findByEmailAndPassword, [email.value, passwordHash.value]);

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
                   passwordHash: HashedPassword,
                   tuftsId?: number): DBAsyncResult<number> {
        try {
            let idResult: number;
            await this.db.tx(t => {
                return t.one(this.queries.checkIfPendingMemberIsValid, [email.value], (a: { is_valid: boolean }) => a.is_valid)
                    .then((isValid: boolean) => {
                        if (!isValid) throw new Error(`Account ${email.value} already claimed`);
                        return t.none(this.queries.claimPendingAccount, [email.value]);
                    })
                    .then((_: any) => t.one(this.queries.register,
                                            [firstName.value, lastName.value, email.value, passwordHash.value, tuftsId || null],
                                            (a: { id: number }) => +a.id))
                    .then((id: number) => {
                        idResult = id;
                        return t.map(this.queries.getPendingPermissionsByEmail, [email.value], (record: any) => ({
                            community_member_id: idResult,
                            permission_level: record.permission_level
                        }));
                    })
                    .then((insertInfo: { community_member_id: number; permission_level: PermissionLevel }[]) => {
                        return t.none(this.pgp.helpers.insert(insertInfo, this.columnSets.addManyPermissions));
                    });
            });

            return Either.Right<ResponseMessage, number>(idResult);
        } catch (e) {
            return Either.Left<ResponseMessage, number>(buildMessage(e, 'registration', this.log));
        }
    }
}

class ExecBoardManagement extends ActionManagement {
    protected readonly queries: {
        getUnconfirmedAccounts: QueryFile,
        getHoursByEmail: QueryFile,
        getUnconfirmedHours: QueryFile,
        approveHours: QueryFile,
        deleteHours: QueryFile,
        getAllUserInfo: QueryFile,
        deleteAllPermissions: QueryFile,
        deletePendingMember: QueryFile,
        toggleMemberActive: QueryFile,
    };
    protected readonly columnSets: {
        addPendingMembers: pgpLib.ColumnSet,
        addPendingPermissions: pgpLib.ColumnSet,
        changePermissions: pgpLib.ColumnSet,
    };

    constructor(protected readonly pgp: pgpLib.IMain, protected readonly db: pgpLib.IDatabase<any>) {
        super();
        this.log = new Logger('exec-management');
        this.queries = {
            getUnconfirmedAccounts: this.buildSql('queries/getUnconfirmedAccounts.sql'),
            getHoursByEmail: this.buildSql('queries/getHoursByEmail.sql'),
            getUnconfirmedHours: this.buildSql('queries/getUnconfirmedHours.sql'),
            approveHours: this.buildSql('queries/approveHours.sql'),
            deleteHours: this.buildSql('queries/deleteHours.sql'),
            getAllUserInfo: this.buildSql('queries/getAllUserInfo.sql'),
            deleteAllPermissions: this.buildSql('queries/deleteAllPermissions.sql'),
            deletePendingMember: this.buildSql('queries/deletePendingMember.sql'),
            toggleMemberActive: this.buildSql('queries/toggleMemberActive.sql'),
        };
        this.columnSets = {
            addPendingMembers: this.buildColumnSet(['email'], 'pending_community_members_t'),
            addPendingPermissions: this.buildColumnSet(['pending_community_members_email', 'permission_level'], 'pending_members_permissions_t'),
            changePermissions: this.buildColumnSet(['community_member_id', 'permission_level'], 'permission_level_t'),
        }
    }

    async deletePendingMember(code: string): Promise<void> {
        await this.db.none(this.queries.deletePendingMember, [code]);
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

    async toggleMemberActive(id: number): Promise<boolean> {
        return this.db.one(this.queries.toggleMemberActive, [id], (a: { active: boolean }) => a.active);
    }

    async addPendingMembers(pendingMembers: PendingCommunityMember[]): DBAsyncResult<{ email: string, code: string }[]> {
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
                const q1 = t.many(this.pgp.helpers.insert(values, this.columnSets.addPendingMembers) + 'RETURNING email, code');
                const q2 = t.none(this.pgp.helpers.insert(permissionValues, this.columnSets.addPendingPermissions));

                return t.batch([q1, q2]);
            });
            return Either.Right<ResponseMessage, { email: string, code: string }[]>(data[0]);
        } catch (e) {
            return Either.Left<ResponseMessage, { email: string, code: string }[]>(buildMessage(e, 'add pending members', this.log));
        }
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
