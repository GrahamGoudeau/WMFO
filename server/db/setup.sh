#!/bin/bash

if [ "$#" -ne 1 ] ; then echo "Usage: ./setup.sh [db url (use 'localhost' for dev)]"; exit 1
fi
read -p "WARNING this script will drop the entire database. Continue? [y/n] " yn
case $yn in
    [Yy]* ) ;;
    * ) echo "Exiting..."; exit 1;;
esac
echo
echo "Creating psql user 'wmfo_webmaster'"
echo
createuser wmfo_webmaster -d -P
if [ "$?" -eq 1 ] ; then exit 1
fi
createdb wmfo_webmaster
psql -h $1 -f init.sql
