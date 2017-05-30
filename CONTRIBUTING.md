# How to contribute

## Table of Contents
1. [Overall Style Guidelines](#guidelines)
1. [Back End](#backend)
1. [Front End](#frontend)
1. [Deployment](#deployment)

<a name="guidelines"></a>
### Overall Style Guidelines

1. Before submitting a PR, always make sure that your branch builds successfully on both the back end and the front end.
1. There should be no hanging whitespace at the end of your lines.
1. Spaces instead of tabs
1. In 99% of cases, do not commit `.js` files. These are often produced by the compiler.

<a name="backend"></a>
### Back End

The back end is written in [TypeScript](https://www.typescriptlang.org/) running on Node.js.  TypeScript was chosen because it provides a static type system on top of JS, reducing some of the pain points of the language.

TypeScript is compiled; its compiler can be run just with `tsc` if you have the compiler installed globally (with `npm install -g typescript`), or with `npm run tsc` if you don't (the latter is preferred since the latter will always use the right version of the compiler).  You can also run `npm run tsc:watch` to have the compiler watch for edits made to files and re-run automatically.

#### Request flow
When the back end receives a request, one of three things happens, depending on the endpoint the request was sent to.  If the request was sent to:
1. An endpoint that begins with `/api/`: (an AJAX request from the front end)
    * one of the request handlers defined in `server/index.ts` will handle the request
    * all API requests go through the `routeManager` object (defined in `server/utils/routeManager.ts`, which ensures that the request sender has signed in AND has the correct permissions
1. An endpoint that begins with `/dist/`:
    * the server will attempt to serve a static file (like CSS or a JS source) from `client/dist/`
1. Any other endpoint:
    * the server will respond by serving the file `client/index.html`
    * (all page-routing is done on the front end)

Implementations of the AJAX request handlers can be found in `server/api/` in the appropriate files.

#### Database Management
A description of the tables that Postgres is aware of can be found in [`server/db/tables.sql`](https://github.com/GrahamGoudeau/WMFO/blob/master/server/db/tables.sql).

The library used to handle database interactions is `pg-promise`.  Its complete documentaiton can be found [here](http://vitaly-t.github.io/pg-promise/index.html) and nice examples can be found [here](https://github.com/vitaly-t/pg-promise#about).

For an explanation of the `ColumnSet`s used in the `db` class, check out [this](https://stackoverflow.com/questions/37300997/multi-row-insert-with-pg-promise) great StackOverflow answer by the author of `pg-promise`.

<a name="frontend"></a>
### Front End

The front end is written in [React](https://facebook.github.io/react/) in TypeScript.  Using React simplified the state management necessary in the app, and using it with TypeScript helped ensure that some bugs were caught at compile time.

Since the front end is also in TypeScript, it must be compiled too.  That can be done with `npm run webpack` or `npm run webpack:watch`; the latter will automatically rebuild the front end when you update a tracked file (like a `.tsx` file).  Webpack is a tool that compiles the TypeScript into JavaScript and bundles all the `.js` files that are produced into a single file called `bundle.js` that is served to the front end.  Webpack config settings can be found in [`client/webpack.config.js`](https://github.com/GrahamGoudeau/WMFO/blob/master/client/webpack.config.js).

Several pieces of functionality used in the React code are defined in parent classes of the components.  For example, many components used in the app extend the [`client/src/components/Component.tsx`](https://github.com/GrahamGoudeau/WMFO/blob/master/client/src/components/Component.tsx) class, which means that they have all the functionality defined in that file as well as their own.

#### Client-Side Routing
Page transfers are handled with `react-router`, a library that is interacted with in [`client/src/index.tsx`](https://github.com/GrahamGoudeau/WMFO/blob/master/client/src/index.tsx).

Instead of using `<a>` tags for links *within* the site, use elements that look like `<Link to="..."></Link>`. Examples of these can be found throughout the front end code.  Using these for internal page transfers avoids having to do another page reload, and instead will just dynamically update the DOM.

#### Authorization (sign-in) State
The user's sign-in state is tracked in the `AuthState` class in [`client/src/ts/authState.ts`](https://github.com/GrahamGoudeau/WMFO/blob/master/client/src/ts/authState.ts).

This `AuthState` class, only one instance of which exists at any point in time, manages the process of checking with the server to see if the user has credentials and whether they are still valid.

#### AJAX Requests
AJAX requests should be made through the `WMFORequest` class in [`client/src/ts/request.ts`](https://github.com/GrahamGoudeau/WMFO/blob/master/client/src/ts/request.ts).  This class tracks the user's credentials and automatically attaches them to every request as the value of the `x-wmfo-auth` header.

<a name="deployment"></a>
### Deployment
The live site is deployed on Heroku.  

An instance of Heroku's Postgres add-on provides the production database.  The app will automatically connect to the production database instead of a dev database when in the production environment (when it sees `PRODUCTION=true` in the `.env` config file).  Any changes to the production database schema must be done *carefully*.
