const axios = require('axios');
const https = require('https')
const crypto  = require('crypto')
const os  = require('os')

class JetcheckAPI {
    constructor(kernel, account) {
        this.kernel = kernel
        this.account = account;
        this.endpoint = "/api/v1"

        // Initializing Axios instance with base configuration
        this.handler = axios.create({
            baseURL: account.url, // Replace with the base URL of the API
            headers: {
                'Authorization': `${account.token}`, // Example of token-based authentication
                'User-Agent': `Jetcheck client v${this.kernel.version}`, // Add appKey in headers
            },
            timeout: account.timeout || 2000, // Default timeout of 5 seconds
            validateStatus: () => true,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }).on('keylog', (line, tlsSocket) => {
                const cert = tlsSocket.getPeerCertificate(false)
                if (!cert || !cert.fingerprint256)
                    return

                if (this.account.fingerprint !== cert.fingerprint256) {
                    console.log(`Bad fingerprint on certificate ${this.account.url} local=${this.account.fingerprint} remote=${cert.fingerprint256}`)
                    tlsSocket.destroy()
                    return
                }
            }),
        });
    }

    async get(rcs) {
        // console.log(`GET ${this.account.url}${this.endpoint}${rcs}`);
        try {
            const response = await this.handler.get(`${this.endpoint}${rcs}`);
            return { err: null, data: response.data };
        } catch (err) {
            return { err: err.message, data: null };
        }
    }

    async post(rcs, data) {
        // console.log(`POST ${this.account.url}${this.endpoint}${rcs}`);
        try {
            const response = await this.handler.post(`${this.endpoint}${rcs}`, data);
            return { err: null, data: response.data };
        } catch (err) {
            return { err: err.message, data: null };
        }
    }
}

module.exports = async function (kernel) {
    if (kernel.options.headless === true)
        return
    if (!kernel.config.client)
        return

    console.log("Loading client module")

    kernel.client = {
        list: []
    }

    kernel.client.get = async function (rcs, cb) {
        const ret = []
        for (var server of kernel.client.list) {
            const sret = await server.get(rcs)
            if (cb)
                await cb(sret)
            ret.push(sret)
        }
        return (ret)
    }

    kernel.client.post = async function (rcs, data, cb) {
        const ret = []
        for (var server of kernel.client.list) {
            const sret = await server.post(rcs, data)
            if (cb)
                await cb(sret)
            ret.push(sret)
        }
        return (ret)
    }

    function load(config) {
        console.log(`Loading Jetcheck client ${config.url}`)
        kernel.client.list.push(new JetcheckAPI(kernel, config))
    }

    if (Array.isArray(kernel.config.client)) {
        for (var config of kernel.config.client)
            load(config)
    }
    else
        load(kernel.config.client)

    // send host heartbeat
    async function hostHeartbeat() {
        const info = os.hostname()
        await kernel.client.post("/agent/heartbeat", {
            agent: os.hostname(),
            type: "jetcheck",
            version: kernel.version,
        })
        setTimeout(hostHeartbeat, 5000)
    }
    setTimeout(hostHeartbeat, 100)

    // send host state
    async function hostState() {
        const payload = []

        for(var testName in kernel.tests.states) {
            const ptr = kernel.tests.states[testName]
            payload.push({
                name: testName,
                status: ptr.status,
                mode: ptr.mode,
                startTime: ptr.startTime,
                lastTime: ptr.lastTime,
                original: ptr.original.length,
                lastSucceed: ptr.lastSucceed.length,
                lastFailed: ptr.lastFailed.length,
            })
        }

        const r = await kernel.client.post("/agent/states", {
            agent: os.hostname(),
            tests: payload
        })
        setTimeout(hostState, 1000)
    }
    setTimeout(hostState, 1500)
}
