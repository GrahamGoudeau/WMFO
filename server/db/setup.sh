#!/bin/bash

psql -h $1 -f init.sql
