const NodeMailer = require("nodemailer")

async function sender(options) {
    console.log(options)
    const ret = {}
    try {
        const transporter = NodeMailer.createTransport(options.transporter);
        await transporter.sendMail(options.content);
        ret.status = "sent"
    } catch (err) {
        ret.status = "error"
        ret.error = err.response || err.message
    }

    console.log(`Sending to=${options.content.to} title=${options.content.subject} status=${ret.status} error=${ret.error}`)
}

module.exports = async function (kernel) {
    kernel.tests.plugins.email = {
        toString: function (options) {
            return (`email(${options.content?.to})`)
        },
        trigger: async function (task, state) {
            await sender(task)
        }
    }
    console.log("Loading Email plugin")
}
