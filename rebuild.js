"use strict";

const { spawn } = require("child_process");
const path = require("path");

class Rebuild {
    async rebuildPlatform(codeVersion) {
        console.log(`Running electron-rebuild for Electron version ${codeVersion.electron} (${codeVersion.platform} ${codeVersion.arch}) ..`)

        let p = path.resolve(path.join("node_modules", ".bin", "electron-rebuild"));

        if (codeVersion.platform == "win32")
            p += ".cmd";

        let child = spawn(p, ["-f", "-w", "serialport", "--version", codeVersion.electron, "--arch", codeVersion.arch]);

        for await (let data of child.stdout) {
            console.log(`${data}`);
        };

        for await (let data of child.stderr) {
            console.error(`${data}`);
        };

        console.log("Finished building bindings!");

        return path.resolve(path.join("node_modules", "@serialport", "bindings", "bin", `${codeVersion.platform}-${codeVersion.arch}-${codeVersion.modules}`));
    }
}

module.exports = Rebuild;