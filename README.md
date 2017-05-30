# WMFO

This is the overall guide to getting this codebase running locally.

Intended for developers associated with Tufts University WMFO.

For making changes to the codebase, please reference the `CONTRIBUTING.md` guide once you've followed all the steps below.

## Installation
These installation steps are written with Mac OS in mind.  Some Windows/Linux tips may be scattered throughout but are untested.  The main `setup.sh` script assumes bash is available.
1. Install [Homebrew](http://brew.sh/), a package manager for Mac OS (ignore if on Windows; if on Linux, use your standard package manager).
1. Install Node and NPM with `brew install node`. You may need to change some XCode permissions on Mac OS (you'll be prompted if that's the case) (if on Windows, install Node and NPM however you can :) )
1. Rename the file `server/.dev.env` to `server/.env`, which will set you up with the bare minimum environment config variables.
1. In the root directory of the repo, run `./setup.sh` which will try to install all the necessary dependencies and build the front end for the first time. There should be no errors.
1. Install Postgres (maybe follow [this](https://www.moncefbelyamani.com/how-to-install-postgresql-on-a-mac-with-homebrew-and-lunchy/), but we don't need steps 5 or 6), and get it running.
1. Be sure that the `DEV_DATABASE_URL` field in `server/.env` is set to the value `postgres://localhost/wmfo_db`. This should already be the case.
1. Run `cd server/db; ./setupDb.sh localhost` which will set up the database `wmfo_db` in Postgres.  BE AWARE that this will delete the `wmfo_db` database if it exists already, so be sure to *only* give an argument other than `localhost` if you REALLY know what you're doing.

## Running
1. Change into the `server/` directory with `cd server/`
1. Do `npm run dev`. If you have set everything up in the Installation section, you should be able to go to `localhost:5000` in your browser and see an example page.
