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

// load early modules
try {
    const config = require(configFile)
    if (Array.isArray(config.modules)) {
        for (var module of config.modules) {
            try {
                const file = `${module}/bin/index.js`
                const st = fs.statSync(file)
                if (st.isFile()) {
                    // console.log(`Loading bin file from ${file}`)
                    require(file)(jetcheck, sc, configFile)
                }
            } catch (e) { }
        }
    }
} catch (e) { }


sc.command('version', {
    desc: 'Get Jetcheck versions',
    callback: async function (options) {
        const kernel = new jetcheck({})
        console.log(`Jetcheck v${kernel.version}\n`)
        console.log(`Program under GPL-3.0 license`)
        console.log(`(c) ${new Date().getFullYear()} Michael VERGOZ`)
        console.log(`And other components:`)
        console.log(Object.keys(kernel.packages).map((key) => {
            return (`   - ${key}=${kernel.packages[key]}`)
        }).join("\n"))
    }
})

require("./systemd")(jetcheck, sc, configFile)
require("./run")(jetcheck, sc, configFile)

sc.parse()


