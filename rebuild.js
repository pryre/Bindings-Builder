"use strict";

const { spawn } = require("child_process");
const path = require("path");

class Rebuild {
    async RebuildPlatform(code_version) {
        console.log(`Running electron-rebuild for Electron version ${code_version.electron} (${code_version.platform} ${code_version.arch}) ..`)

        let p = path.resolve(path.join("node_modules", ".bin", "electron-rebuild"));

        if (code_version.platform == "win32")
            p += ".cmd";

        let child = spawn(p, ["-f", "-w", "serialport", "--version", code_version.electron, "--arch", code_version.arch]);

        for await (let data of child.stdout) {
            console.log(`${data}`);
        };

        for await (let data of child.stderr) {
            console.error(`${data}`);
        };

        console.log("Finished building bindings!");

        return path.resolve(path.join("node_modules", "@serialport", "bindings", "bin", `${code_version.platform}-${code_version.arch}-${code_version.modules}`));
    }
}

module.exports = Rebuild;