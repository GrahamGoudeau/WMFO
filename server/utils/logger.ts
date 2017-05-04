import { o } from './functionalUtils';

enum DebugLevel {
    INFO,
    DEBUG,
    ERROR
}
export default class Logger {
    public static readonly DebugLevel = DebugLevel;
    public readonly INFO: (...msgs: any[]) => void;
    public readonly DEBUG: (...msgs: any[]) => void;
    public readonly ERROR: (...msgs: any[]) => void;
    constructor(public readonly name: string) {
        const infoLogger = new LoggerModule(name, DebugLevel.INFO);
        this.INFO = infoLogger.log.bind(infoLogger);

        const debugLogger = new LoggerModule(name, DebugLevel.DEBUG);
        this.DEBUG = debugLogger.log.bind(debugLogger);

        const errorLogger = new LoggerModule(name, DebugLevel.ERROR);
        this.ERROR = errorLogger.log.bind(errorLogger);
    }
}

function levelToString(level: DebugLevel) {
    switch (level) {
        case DebugLevel.INFO:
            return 'INFO';
        case DebugLevel.DEBUG:
            return 'DEBUG';
        case DebugLevel.ERROR:
            return 'ERROR';
        default:
            throw new Error(`Unmatched case for debug level ${level}`);
    }
}

class LoggerModule {
    private isProduction: boolean = process.env.PRODUCTION === 'true';
    private stringify: (x: any[]) => string = o(x => x.join(' '), (y: any[]) => y.map(msg => {
        if (typeof msg === 'object') {
            return JSON.stringify(msg);
        } else {
            return msg.toString();
        };
    }));

    constructor(private name: string, private level: DebugLevel) {
        // TODO: figure out a way around this dependency cycle that ISNT hacky and awful
        //this.isProduction = this.config.getBooleanConfigDefault('PRODUCTION', false);
    }

    public log(...msgs: any[]): void {
        if (this.isProduction && this.level == DebugLevel.DEBUG) {
            return;
        }

        // super gross code just to get a nicely formatted date in MM/dd/yyyy format
        var d = new Date(),
            dformat = ("00" + (d.getMonth() + 1)).slice(-2) + "/" +
                ("00" + d.getDate()).slice(-2) + "/" +
                d.getFullYear() + " " +
                ("00" + d.getHours()).slice(-2) + ":" +
                ("00" + d.getMinutes()).slice(-2) + ":" +
                ("00" + d.getSeconds()).slice(-2);

        const message = `[${levelToString(this.level)} ${this.name} ${dformat}] -- ${this.stringify(msgs)}`;
        console.log(message);
        if (this.level === DebugLevel.ERROR && this.isProduction) {
            /*
            const emailer: IEmailer = getEmailerInstance();
            emailer.errorAlert(message);
            */
            console.trace();
        }
    }
}
