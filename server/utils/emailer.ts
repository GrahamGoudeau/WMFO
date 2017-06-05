import { o } from "./functionalUtils";
import * as fs from "fs";
import * as handlebars from "handlebars";
import Logger from "./logger";
import Config from "./config";
import Maybe from "./maybe";
const NodeMailer = require("nodemailer");
const CONFIG: Config = Config.getInstance();

export abstract class Emailer {
    private static INSTANCE: Emailer = null;
    protected abstract log: Logger;
    abstract async registerNotification(recipients: { email: string, url: string }[]): Promise<string[]>;

    static getInstance() {
        if (this.INSTANCE == null) {
            const isProd: boolean = CONFIG.getBooleanConfig("PRODUCTION");
            const isMailDebug: boolean = CONFIG.getBooleanConfig('MAIL_DEBUG');
            if (isProd || isMailDebug) {
                this.INSTANCE = new ProdEmailer();
            } else {
                this.INSTANCE = new DisabledEmailer()
            }
        }
        return this.INSTANCE;
    }
}

class ProdEmailer extends Emailer {
    protected readonly log: Logger = new Logger("production-emailer");
    private readonly mailClient: any = NodeMailer.createTransport({
        host: "smtp.gmail.com",
        secure: true,
        auth: {
            user: CONFIG.getStringConfig("MAIL_USER"),
            pass: CONFIG.getStringConfig("MAIL_PASS"),
        }
    });
    private readonly DOMAIN_NAME: string = CONFIG.getStringConfig('DOMAIN_NAME');
    private readonly TEMPLATE_DIR: string = `${__dirname}/../templates/`;

    private readonly compileFromTemplateSource: (fileName: string) => HandlebarsTemplateDelegate
        = o(handlebars.compile, x => fs.readFileSync(`${this.TEMPLATE_DIR}/${x}.html`, 'utf8'));

    private readonly templates = {
        registerNotification: this.compileFromTemplateSource('registerNotification'),
    };

    // returns a list of the email addresses that failed to send
    private async sendMultipleMail(mailOptions: { from: string, to: string, subject: string, html: string }[]): Promise<string[]> {
        const self = this;

        // send an email after a delay to avoid rate limiting
        const delay = 1000 * 30;
        const promises = mailOptions.map((option, index) => {
            const thisDelay = delay * index;
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    self.log.INFO('Sending to', option.to, ', remaining:', mailOptions.map(opt => opt.to).slice(index + 1));
                    self.mailClient.sendMail(option, (error: any, info: any) => {
                        if (error || (info && info.rejected != null && info.rejected.length > 0)) {
                            self.log.ERROR('Mail send failed:', error);
                            resolve(option.to);
                        } else {
                            resolve(null);
                        }
                    });
                }, thisDelay);
            });
        });
        return Promise.all(promises) as Promise<string[]>;
    }

    async registerNotification(recipients: { email: string, url: string }[]): Promise<string[]> {
        const self = this;
        const optionsArr = recipients.map(recipient => {
            const mailOptions = {
                from: CONFIG.getStringConfig("MAIL_USER"),
                to: recipient.email,
                subject: "Welcome to the WMFO DJ Portal",
                html: self.templates.registerNotification({
                    url: recipient.url
                }),
            };
            return mailOptions;
        });
        const failedEmails: string[] = await this.sendMultipleMail(optionsArr);
        if (failedEmails.length > 0) {
            this.log.ERROR('Failed to send emails to', failedEmails);
        }
        return failedEmails;
    }

    constructor() {
        super();
        this.log.INFO('Using production emailer');
    }
}

class DisabledEmailer extends Emailer {
    protected readonly log: Logger = new Logger("disabled-emailer");
    async registerNotification(recipients: { email: string, url: string }[]): Promise<string[]> {
        return [];
    }

    constructor() {
        super();
        this.log.INFO('Using disabled emailer');
    }
}
