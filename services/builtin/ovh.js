const axios = require('axios')
const ovh = require('ovh')


class asyncOVH {
    constructor(account) {
        this.account = account
        this.handler = ovh(account)
    }

    async get(rcs) {
        console.log(`OVH-${this.account.appKey}: GET ${rcs}`)
        return (new Promise((accept) => {
            this.handler.request('GET', rcs, function (err, data) {
                accept({ err, data })
            })
        }))
    }

    async post(rcs, data) {
        console.log(`OVH-${this.account.appKey}: POST ${rcs}`)
        return (new Promise((accept) => {
            this.handler.request('POST', rcs, data, function (err, data) {
                accept({ err, data })
            })
        }))
    }

    async del(rcs) {
        console.log(`OVH-${this.account.appKey}: DELETE ${rcs}`)
        return (new Promise((accept) => {
            this.handler.request('DELETE', rcs, function (err, data) {
                accept({ err, data })
            })
        }))
    }
}

module.exports = async function (kernel) {
    kernel.tests.ovh = {
        ctrls: {}
    }

    kernel.tests.plugins['ovh.dns.zone.set'] = {
        toString: function (options) {
            return (`ovh.dns.zone.set(${options.host})`)
        },
        trigger: async function (task, state) {
            if (!kernel.tests.ovh.ctrls[task.account.appKey])
                kernel.tests.ovh.ctrls[task.account.appKey] = new asyncOVH(task.account)

            const ctrl = kernel.tests.ovh.ctrls[task.account.appKey]

            var found = null
            const list = await ctrl.get(`/domain/zone/${task.zone}/record?subDomain=${task.config.subDomain || ""}`)
            for (var item of list.data) {
                const info = await ctrl.get(`/domain/zone/be-ys.io/record/${item}`)

                if(task.config.subDomain && info.data.subDomain !== task.config.subDomain)
                    continue
                if(task.config.fieldType && info.data.fieldType !== task.config.fieldType)
                    continue
                if(task.config.target && info.data.target !== task.config.target)
                    continue
                found = info
                break
            }

            if(!found) {
                console.log(`[${state.name}] OVH DNS Entry "${task.config.subDomain}" set in zone "${task.zone}"`)
                await ctrl.post(`/domain/zone/be-ys.io/record`, task.config)
                await ctrl.post(`/domain/zone/${task.zone}/refresh`)
            }
        }
    }

    kernel.tests.plugins['ovh.dns.zone.unset'] = {
        toString: function (options) {
            return (`ovh.dns.zone.unset(${options.host})`)
        },
        trigger: async function (task, state) {
            if (!kernel.tests.ovh.ctrls[task.account.appKey])
                kernel.tests.ovh.ctrls[task.account.appKey] = new asyncOVH(task.account)

            const ctrl = kernel.tests.ovh.ctrls[task.account.appKey]

            var found = null
            const list = await ctrl.get(`/domain/zone/${task.zone}/record`)
            for (var item of list.data) {
                const info = await ctrl.get(`/domain/zone/${task.zone}/record/${item}`)

                if(task.config.subDomain && info.data.subDomain !== task.config.subDomain)
                    continue
                if(task.config.fieldType && info.data.fieldType !== task.config.fieldType)
                    continue
                if(task.config.target && info.data.target !== task.config.target)
                    continue
                found = info.data
                break
            }

            if(found) {
                console.log(`[${state.name}] OVH DNS Entry "${task.config.subDomain}" unset from zone "${task.zone}"`)
                console.log(`/domain/zone/${task.zone}/record/${found.id}`)
                await ctrl.del(`/domain/zone/${task.zone}/record/${found.id}`)
                await ctrl.post(`/domain/zone/${task.zone}/refresh`)
            }
        }
    }

    console.log("Loading PING plugin")
}
