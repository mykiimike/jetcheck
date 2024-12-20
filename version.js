const fs = require("fs")
const util = require('util')
const semver = require('semver');
const exec = util.promisify(require('child_process').exec)

const gitRepo = "./"

const isoDate = new Date().toISOString().slice(0, 10);

async function safeExec(cmd, ignore) {
    console.log(cmd)
    try {
        const ret = await exec(cmd)
        if (ret.stderr.length > 0) return ({ error: ret.stderr.split("\n")[0] })
        if (ret.stdout.length === 0) return ({})
        return ({ data: JSON.parse(ret.stdout) })
    } catch (e) {
        if (ignore !== true) return ({ error: e.message })
        return ({})
    }
}

(async () => {
    const packageData = require(gitRepo + '/package.json');
    packageData.version = semver.inc(packageData.version, 'patch');
    fs.writeFileSync(gitRepo + '/package.json', JSON.stringify(packageData, null, " "));

    await safeExec(`cd ${gitRepo} && git commit -m "Release ${packageData.version}" -a`)

    await safeExec(`cd ${gitRepo} && git push`)
    await safeExec(`cd ${gitRepo} && git tag ${packageData.version}`)
    await safeExec(`cd ${gitRepo} && git push --tags`)
    await safeExec(`cd ${gitRepo} && npm publish`)
})();