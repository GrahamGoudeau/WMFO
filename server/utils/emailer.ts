import { o } from "./functionalUtils";
import * as fs from "fs";
import * as handlebars from "handlebars";
import Logger from "./logger";
import Config from "./config";
import Maybe from "./maybe";
import * as SparkPost from "sparkpost";
const CONFIG: Config = Config.getInstance();

export abstract class Emailer {
    private static INSTANCE: Emailer = null;
    protected abstract log: Logger;
    abstract async registerNotification(recipients: { firstName: string, email: string, url: string }[]): Promise<string[]>;

    static getInstance() {
        if (this.INSTANCE == null) {
            const isProd: boolean = CONFIG.getBooleanConfig("PRODUCTION");
            const isMailDebug: boolean = CONFIG.getBooleanConfig('MAIL_DEBUG');
            if (isProd || isMailDebug) {
                this.INSTANCE = new ProdEmailer();
            } else {
                this.INSTANCE = new DisabledEmailer();
            }
        }
        return this.INSTANCE;
    }
}

class ProdEmailer extends Emailer {
    protected readonly log: Logger = new Logger("production-emailer");
    private readonly sparkPostClient: SparkPost = new SparkPost(CONFIG.getStringConfig('SPARKPOST_API_KEY'));
    private readonly FROM_ADDRESS: string = 'do-not-reply@wmfo.org';
    private readonly DOMAIN_NAME: string = CONFIG.getStringConfig('DOMAIN_NAME');
    private readonly TEMPLATE_DIR: string = `${__dirname}/../templates/`;

    private readonly compileFromTemplateSource: (fileName: string) => HandlebarsTemplateDelegate
        = o(handlebars.compile, x => fs.readFileSync(`${this.TEMPLATE_DIR}/${x}.html`, 'utf8'));

    private readonly templates = {
        registerNotification: this.compileFromTemplateSource('registerNotification'),
    };

    async registerNotification(recipients: { firstName: string, email: string, url: string }[]): Promise<string[]> {
        const self = this;
        const failedArrayPromises = recipients.map(recipient => {
            return this.sparkPostClient.transmissions.send({
                content: {
                    from: this.FROM_ADDRESS,
                    subject: 'Welcome to the WMFO DJ Portal',
                    html: this.templates.registerNotification({
                        firstName: recipient.firstName,
                        url: recipient.url,
                    }),
                },
                recipients: [
                    { address: recipient.email }
                ]
            }).then(data => {
                console.log('data');
                if (data.results.total_accepted_recipients !== 1) {
                    return recipient.email;
                }
                return null;
            });
        });
        return Promise.all(failedArrayPromises)
            .then(data => data.filter(s => s != null))
            .catch(e => { self.log.ERROR('mail error experienced', e); throw new Error('mail error'); } );
    }

    constructor() {
        super();
        this.log.INFO('Using production emailer');
    }
}

class DisabledEmailer extends Emailer {
    protected readonly log: Logger = new Logger("disabled-emailer");
    async registerNotification(recipients: { firstName: string, email: string, url: string }[]): Promise<string[]> {
        return [];
    }

    constructor() {
        super();
        this.log.INFO('Using disabled emailer');
    }
}
