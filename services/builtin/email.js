const NodeMailer = require("nodemailer")
const Elapsed = require("elapsed")

async function sender(options) {
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
            const options = { ...task }

            if (!task.content)
                task.content = {}

            options.content = { ...task.content }

            // manage auto subject
            if (!task.content.subject) {
                if (state.mode === "DEGRADED")
                    options.content.subject = `[RESOLVED] - ${state.name}`
                else if (state.mode === "WORKING")
                    options.content.subject = `[FAILED] - ${state.name}`
            }
            else if (typeof task.subject === 'function')
                options.content.subject = task.subject(options, state)

            // manage email content
            if (!task.content.text) {
                const deadTime = state.hasOwnProperty("deadTime") ? state.deadTime : new Date
                if (state.mode === "DEGRADED")
                    options.content.text = [
                        `Hi,`,
                        '',
                        `The test '${state.name}' has been resolved at ${new Date().toLocaleString()}`,
                            `\t- Detection time: ${deadTime.toLocaleString()}`,
                            `\t- Outage elapsed: ${(new Elapsed(deadTime)).optimal}`,
                    ].join("\n")
                else if (state.mode === "WORKING")
                    options.content.text = [
                        `Hi,`,
                        '',
                        `The test '${state.name}' fails at ${new Date().toLocaleString()}`,
                    ].join("\n")
            }
            else if (typeof task.text === 'function')
                options.content.text = task.text(options, state)

            if(!options.content.text)
                options.content.text = ""

            options.content.text = [
                options.content.text,
                "",
                "--",
                `Jetcheck v${kernel.version}`
            ].join("\n")

            await sender(options)
        }
    }
    console.log("Loading Email plugin")
}
