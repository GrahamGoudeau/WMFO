#!/bin/bash

if [ "$#" -ne 1 ] ; then echo "Usage: ./setup.sh [db url (use 'localhost' for dev), provide full URI otherwise]"; exit 1
fi
echo
read -p "WARNING this script will drop the entire database. Continue? [y/n] " yn
case $yn in
    [Yy]* ) ;;
    * ) echo "Exiting..."; exit 1;;
esac

echo
#if [ "$?" -eq 1 ] ; then exit 1
#fi
if [ "$1" == "localhost" ] ; then
    psql -h $1 -f initLocal.sql
else
    psql $1 -f init.sql
fi
