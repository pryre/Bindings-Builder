"use strict";

const fs = require("fs");
const path = require("path");
const semver = require("semver");
const CodeVersion = require("./codeversion");

class NativeModules {
    constructor(folder) {
        this._folder = folder;
    }
    
    removeOtherSerialportVersions(platform, arch, keepVersion) {
        let folders = this._getAllFolders();
        let isFound = false;

        folders.forEach(f => {
            let cv = Object.assign(new CodeVersion(), JSON.parse(fs.readFileSync(path.join(f, "info.json"), null, "utf8")));

            if (cv.platform == platform && cv.arch == arch && semver.neq(keepVersion, cv.serialport)) {
                fs.rmdirSync(f, { recursive: true });
                isFound = true;
            }
        });

        return isFound;
    }

    removeOtherModulesVersions(platform, arch, min, max) {
        let folders = this._getAllFolders();
        let isFound = false;

        folders.forEach(f => {
            let cv = Object.assign(new CodeVersion(), JSON.parse(fs.readFileSync(path.join(f, "info.json"), null, "utf8")));

            if (cv.platform == platform && cv.arch == arch && (cv.modules < min || cv.modules > max)) {
                fs.rmdirSync(f, { recursive: true });
                isFound = true;
            }
        });

        return isFound;
    }

    exists(codeVersion) {
        let folders = this._getAllFolders();

        for(let f of folders) {
            let cv = Object.assign(new CodeVersion(), JSON.parse(fs.readFileSync(path.join(f, "info.json"), null, "utf8")));

            if (cv.modules == codeVersion.modules && cv.platform == codeVersion.platform && cv.arch == codeVersion.arch && cv.serialport == codeVersion.serialport)
                return true;
        }

        return false;
    }

    static add(built_folder, modules_folder, codeVersion) {
        let file = path.join(built_folder, "bindings.node");
        let finalFolder = path.join(modules_folder, `node-v${codeVersion.modules}-${codeVersion.platform}-${codeVersion.arch}`);
        let finalFile = path.join(finalFolder, "bindings.node");
        let finalInfo = path.join(finalFolder, "info.json");

        // Delete an existing target folder
        if (fs.existsSync(finalFolder))
        fs.rmdirSync(finalFolder, {
            recursive: true,
            force: true
        });

        fs.mkdirSync(finalFolder);
        fs.copyFileSync(file, finalFile);

        fs.writeFileSync(finalInfo, JSON.stringify(codeVersion));

        return finalFolder;
    }

    _getAllFolders() {
        let folders = fs.readdirSync(this._folder);
        let output = [];

        folders.forEach(f => {
            let item = path.join(this._folder, f);
            if (fs.lstatSync(item).isDirectory()) {
                output.push(item);
            }
        });

        return output;
    }
}

module.exports = NativeModules;