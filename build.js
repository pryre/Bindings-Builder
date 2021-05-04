"use strict";

const pkg = require("./package.json");
const path = require("path");
const Git = require("./git");
const CodeVersion = require("./codeversion");
const NativeModules = require("./nativemodules");
const Rebuild = require("./rebuild");
const os = require("os");
const _ = require("lodash")

let responsibilities = [
    {
        matrix: "windows-latest",
        platform: "win32",
        arch: ["x64"]
    },
    {
        matrix: "macos-latest",
        platform: "darwin",
        arch: ["x64", "arm64"]
    },
    {
        matrix: "ubuntu-latest",
        platform: "linux",
        arch: ["x64"]
    },
    {
        matrix: "pi-hosted",
        platform: "linux",
        arch: ["arm64"]
    } 
];

async function build(matrix, token, email) {
    let platform = os.platform();
    let serialport = pkg.dependencies.serialport.replace("^", "");
    let codeVersions = pkg.codeVersions;

    let repoFolder = path.resolve(path.join("..", "..", "Pico-Go"));
    let git = new Git("https://github.com/cpwood/Pico-Go.git", "cpwood", token, repoFolder, "Chris Wood", email);

    await git.clone();
    await git.checkout("develop");

    let bindingsRoot = path.resolve(path.join(repoFolder, "native_modules"));

    let nm = new NativeModules(bindingsRoot);

    let minModules = _.minBy(codeVersions, x => x.modules).modules;
    let maxModules = _.maxBy(codeVersions, x => x.modules).modules;
    
    let platformResponsibilities = _.find(responsibilities, x => x.matrix == matrix);
    let modulesVersion = CodeVersion.getProcessingVersions(codeVersions);
    let rebuild = new Rebuild();

    for(let arch of platformResponsibilities.arch) {
        for(let x of modulesVersion) {
            let spRemoved = nm.removeOtherSerialportVersions(platform, arch, serialport);
            let modRemoved = nm.removeOtherModulesVersions(platform, arch, minModules, maxModules);

            if (spRemoved || modRemoved) {
                await git.commit(`Bindings-Builder cleaned up native modules for ${platform} (${arch})`);
                await git.pull();
                await git.push();
            }

            x.serialport = serialport;
            x.platform = platform;
            x.arch = arch;

            if (!nm.exists(x)) {
                // NB: following line will fail when run in debug.
                let builtFolder = await rebuild.rebuildPlatform(x);     
                // For debugging only
                //let builtFolder = path.resolve(path.join("node_modules", "@serialport", "bindings", "bin", `${x.platform}-${x.arch}-${x.modules}`));

                let finalFolder = NativeModules.add(builtFolder, bindingsRoot, x);

                await git.addFile(path.join(finalFolder, "bindings.node"));
                await git.addFile(path.join(finalFolder, "info.json"));

                await git.commit(`Bindings-Builder added node-v${x.modules}-${platform}-${arch}`);
                await git.pull();
                await git.push();
            }
            else {
                console.log(`Not rebuilding for v${x.modules} ${x.platform} (${x.arch}).`)
            }
        }
    }
}

let args = process.argv.slice(2);

build(args[0], args[1], args[2]).then(function() {
    console.log("All done!");
});