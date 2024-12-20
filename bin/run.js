

const fs = require('fs')
const path = require("path")

module.exports = (netcheck, sc, configFile) => {
    sc.command('run', {
        desc: 'Run the monitoring',
        callback: async function (options) {
            const kernel = new netcheck({ configFile })
            await kernel.start()
        }
    })

    sc.command('test', {
        desc: 'Run the monitoring',
        callback: async function (options) {
            const kernel = new netcheck({ headless: true, configFile })
            await kernel.start()
        }

    })
}


