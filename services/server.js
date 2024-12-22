const fs = require('fs')
const path = require('path')

async function init(kernel) {
    if (kernel.options.headless === true)
        return
    if (!kernel.config.server)
        return

    kernel.server = {
        hosts: {}
    }

    if (!kernel.config.server.apiKeys)
        kernel.config.server.apiKeys = {}

    kernel.web.filters.isServerAPI = (req, res, next) => {
        if (!kernel.config.server.apiKeys[req.headers.authorization])
            return (res.error("Invalid credential", null, true))

        req.apiKey = {
            ...kernel.config.server.apiKeys[req.headers.authorization],
            key: req.headers.authorization
        }

        next()
    }

    async function pruneHosts() {
        const toDel = []
        for (var agent in kernel.server.hosts) {
            const data = kernel.server.hosts[agent]
            const timeout = kernel.config.server.agentTimeout ? kernel.config.server.agentTimeout * 1000 : 5000
            if (Date.now() - data.lastBeat > timeout)
                toDel.push(agent)
        }
        for (var item of toDel)
            delete kernel.server.hosts[item]
        setTimeout(pruneHosts, 1000)
    }
    setTimeout(pruneHosts, 1000)

    kernel.web.post(
        "/api/v1/agent/heartbeat",
        kernel.web.filters.isServerAPI,
        kernel.web.filters.jsonParser,
        async (req, res) => {
            if (!kernel.server.hosts[req.body.agent])
                kernel.server.hosts[req.body.agent] = {}
            const host = kernel.server.hosts[req.body.agent]
            host.agent = req.body.agent
            host.type = req.body.type
            host.version = req.body.version
            host.lastBeat = Date.now()
            res.success({})
        })

    kernel.web.post(
        "/api/v1/agent/states",
        kernel.web.filters.isServerAPI,
        kernel.web.filters.jsonParser,
        async (req, res) => {
            if (!kernel.server.hosts[req.body.agent])
                kernel.server.hosts[req.body.agent] = {}
            const host = kernel.server.hosts[req.body.agent]
            host.agent = req.body.agent
            host.lastBeat = Date.now()
            host.tests = []

            if (Array.isArray(req.body.tests))
                for (var test of req.body.tests)
                    host.tests.push({
                        name: test.name,
                        status: test.status,
                        mode: test.mode,
                        startTime: test.startTime,
                        lastTime: test.lastTime,
                        original: test.original,
                        lastSucceed: test.lastSucceed,
                        lastFailed: test.lastFailed,
                    })
            res.success({})
        })

}

module.exports = init;