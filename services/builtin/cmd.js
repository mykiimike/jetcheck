const axios = require('axios')

module.exports = async function (kernel) {
    kernel.tests.plugins.cmd = {
        toString: function (options) {
            return (`cmd(${options.cmd})`)
        },
        trigger: async function (task, state) {
            await kernel.lib.exec(task.cmd)
        }
    }
    console.log("Loading CMD plugin")
}
