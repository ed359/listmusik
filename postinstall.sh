#!/usr/bin/env sh

# get installed version of nwjs
nwtarget=$(npm ls nw --json | ./node_modules/json/lib/json.js dependencies.nw.version)

# install dependencies
bower install
cd app
npm install

# recompile node-expat for nwjs
cd node_modules/node-expat
nw-gyp configure --target=$nwtarget
nw-gyp build