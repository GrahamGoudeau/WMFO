import * as express from 'express';
import * as bodyParser from 'body-parser';
import { HttpMethod, RouteManager, InsecureRoute, InsecureRouteBuilder, SecureRoute, SecureRouteBuilder } from './utils/routeUtils';
import { DJs, EXEC_BOARD, PermissionLevel } from './utils/requestUtils';
import Logger from './utils/logger';
import * as path from 'path';
import Config from './utils/config';
import DB from './db/db';
import * as DJ_api from './api/dj';
import * as Exec_api from './api/exec';
import * as Account_api from './api/account';
import { hashPassword } from './utils/security';

const log: Logger = new Logger('init');
const app: express.Express = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const clientDir: string = `${__dirname}/../client/dist/`;
app.use('/static/', express.static(path.resolve(clientDir)));

const CONFIG: Config = Config.getInstance();
DB.getInstance();

const routeManager = new RouteManager(app, '/login');

const registerRouteBuilder: InsecureRouteBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder('/api/account/register', Account_api.handleRegister)
    .setHttpMethod(HttpMethod.POST);

const loginRouteBuilder: InsecureRouteBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder('/api/account/login', Account_api.handleLogin)
    .setHttpMethod(HttpMethod.POST);

const logHoursBuilder: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/dj/log',
                                               DJ_api.handleLogHours,
                                               ['COMMUNITY_DJ',
                                                'STUDENT_DJ'])
    .setHttpMethod(HttpMethod.POST);

const getUnconfirmedAccountsBuilder: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/exec/getUnconfirmedAccounts',
                                               Exec_api.handleGetUnconfirmedAccounts,
                                               EXEC_BOARD)
    .setHttpMethod(HttpMethod.POST);

const getUnconfirmedHoursBuilder: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/exec/getUnconfirmedHours',
                                               Exec_api.handleGetUnconfirmedHours,
                                               EXEC_BOARD)
    .setHttpMethod(HttpMethod.POST);

const checkMostRecentAgreementBuilder: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/dj/checkMostRecentAgreement',
                                               DJ_api.handleCheckMostRecentAgreement,
                                               DJs)
    .setHttpMethod(HttpMethod.POST);

const loginRoute: InsecureRoute = new InsecureRoute(loginRouteBuilder);
const registerRoute: InsecureRoute = new InsecureRoute(registerRouteBuilder);
const logHoursRoute: SecureRoute = new SecureRoute(logHoursBuilder);
const getUnconfirmedAccountsRoute: SecureRoute = new SecureRoute(getUnconfirmedAccountsBuilder);
const getUnconfirmedHoursRoute: SecureRoute = new SecureRoute(getUnconfirmedHoursBuilder);

const insecureRoutes: InsecureRoute[] = [
    registerRoute,
    loginRoute,
];

const secureRoutes: SecureRoute[] = [
    logHoursRoute,
    getUnconfirmedAccountsBuilder,
    getUnconfirmedHoursBuilder,
    new SecureRoute(checkMostRecentAgreementBuilder),
];

routeManager.addInsecureRoutes(insecureRoutes);
routeManager.addSecureRoutes(secureRoutes);
const port = CONFIG.getNumberConfig('PORT');
app.listen(port);
log.INFO(`Listening on port ${port}`);
