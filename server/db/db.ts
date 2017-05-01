import * as pgpLib from 'pg-promise';
import {QueryFile, TQueryFileOptions} from 'pg-promise';
import Config from '../utils/config';
import Logger from '../utils/logger';
import * as path from 'path';

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

class DJManagement {
    private readonly queries = {
        register: sql('queries/registerDj.sql', this.log)
    };

    private readonly log = new Logger('dj-management');
    constructor(private readonly db: pgpLib.IDatabase<any>) {}

    async register(firstName: string,
                   lastName: string,
                   email: string,
                   passwordHash: string,
                   tuftsId?: number): Promise<number> {
        try {
            const x = await this.db.none(this.queries.register,
                     [firstName, lastName, email, passwordHash, tuftsId ? tuftsId : null]);
            console.log(x);
        } catch (e) {
            this.log.ERROR(e);
        }
        return 0;
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
