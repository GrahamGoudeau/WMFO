import Logger from './logger';

export default class Config {
    private static INSTANCE: Config = null;
    public static getInstance() {
        if (Config.INSTANCE == null) {
            Config.INSTANCE = new Config(process.env);
        }
        return Config.INSTANCE;
    }

    private readonly boolType = 'boolean';
    private readonly stringType = 'string';
    private readonly numberType = 'number';

    private readonly registeredFields = {
        booleanFields: <string[]>[
            'PRODUCTION',
            'MAIL_DEBUG',
        ],
        stringFields: <string[]>[
            'DEV_DATABASE_URL',
            'DATABASE_URL',
            'MAIL_USER',
            'MAIL_PASS',
            'DOMAIN_NAME',
        ],
        numberFields: <string[]>[
            'PORT',
        ]
    };
    private typeMapping: {
        [key: string]: string
    } = {};
    private readonly log = new Logger('config');

    private constructor(private readonly env: any) {
        const checkKey = (k: string, type: string) => {
            if (env[k] == null) {
                this.log.INFO(`Config key ${k} of type '${type}' not set`);
            }
        };
        this.registeredFields.booleanFields.forEach(k => {
            checkKey(k, this.boolType);
            this.typeMapping[k] = this.boolType;
        });
        this.registeredFields.stringFields.forEach(k => {
            checkKey(k, this.stringType);
            this.typeMapping[k] = this.stringType;
        });
        this.registeredFields.numberFields.forEach(k => {
            checkKey(k, this.numberType);
            this.typeMapping[k] = this.numberType;
        });
    };

    private getConfig(key: string, returnType: 'boolean' | 'string' | 'number'): boolean | string | number {
        let reason: string = null;
        if (this.env[key] == null) {
            reason = `Config key ${key} not set`;
        } else if (this.typeMapping[key] == null) {
            reason = `Config key ${key} not registered in config.ts`;
        } else if (this.typeMapping[key] !== returnType) {
            reason = `Config key ${key} not of type '${returnType}'`;
        }

        if (reason != null) {
            this.log.ERROR(reason);
            throw new Error(reason);
        }

        const value: string = this.env[key];
        if (returnType === 'boolean') {
            if (value === 'true') {
                return true;
            } else if (value === 'false') {
                return false;
            } else {
                throw new Error(`Config key ${key} set but invalid value '${value}' for type '${returnType}'`);
            }
        } else if (returnType === 'string') {
            return value;
        } else if (returnType === 'number') {
            const result: number = Number(value);
            if (value === '' || isNaN(result)) {
                throw new Error(`Config key ${key} set to '${value}' which is not of type integer`);
            }
            return result;
        }
        throw new Error(`Should be impossible to reach`);
    }

    public getBooleanConfig(key: string): boolean {
        return this.getConfig(key, 'boolean') as boolean;
    }

    public getBooleanConfigDefault(key: string, other: boolean): boolean {
        if (!this.isConfigSet(key)) {
            this.log.INFO(`Request for config key ${key} defaulting to ${other}`);
            return other;
        }
        return this.getBooleanConfig(key);
    }

    public getStringConfig(key: string): string {
        return this.getConfig(key, 'string') as string;
    }

    public getStringConfigDefault(key: string, other: string): string {
        if (!this.isConfigSet(key)) {
            this.log.INFO(`Request for config key ${key} defaulting to ${other}`);
            return other;
        }
        return this.getStringConfig(key);
    }

    public getNumberConfig(key: string): number {
        return this.getConfig(key, 'number') as number;
    }

    public getNumberConfigDefault(key: string, other: number): number {
        if (!this.isConfigSet(key)) {
            return other;
        }
        return this.getNumberConfig(key);
    }

    public isConfigSet(key: string): boolean {
        return this.env[key] != null;
    }
}
