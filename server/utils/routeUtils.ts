import * as express from 'express';
import * as security from './security';
import { Maybe } from './maybe';
import { unauthorizedError, AuthToken, PermissionLevel } from './requestUtils';

type InsecureContinuation = (req: express.Request,
                             res: express.Response) => void;

type SecureContinuation = (req: express.Request,
                           res: express.Response,
                           authToken: AuthToken) => void;

export enum HttpMethod {
    GET,
    POST,
    DELETE,
};

export class RouteManager {
    constructor(private readonly app: express.Express, private readonly loginRoute: string) {
    }

    public addSecureRoutes(routes: SecureRoute[]): void {
        routes.forEach(route => this.addSecureRoute(route));
    }

    public addInsecureRoutes(routes: InsecureRoute[]): void {
        routes.forEach(route => this.addInsecureRoute(route));
    }

    private determineMethod(method: HttpMethod): (string: string, expressContinuation: any) => void {
        switch (method) {
            case HttpMethod.GET: {
                return this.app.get.bind(this.app);
            }
            case HttpMethod.POST: {
                return this.app.post.bind(this.app);
            }
            case HttpMethod.DELETE: {
                return this.app.delete.bind(this.app);
            }
            default: {
                throw new Error('misconfigured route');
            }
        }
    }

    public addInsecureRoute(route: InsecureRoute): void {
        let method: (string: any, ExpressContinuation: any) => void = this.determineMethod(route.httpMethod);
        method(route.route, route.cont);
    }

    public addSecureRoute(route: SecureRoute): void {
        let method: (string: any, ExpressContinuation: any) => void = this.determineMethod(route.httpMethod);

        method(route.route, (req: any, res: any) => {
            const cookie: string = req.headers['cookie'];
            const authTokenResult: Maybe<AuthToken> = security.parseCookie(cookie);
            const unauthorizedCont = () => {
                if (!route.isAjax) {
                    res.redirect(this.loginRoute);
                } else {
                    unauthorizedError(res);
                }
            };

            authTokenResult.caseOf({
                just: async (token: AuthToken) => {
                    if (!security.validateAuthToken(token) || token.permissionLevel !== route.permissionLevel) {
                        unauthorizedCont();
                    } else {
                        route.cont(req, res, token);
                    }
                },
                nothing: async () => {
                    unauthorizedCont();
                }
            });
        });
    }
};

class RouteBuilder {
    public httpMethod?: HttpMethod;
    public isAjax?: boolean;

    constructor(readonly route: string) {}

    setHttpMethod<T extends RouteBuilder>(method: HttpMethod): T {
        this.httpMethod = method;
        return <T><any>this;
    }

    setIsAjax<T extends RouteBuilder>(isAjax: boolean): T {
        this.isAjax = isAjax;
        return <T><any>this;
    }
};

export class InsecureRouteBuilder extends RouteBuilder {
    constructor(readonly route: string, readonly cont: InsecureContinuation) {
        super(route);
    }
}

export class SecureRouteBuilder extends RouteBuilder {
    constructor(readonly route: string, readonly cont: SecureContinuation, readonly permissionLevel: PermissionLevel) {
        super(route);
    }
}

class Route {
    constructor(readonly route: string,
                readonly httpMethod?: HttpMethod,
                readonly isAjax?: boolean) {
        if (!httpMethod) {
            this.httpMethod = HttpMethod.GET;
        }

        if (!isAjax) {
            this.isAjax = false;
        }
    }
};

export class InsecureRoute extends Route {
    readonly cont: InsecureContinuation;
    constructor(builder: InsecureRouteBuilder) {
        super(builder.route, builder.httpMethod, builder.isAjax);
        this.cont = builder.cont;
    }
}

export class SecureRoute extends Route {
    readonly cont: SecureContinuation;
    readonly permissionLevel: PermissionLevel;
    constructor(builder: SecureRouteBuilder) {
        super(builder.route, builder.httpMethod, builder.isAjax);
        this.cont = builder.cont;
        this.permissionLevel = builder.permissionLevel;
    }
}
