const path = require("path")

// internal requires
const pack = require("./package.json")
const aevent = require("./lib/aevent")

class jetcheck {
    constructor(options) {
        this.options = options || {}
        this.events = new aevent()
        this.lib = require("./lib")
        this.version = pack.version
        this.packages = {}

        this.packageInfo(pack)
    }

    packageInfo(pkg) {
        for (var key in pkg.dependencies)
            this.packages[key] = pkg.dependencies[key]
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async start(overwrite) {
        

        // load configuration
        if (this.options.configFile) {
            this.configFile = path.resolve(process.cwd(), this.options.configFile);
            try {
                this.config = require(this.configFile)
            } catch (e) {
                console.log(`Can not read configuration ${this.configFile}`)
                process.exit(-1)
            }
        }
        else
            this.config = {}

        // overwrite feature
        if (overwrite)
            this.config = { ...this.config, ...overwrite }

        if (!Array.isArray(this.config.modules))
            this.config.modules = []

        // load basic services
        await (require("./services/tests"))(this)

        // load modules
        if (this.config.modules) {
            for (var module of this.config.modules) {
                await require(module)(this)
            }
        }

        await this.events.emit("kernel.init", this)
    }
}

module.exports = jetcheck


