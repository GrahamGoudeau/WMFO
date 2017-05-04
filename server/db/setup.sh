#!/bin/bash

if [ "$#" -ne 1 ] ; then echo "Usage: ./setup.sh [db url (use 'localhost' for dev)]"; exit 1
fi
echo
read -p "WARNING this script will drop the entire database. Continue? [y/n] " yn
case $yn in
    [Yy]* ) ;;
    * ) echo "Exiting..."; exit 1;;
esac

read -p "Create wmfo_webmaster user? [y/n/drop] " yn
case $yn in
    [Yy]* ) echo "Creating user..."; createuser wmfo_webmaster -d -P; createdb wmfo_webmaster;;
    drop ) dropdb wmfo_webmaster; dropdb wmfo_db; dropuser wmfo_webmaster; exit 0 ;;
    * ) ;;
esac
if [ "$?" -ne 0 ] ; then exit 1;
fi
echo
#if [ "$?" -eq 1 ] ; then exit 1
#fi
psql -h $1 -f init.sql
