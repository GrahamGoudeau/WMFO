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
    private readonly queries = {
        register: sql('queries/registerDj.sql', this.log),
        findByEmailAndPassword: sql('queries/findByEmailAndPassword.sql', this.log),
        getPermissionLevels: sql('queries/getPermissionLevels.sql', this.log),
    };

    private readonly log = new Logger('dj-management');
    constructor(private readonly db: pgpLib.IDatabase<any>) {}

    async getPermissionLevels(communityMemberId: number): Promise<PermissionLevel[]> {
        const data = await this.db.any(this.queries.getPermissionLevels, [communityMemberId]);
        return data.map((obj: any) => obj.permission_level);
    }

    async findByEmailAndPassword(email: HTMLEscapedString,
                                 passwordHash: string): DBAsyncResult<CommunityMemberRecord> {
        try {
            const data = await this.db.many(this.queries.findByEmailAndPassword, [email.value, passwordHash]);
            const permissionLevels: PermissionLevel[] = [];
            data.forEach((record: any) => {
                if (record.permission_level) permissionLevels.push(record.permission_level);
            });

            return Either.Right<ResponseMessage, CommunityMemberRecord>({
                id: data[0].id,
                firstName: data[0].first_name,
                lastName: data[0].last_name,
                email: data[0].email,
                active: data[0].active,
                tuftsId: data[0].tufts_id,
                lastAgreementSigned: data[0].last_agreement_signed,
                permissionLevels: permissionLevels
            });
        } catch (e) {
            return Either.Left<ResponseMessage, CommunityMemberRecord>(buildMessage(e, 'login', this.log));
        }
    }

    async register(firstName: HTMLEscapedString,
                   lastName: HTMLEscapedString,
                   email: HTMLEscapedString,
                   passwordHash: string,
                   tuftsId?: number): DBAsyncResult<number> {
        try {
            const idResult = await this.db.one(this.queries.register,
                     [firstName.value,
                      lastName.value,
                      email.value,
                      passwordHash,
                      tuftsId ? tuftsId : null]);

            return Either.Right<ResponseMessage, number>(idResult.id);
        } catch (e) {
            return Either.Left<ResponseMessage, number>(buildMessage(e, 'registration', this.log));
        }
    }
}

export default class Database {
    private static INSTANCE: Database = null;
    private db: pgpLib.IDatabase<any>;
    private readonly log = new Logger('db');

    public readonly dj: DJManagement;

    private constructor() {
        const pgp: pgpLib.IMain = pgpLib({});
        let dbUrl: string;
        const isProduction: boolean = CONFIG.getBooleanConfig('PRODUCTION');
        if (isProduction) {
            this.log.INFO('Using production db');
            dbUrl = CONFIG.getStringConfig('DATABASE_URL');
        } else {
            this.log.INFO('Using dev db');
            dbUrl = CONFIG.getStringConfig('DATABASE_URL');
        }
        const pgpCn: any = {
            host: dbUrl,
            database: CONFIG.getStringConfig('DATABASE_NAME')
        };
        this.db = pgp(pgpCn);
        this.dj = new DJManagement(this.db);
    }

    public static getInstance(): Database {
        if (this.INSTANCE == null) {
            this.INSTANCE = new Database();
        }
        return this.INSTANCE;
    }
}
