import * as express from 'express';
import * as bodyParser from 'body-parser';
import { HttpMethod, RouteManager, InsecureRoute, InsecureRouteBuilder, SecureRoute, SecureRouteBuilder } from './utils/routeUtils';
import Logger from './utils/logger';
import * as path from 'path';
import Config from './utils/config';
import DB from './db/db';
import * as DJ from './api/dj';
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

const registerRouteBuilder: InsecureRouteBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder('/api/register', DJ.handleRegister)
    .setHttpMethod(HttpMethod.POST);

const loginRouteBuilder: InsecureRouteBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder('/api/login', DJ.handleLogin)
    .setHttpMethod(HttpMethod.POST);

const loginRoute: InsecureRoute = new InsecureRoute(loginRouteBuilder);
const registerRoute: InsecureRoute = new InsecureRoute(registerRouteBuilder);

const insecureRoutes: InsecureRoute[] = [
    registerRoute,
    loginRoute,
];

routeManager.addInsecureRoutes(insecureRoutes);
const port = CONFIG.getNumberConfig('PORT');
app.listen(port);
log.INFO(`Listening on port ${port}`);
