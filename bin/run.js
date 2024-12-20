

const fs = require('fs')
const path = require("path")

module.exports = (jetcheck, sc, configFile) => {
    sc.command('run', {
        desc: 'Run the check',
        callback: async function (options) {
            const kernel = new jetcheck({ configFile })
            await kernel.start()
        }
    })
}


