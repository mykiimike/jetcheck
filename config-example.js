module.exports = {
    tests: {
        myCheck: {
            // start from degraded mode
            init: "DEGRADED",

            // test every 15 seconds
            interval: 15,

            // checker tasks
            tasks: [
                { type: "ping", host: "8.8.8.8", count: 2 },
                // { type: "ping", host: "54.43.5.5" },
                { type: "http", url: "https://8.8.8.8" },
                { type: "http", url: "https://1.1.1.1" },
                { type: "http", url: "https://1.2.4.1" },
            ],

            // when system fails
            failed: [
                { type: "cmd", cmd: `logger "TEST: Disconnected from HTTP"` }
            ],

            // when system succeed
            succeed: [
                { type: "cmd", cmd: `logger "TEST: Connected from HTTP"` },
                { type: "cmd", cmd: `logger "TEST: secondary command"` }
            ],
        }
    }
}