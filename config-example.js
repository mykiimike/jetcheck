const OVH_test = {
    name: "Access",
    description: "Update for HA",
    endpoint: 'ovh-eu',
    appKey: "XXXX",
    appSecret: "XXXX",
    consumerKey: "XXXX"
}

const OVH_test_DNS = {
    subDomain: "jetcheck",
    fieldType: "A",
    target: "9.9.9.9",
    ttl: 0
}

const OVH_test_TEST = {
    subDomain: "jetcheck",
    fieldType: "A",
    target: "1.1.1.1",
    ttl: 0
}

// seo nodemailer' configuration https://www.nodemailer.com/smtp/
const emailDestination = {
    host: "my.smtp.server",
    port: 25,
    secure: false,
}

module.exports = {
    tests: {
        myCheck: {
            // start from degraded mode
            // init: "DEGRADED",

            // test every 15 seconds
            interval: 15,

            // checker tasks
            tasks: [
                // { type: "ping", host: "8.8.8.8", count: 2 },
                { type: "ping", host: "54.43.5.5" },
                // { type: "http", url: "https://8.8.8.8" },
                // { type: "http", url: "https://1.1.1.1" },
                // { type: "http", url: "https://1.2.4.1" },
            ],

            // when system fails
            failed: [
                {
                    type: "email",
                    transporter: emailDestination,
                    content: {
                        from: "alert@tc.none.com",
                        to: "noreply@nothing.com",
                        subject: "[FAILED] Dev test",
                        text: `Hi, the 'Dev test' fails at ${new Date().toLocaleString()}`
                    }
                },

                {
                    type: "ovh.dns.zone.unset",
                    account: OVH_test,
                    zone: "none.com",
                    config: OVH_test_DNS
                },

                { type: "cmd", cmd: `logger "TEST: Disconnected from HTTP"` }
            ],

            // when system succeed
            succeed: [
                {
                    type: "ovh.dns.zone.set",
                    account: OVH_test,
                    zone: "none.com",
                    config: OVH_test_DNS
                },
                { type: "cmd", cmd: `logger "TEST: Connected from HTTP"` },
                { type: "cmd", cmd: `logger "TEST: secondary command"` }
            ],
        }
    }
}