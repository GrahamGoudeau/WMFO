#!/bin/bash

heroku logs | sed -E -n 's|^.*app\[.*: (.*)$|\1|p'
