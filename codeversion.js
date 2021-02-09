"use strict";

const { max } = require("lodash");
const _ = require("lodash");

class CodeVersion {
    get code() {
        return this._code;
    }

    set code(value) {
        this._code = value;
    }

    get electron() {
        return this._electron;
    }

    set electron(value) {
        return this._electron;
    }

    get modules() {
        return this._modules;
    }

    set modules(value) {
        this._modules = value;
    }

    get serialport() {
        return this._serialport;
    }

    set serialport(value) {
        this._serialport = value;
    }

    get platform() {
        return this._platform;
    }

    set platform(value) {
        this._platform = value;
    }

    get arch() {
        return this._arch;
    }

    set arch(value) {
        this._arch = value;
    }

    static getProcessingVersions(codeVersions) {
        let mods = _.uniq(_.map(codeVersions, x => x.modules));
        let v = [];

        mods.forEach(x => {
            let matching = _.filter(codeVersions, y => y.modules == x);
            let maxElectron = _.maxBy(matching, z => z.electron);
            v.push(maxElectron);
        });

        return v;
    }
}

module.exports = CodeVersion;