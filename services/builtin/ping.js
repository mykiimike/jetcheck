const axios = require('axios');

module.exports = async function (kernel) {
    kernel.tests.plugins.ping = {
        toString: function (options) {
            return (`ping(${options.host})`)
        },
        run: async function (options, task, state) {
            const count = options.count ? options.count : 5
            const ret = await kernel.lib.exec(`ping -c ${count} ${options.host}`)
            if(ret.error > 0)
                return("Host down")
            return(null)
        }
    }
    console.log("Loading PING plugin")
}
