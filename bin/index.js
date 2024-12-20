#!/usr/bin/env node

const path = require("path")
const sc = require('subcommander');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const netcheck = require("../index")

// Early loading configuration file
const configFile = path.resolve(
    process.cwd(),
    process.env.CONFIG || `${os.homedir()}/.netcheck/config.js`
)
require("./systemd")(netcheck, sc, configFile)
require("./run")(netcheck, sc, configFile)

sc.parse()


