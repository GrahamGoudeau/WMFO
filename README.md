# WMFO

## Installation
1. Install [Homebrew](http://brew.sh/), a package manager for Mac OS
1. Install Node and NPM with `brew install node`. You may need to change some XCode permissions (you'll be prompted if that's the case)
1. Do something equivalent to `mv server/.dev.env server/.env`, which will set you up with the bare minimum config variables.
1. In the root directory of the repo, run `./setup.sh` which will try to install all the necessary dependencies and build the front end for the first time. There should be no errors.
1. You should install Postgres (maybe follow [this](https://www.moncefbelyamani.com/how-to-install-postgresql-on-a-mac-with-homebrew-and-lunchy/), but we don't need steps 5 or 6), and get it running.  Make sure that `localhost` is specified as the `DATABASE_URL` in the config file.
1. Run `cd server/db; ./setupDb.sh` which will set up the database `wmfo_db` in Postgres.  BE AWARE that this will delete the `wmfo_db` database if it exists already, so be sure to *only* specify the db url as `localhost` unless you really know what you are doing.

## Running
1. Change into the `server/` directory with `cd server/`
1. Do `npm run dev`. If you have set everything up in the Installation section, you should be able to go to `localhost:5000` in your browser and see an example page.
