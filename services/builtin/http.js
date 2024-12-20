const axios = require('axios');

module.exports = async function (kernel) {
    kernel.tests.plugins.http = {
        toString: function (options) {
            return (`http(${options.url})`)
        },
        run: async function (options, task, state) {
            async function check(url) {
                try {
                    await axios.get(url, {
                        timeout: options.timeout ? options.timeout : 5000,
                        validateStatus: () => true,
                    });
                    return null;
                } catch (error) {
                    return error.message;
                }
            }
            return (await check(options.url))

        }
    }
    console.log("Loading HTTP plugin")
}
