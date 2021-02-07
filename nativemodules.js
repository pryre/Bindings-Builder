"use strict";

const fs = require("fs");
const path = require("path");
const semver = require("semver");
const CodeVersion = require("./codeversion");

class NativeModules {
    constructor(folder) {
        this._folder = folder;
    }
    
    RemoveOtherSerialportVersions(platform, arch, keepVersion) {
        let folders = this.__getAllFolders();
        let found = false;

        folders.forEach(f => {
            let cv = Object.assign(new CodeVersion(), JSON.parse(fs.readFileSync(path.join(f, "info.json"), null, "utf8")));

            if (cv.platform == platform && cv.arch == arch && semver.neq(keepVersion, cv.serialport)) {
                fs.rmdirSync(f);
                found = true;
            }
        });

        return found;
    }

    RemoveOtherModulesVersions(platform, arch, min, max) {
        let folders = this.__getAllFolders();
        let found = false;

        folders.forEach(f => {
            let cv = Object.assign(new CodeVersion(), JSON.parse(fs.readFileSync(path.join(f, "info.json"), null, "utf8")));

            if (cv.platform == platform && cv.arch == arch && (cv.modules < min || cv.modules > max)) {
                fs.rmdirSync(f);
                found = true;
            }
        });

        return found;
    }

    Exists(code_version) {
        let folders = this.__getAllFolders();

        for(let f of folders) {
            let cv = Object.assign(new CodeVersion(), JSON.parse(fs.readFileSync(path.join(f, "info.json"), null, "utf8")));

            if (cv.modules == code_version.modules && cv.platform == code_version.platform && cv.arch == code_version.arch && cv.serialport == code_version.serialport)
                return true;
        }

        return false;
    }

    static Add(built_folder, modules_folder, code_version) {
        let file = path.join(built_folder, "bindings.node");
        let final_folder = path.join(modules_folder, `node-v${code_version.modules}-${code_version.platform}-${code_version.arch}`);
        let final_file = path.join(final_folder, "bindings.node");
        let final_info = path.join(final_folder, "info.json");

        // Delete an existing target folder
        if (fs.existsSync(final_folder))
        fs.rmdirSync(final_folder, {
            recursive: true,
            force: true
        });

        fs.mkdirSync(final_folder);
        fs.copyFileSync(file, final_file);

        fs.writeFileSync(final_info, JSON.stringify(code_version));

        return final_folder;
    }

    __getAllFolders() {
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