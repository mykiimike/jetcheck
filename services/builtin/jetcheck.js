



module.exports = async function (kernel) {
    kernel.tests.jetcheck = {
        ctrls: {}
    }

    // kernel.tests.plugins['jetcheck.send'] = {
    //     toString: function (options) {
    //         return (`jetcheck.send(${options.url})`)
    //     },
    //     trigger: async function (task, state) {
    //         if (!kernel.tests.jetcheck.ctrls[task.account.appKey])
    //             kernel.tests.jetcheck.ctrls[task.account.appKey] = new asyncJetcheckAPI(task.account)

    //         const ctrl = kernel.tests.jetcheck.ctrls[task.account.appKey]


    //     }
    // }

    kernel.tests.plugins['jetcheck.verify'] = {
        toString: function (options) {
            return (`jetcheck.verify(${options.test})`)
        },
        run: async function (options, task, state) {

            if (!kernel.server.hosts)
                throw Error("No host connected yet")

            const found = []
            for (var agentName in kernel.server.hosts) {
                const agent = kernel.server.hosts[agentName]
                for (var test of agent.tests) {
                    if (test.name === options.test)
                        found.push({ agent: agentName, ...test })
                }
            }

            if (found.length === 0)
                throw Error(`No test found under ${options.test}`)

            if (found.length === 0)
                throw Error(`No task found in test "${options.test}" from agent "${found.agent}"`)

            const balance = {
                s: 0,
                f: 0
            }
            for (var test of found) {
                balance.s += test.lastSucceed
                balance.f += test.lastFailed
            }
     
            if(balance.s === 0 && balance.f > 0)
                return(`test failed s=0 and f>0`)
            
            return(null)
        }
    }

    console.log("Loading Jetcheck plugin")
}
