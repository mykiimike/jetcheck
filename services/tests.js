const path = require("path")

module.exports = async function (kernel) {
    kernel.tests = {
        plugins: {},
        states: {}
    }

    // tester
    kernel.config.modules.push(__dirname + "/builtin/http.js")
    kernel.config.modules.push(__dirname + "/builtin/ping.js")
    kernel.config.modules.push(__dirname + "/builtin/jetcheck.js")

    // triggers
    kernel.config.modules.push(__dirname + "/builtin/cmd.js")
    kernel.config.modules.push(__dirname + "/builtin/ovh.js")

    kernel.events.on("kernel.init", async function () {
        if (kernel.options.headless === true)
            return

        // prepare initial states
        for (var testName in kernel.config.tests) {
            const test = kernel.config.tests[testName]

            if (!test.interval)
                test.interval = 5
            test.interval = test.interval * 1000

            kernel.tests.states[testName] = {
                name: testName,
                status: "INIT",
                mode: "INIT",
                startTime: Date.now(),
                lastTime: 0,
                original: [],
                lastSucceed: [],
                lastFailed: [],
                succeed: [],
                failed: []
            }
            const state = kernel.tests.states[testName]

            if (test.init?.toLowerCase() === "working")
                state.mode = "WORKING"
            else if (test.init?.toLowerCase() === "degraded")
                state.mode = "DEGRADED"
            else
                state.mode = "WORKING"

            // prepare test pipelines
            for (var task of test.tasks) {
                if (!kernel.tests.plugins[task.type]) {
                    console.log(`Test plugin not found "${task.type}"`)
                    continue
                }
                if (!kernel.tests.plugins[task.type].run) {
                    console.log(`Plugin "${task.type}" cannot run test`)
                    continue
                }
                state.original.push(task)
            }

            console.log(`Test "${testName}" loaded`)

        }

        async function check() {
            for (let testName in kernel.config.tests) {
                const test = kernel.config.tests[testName]
                const state = kernel.tests.states[testName]

                console.log(`name=${testName} status=${state.status} mode=${state.mode} elapsed=${test.interval - (Date.now() - state.startTime)}ms succeed=${state.lastSucceed.length} failed=${state.lastFailed.length}`)

                if (state.status === "RUNNING")
                    continue;

                if (Date.now() - state.lastTime < test.interval)
                    continue;

                state.startTime = Date.now()
                state.status = "RUNNING"
                state.current = [...state.original]
                state.lastSucceed = state.succeed
                state.lastFailed = state.failed
                state.succeed = []
                state.failed = []

                async function pop() {
                    const task = state.current.pop()
                    if (!task) {
                        if(state.succeed.length === 0 && state.failed.length === 0) {
                            // do nothing
                        }
                        else if (state.succeed.length === 0) {
                            if (state.mode === "WORKING") {
                                console.log(`System "${testName}" is degraded`)
                                if (test.failed) {
                                    for (var item of test.failed) {
                                        const module = kernel.tests.plugins[item.type]
                                        if (module && module.trigger)
                                            await module.trigger(item, state)
                                    }
                                }
                            }
                            state.mode = "DEGRADED"
                        }
                        else {
                            if (state.mode === "DEGRADED") {
                                console.log(`System ${testName} is restored`)
                                if (test.succeed) {
                                    for (var item of test.succeed) {
                                        const module = kernel.tests.plugins[item.type]
                                        if (module && module.trigger)
                                            await module.trigger(item, state)
                                    }
                                }
                            }
                            state.mode = "WORKING"
                        }

                        state.lastSucceed = state.succeed
                        state.lastFailed = state.failed

                        state.startTime = Date.now()
                        state.lastTime = Date.now()
                        state.status = "PENDING"
                        return
                    }

                    const module = kernel.tests.plugins[task.type]
                    // console.log(`Executing ${testName} > ${module.toString(task)}`)
                    try {
                        const error = await module.run(task, test, state)
                        if (!error)
                            state.succeed.push(task)
                        else
                            state.failed.push({ ...task, error })
                    } catch(e) {
                        console.log(`Test "${testName}" failed: ${e.message}`)
                    }


                    setTimeout(pop, 10)
                }
                setTimeout(pop, 10)
            }
            setTimeout(check, 1000)
        }
        check()
    })
}
