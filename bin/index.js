#!/usr/bin/env node

const path = require("path")
const sc = require('subcommander');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const jetcheck = require("../index")

// Early loading configuration file
const configFile = path.resolve(
    process.cwd(),
    process.env.CONFIG || `${os.homedir()}/.jetcheck/config.js`
)
require("./systemd")(jetcheck, sc, configFile)
require("./run")(jetcheck, sc, configFile)

sc.parse()


