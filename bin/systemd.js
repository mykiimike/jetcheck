

const fs = require('fs')
const path = require("path")
const ejs = require("ejs")

module.exports = (jetcheck, sc, configFile) => {

    const systemd = sc.command('systemd', {
        desc: 'Linux systemd service management'
    })

    systemd.command('install', {
        desc: 'Run the monitoring',
        callback: async function (options) {
            var installed = false
            try {
                fs.statSync("/etc/systemd/system/jetcheck.service")
                installed = true
            } catch (e) { }

            if (installed === true) {
                console.log("Netcheck is already installed")
                process.exit(-1)
            }

            const kernel = new jetcheck({ configFile })

            const runCmd = `${process.argv[0]} ${process.argv[1]} run`
            const content = fs.readFileSync(__dirname + "/systemd.conf").toString()
            const render = ejs.render(content, { configFile, runCmd, cwd: process.cwd(), config: `CONFIG=${configFile}` })
            fs.writeFileSync("/etc/systemd/system/jetcheck.service", render)

            await kernel.lib.exec("systemctl daemon-reload", false)
            await kernel.lib.exec("systemctl enable jetcheck", false)
            console.log("To start type: systemctl start jetcheck")
        }
    })

    systemd.command('deinstall', {
        desc: 'Run the monitoring',
        callback: async function (options) {
            var installed = false
            try {
                fs.statSync("/etc/systemd/system/jetcheck.service")
                installed = true
            } catch (e) { }

            if (installed === false) {
                console.log("Netcheck is not installed")
                process.exit(-1)
            }
            const kernel = new jetcheck({ configFile })

            await kernel.lib.exec("systemctl stop jetcheck", false)
            await kernel.lib.exec("systemctl disable jetcheck", false)
            fs.unlinkSync("/etc/systemd/system/jetcheck.service")
            await kernel.lib.exec("systemctl daemon-reload", false)
            console.log("Netcheck deinstalled")
        }
    })
}

