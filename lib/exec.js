const { spawn } = require('child_process');

async function detachedExec(cmd, detached = true, cwd) {
    // console.log("CMD: "+cmd)
    return new Promise((resolve) => {
        // Split the command into the executable and its arguments
        const [command, ...args] = cmd.split(' ')

        // Launch the detached process
        const child = spawn(command, args, {
            cwd,
            detached, // Detach the child process from the parent
            stdio: ['pipe', 'pipe', 'pipe'], // Ignore stdin and stderr, capture stdout
        })

        let stdout = ''
        let stderr = ''

        // Capture stdout
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        })

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        })

        // Handle process completion
        child.on('close', (code) => {
            resolve({
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                error: code, // If code is 0, no error; otherwise, return the error code
            })
        })

        // Handle process errors
        child.on('error', (err) => {
            resolve({
                stdout: '',
                stderr: stderr.trim(),
                error: err, // Default error code for execution failure
            })
        })

        // Actually detach the process
        if (detached === true)
            child.unref()
    })
}

module.exports = detachedExec

// async function init() {
//     async function para() {
//         const ret = await detachedExec("ping -c 5 9.9.9.9")
//         console.log(ret)
//     }
//     para()
//     para()
// }

// init()