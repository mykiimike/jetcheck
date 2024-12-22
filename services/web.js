const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const https = require('https')

const express = require('express')
const bodyParser = require('body-parser')

function getCertificateFingerprint(certString) {
    const baseString = certString.match(/-----BEGIN CERTIFICATE-----\s*([\s\S]+?)\s*-----END CERTIFICATE-----/i);
    const rawCert = Buffer.from(baseString[1], "base64");
    const sha256sum = crypto.createHash("sha256").update(rawCert).digest("hex");
    return sha256sum.toUpperCase().replace(/(.{2})(?!$)/g, "$1:");
}

async function init(kernel) {
    // load express application
    kernel.web = express()

    kernel.web.filters = {
        jsonParser: bodyParser.json({ limit: '10mb' }),
        postURLParser: bodyParser.urlencoded({ limit: '10mb', extended: true }),
    }

    // log all calls
    kernel.web.use((req, res, next) => {
        // console.log(`${req.method} ${req.url} ${req.socket.remoteAddress}`, ['web'])
        next()
    })

    // Control CORS
    kernel.web.use((req, res, next) => {
        res.success = (data) => {
            res.json({ error: null, data })
        }

        res.error = (error, fields, login) => {
            res.json({ error, fields, login })
        }

        res.setHeader("Access-Control-Allow-Headers", 'Content-Type, Content-Length, Authorization')
        res.setHeader("Access-Control-Allow-Methods", 'GET, POST')
        res.setHeader("Access-Control-Allow-Origin", '*')
        next()
    })

    kernel.web.get(
        "/api/v1/version",
        async (req, res) => {
            res.success({
                software: kernel.version
            })
        })

    if (kernel.options.headless !== true) {
        if (!kernel.config.server)
            return

        console.log("Loading Web service")
        const port = kernel.config?.server?.port || 7039

        const keyFile = `${kernel.config.dataDir}/server.key`
        const ctrFile = `${kernel.config.dataDir}/server.crt`
        const csrFile = `${kernel.config.dataDir}/server.csr`
        var autoCreate = false

        try {
            fs.statSync(keyFile)
        } catch (e) { autoCreate = true }
        try {
            fs.statSync(ctrFile)
        } catch (e) { autoCreate = true }

        if (autoCreate === true) {
            console.log("Building server Self-Signed")
            console.log(`Generating 4k RSA Key in ${keyFile}`)
            await kernel.lib.exec(
                `openssl genrsa -out ./server.key 4096`,
                false, kernel.config.dataDir)
            console.log(`Building CSR in ${csrFile}`)
            await kernel.lib.exec(
                `openssl req -new -key ./server.key -out ./server.csr -subj /C=CH/ST=Valais/L=Sion/O=Jetcheck/CN=autogen`,
                false, kernel.config.dataDir
            )
            console.log(`Self Signing ${ctrFile}`)
            await kernel.lib.exec(
                `openssl x509 -req -days 365 -in ./server.csr -signkey ./server.key -out ./server.crt`,
                false, kernel.config.dataDir
            )
        }

        console.log("Loading server certificate")
        const privateKey = fs.readFileSync(keyFile).toString();
        const certificate = fs.readFileSync(ctrFile).toString();

        const fingerprint = getCertificateFingerprint(certificate)

        kernel.web.server = https.createServer({
            key: privateKey,
            cert: certificate
        }, kernel.web);

        kernel.web.server.listen(port, () => {
            console.log(`Web server binded on port ${port}`)
            console.log(`Server fingerprint is ${fingerprint}`)
        })
    }
}

module.exports = init;