"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

class Rebuild {
    RebuildPlatform(code_version) {
        console.log(`Running electron-rebuild for Electron version ${code_version.electron} (${code_version.platform} ${code_version.arch}) ..`)

        let p = path.resolve(path.join("node_modules", ".bin", "electron-rebuild"));

        let output = spawnSync(p, ["-f", "-w", "serialport", "--version", code_version.electron, "--arch", code_version.arch], {
            //cwd: repo_folder
        }).output;

        if (output != null) {
            if (output[0] != null)
                console.log(output[0].toString('utf8'));

            if (output[1] != null)
                console.log(output[1].toString('utf8'));

            if (output[2] != null)
                console.log(output[2].toString('utf8'));
        }

        return path.resolve(path.join("node_modules", "@serialport", "bindings", "bin", `${code_version.platform}-${code_version.arch}-${code_version.modules}`));
    }
}

module.exports = Rebuild;