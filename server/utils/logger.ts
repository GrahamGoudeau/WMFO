import { readLines, o } from './functionalUtils';
import * as fs from 'fs';

enum DebugLevel {
    INFO,
    DEBUG,
    ERROR
}

export default class Logger {
    public static readonly DebugLevel = DebugLevel;
    private static readonly LOG_FILENAME = 'wmfo.log';
    private static readonly FILE_PATH_STR = `${__dirname}/../${Logger.LOG_FILENAME}`;
    private static readonly createLogFile: (path: string) => fs.WriteStream = (path: string) => fs.createWriteStream(path, { flags: 'a' });
    private static LOG_FILE: fs.WriteStream = Logger.createLogFile(Logger.FILE_PATH_STR);
    private static readonly LINE_LIMIT: number = 20000;
    private static numLinesWritten: number = 0;

    private static writeLineToLog(message: string): void {
        if (Logger.numLinesWritten > Logger.LINE_LIMIT) {
            Logger.LOG_FILE.close();
            fs.unlinkSync(Logger.FILE_PATH_STR);
            Logger.LOG_FILE = Logger.createLogFile(Logger.FILE_PATH_STR);
            Logger.numLinesWritten = 0;
        }
        Logger.LOG_FILE.write(`${message}\n`);
        Logger.numLinesWritten += 1;
    }

    public readonly INFO: (...msgs: any[]) => void;
    public readonly DEBUG: (...msgs: any[]) => void;
    public readonly ERROR: (...msgs: any[]) => void;
    constructor(public readonly name: string) {
        const infoLogger = new LoggerModule(name, DebugLevel.INFO, Logger.FILE_PATH_STR, Logger.writeLineToLog);
        this.INFO = infoLogger.log.bind(infoLogger);

        const debugLogger = new LoggerModule(name, DebugLevel.DEBUG, Logger.FILE_PATH_STR, Logger.writeLineToLog);
        this.DEBUG = debugLogger.log.bind(debugLogger);

        const errorLogger = new LoggerModule(name, DebugLevel.ERROR, Logger.FILE_PATH_STR, Logger.writeLineToLog);
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

    constructor(private name: string,
                private level: DebugLevel,
                private readonly logPathStr: string,
                private readonly writeToFile: (message: string) => void) {
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
        this.writeToFile(message);
        function getStackTrace(): string {
           return new Error().stack;
        };
        if (this.level === DebugLevel.ERROR && this.isProduction) {
            /*
            const emailer: IEmailer = getEmailerInstance();
            emailer.errorAlert(message);
            */
            console.trace();
            this.writeToFile(getStackTrace());
        }
    }
}
