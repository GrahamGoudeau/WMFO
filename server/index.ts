import * as express from 'express';
import * as bodyParser from 'body-parser';
import { HttpMethod, RouteManager, InsecureRoute, InsecureRouteBuilder, SecureRoute, SecureRouteBuilder } from './utils/routeUtils';
import { ALL_PERMISSIONS, DJ_PERMISSIONS, EXEC_BOARD_PERMISSIONS, PermissionLevel } from './utils/requestUtils';
import Logger from './utils/logger';
import * as path from 'path';
import Config from './utils/config';
import DB from './db/db';
import * as DJ_api from './api/dj';
import * as Exec_api from './api/exec';
import * as Account_api from './api/account';
import { hashPassword } from './utils/security';

const log: Logger = new Logger('init');
log.INFO('Server starting');
const app: express.Express = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const clientDir: string = `${__dirname}/../client/dist/`;
app.use('/dist/', express.static(path.resolve(clientDir)));

const CONFIG: Config = Config.getInstance();
DB.getInstance();

const routeManager = new RouteManager(app, '/');

const registerRouteBuilder: InsecureRouteBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder('/api/account/register', Account_api.handleRegister)
    .setHttpMethod(HttpMethod.POST);

const loginRouteBuilder: InsecureRouteBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder('/api/account/login', Account_api.handleLogin)
    .setHttpMethod(HttpMethod.POST);

const profileRouteBuilder: SecureRouteBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/account/profile', Account_api.handleProfile, ALL_PERMISSIONS)
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
                                               EXEC_BOARD_PERMISSIONS);

const getUnconfirmedHoursBuilder: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/exec/getUnconfirmedHours',
                                               Exec_api.handleGetUnconfirmedHours,
                                               EXEC_BOARD_PERMISSIONS);

const checkMostRecentAgreementBuilder: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/dj/checkMostRecentAgreement',
                                               DJ_api.handleCheckMostRecentAgreement,
                                               DJ_PERMISSIONS)
    .setHttpMethod(HttpMethod.POST);

const addPendingMembersBuilder: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/exec/addPendingMembers',
                                               Exec_api.handleAddPendingMembers,
                                               EXEC_BOARD_PERMISSIONS)
    .setHttpMethod(HttpMethod.POST);

const manageUsersBuilder: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/exec/manageUsers',
                                               Exec_api.handleManageUsers,
                                               EXEC_BOARD_PERMISSIONS)

const changePermissionsBuilder: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/exec/changePermissions',
                                               Exec_api.handleChangePermissions,
                                               EXEC_BOARD_PERMISSIONS)
    .setHttpMethod(HttpMethod.POST);

const changePasswordBuilder: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/account/changePassword',
                                               Account_api.handleChangePassword,
                                               ALL_PERMISSIONS)
    .setHttpMethod(HttpMethod.POST);

const getUnconfirmedAccountBuilder: InsecureRouteBuilder =
    <InsecureRouteBuilder>new InsecureRouteBuilder('/api/account/getUnconfirmedAccount', Account_api.handleGetUnconfirmedAccount)
    .setHttpMethod(HttpMethod.POST);

const approveHours: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/exec/approveHours',
        (req, res, token) => Exec_api.handleResolveHours(req, res, token, false),
        EXEC_BOARD_PERMISSIONS).setHttpMethod(HttpMethod.POST);

const deleteHours: SecureRouteBuilder =
    <SecureRouteBuilder>new SecureRouteBuilder('/api/exec/deleteHours',
        (req, res, token) => Exec_api.handleResolveHours(req, res, token, true),
        EXEC_BOARD_PERMISSIONS).setHttpMethod(HttpMethod.POST);

const loginRoute: InsecureRoute = new InsecureRoute(loginRouteBuilder);
const registerRoute: InsecureRoute = new InsecureRoute(registerRouteBuilder);
const logHoursRoute: SecureRoute = new SecureRoute(logHoursBuilder);
const getUnconfirmedAccountsRoute: SecureRoute = new SecureRoute(getUnconfirmedAccountsBuilder);
const getUnconfirmedHoursRoute: SecureRoute = new SecureRoute(getUnconfirmedHoursBuilder);
const getVolunteerHours: SecureRouteBuilder = new SecureRouteBuilder('/api/dj/getVolunteerHours', DJ_api.handleGetVolunteerHours, DJ_PERMISSIONS);

const insecureRoutes: InsecureRoute[] = [
    registerRoute,
    loginRoute,
    new InsecureRoute(getUnconfirmedAccountBuilder),
];

const secureRoutes: SecureRoute[] = [
    logHoursRoute,
    new SecureRoute(getUnconfirmedAccountsBuilder),
    new SecureRoute(getUnconfirmedHoursBuilder),
    new SecureRoute(checkMostRecentAgreementBuilder),
    new SecureRoute(profileRouteBuilder),
    new SecureRoute(addPendingMembersBuilder),
    new SecureRoute(getVolunteerHours),
    new SecureRoute(approveHours),
    new SecureRoute(deleteHours),
    new SecureRoute(manageUsersBuilder),
    new SecureRoute(changePermissionsBuilder),
    new SecureRoute(changePasswordBuilder),
];

routeManager.addInsecureRoutes(insecureRoutes);
routeManager.addSecureRoutes(secureRoutes);

app.get('/dist/*', (_, res: express.Response) => res.status(404).send());
app.get('/api/*', (_, res: express.Response) => res.status(404).send());
app.get('/*', (_, res: express.Response) => {
    res.sendFile(path.resolve(`${clientDir}/../index.html`));
});
const port = CONFIG.getNumberConfig('PORT');
app.listen(port);
log.INFO(`Listening on port ${port}`);
