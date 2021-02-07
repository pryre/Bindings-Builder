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
        platform: "win32",
        arch: ["x64"]
    },
    {
        platform: "darwin",
        arch: ["x64", "arm64"]
    },
    {
        platform: "linux",
        arch: ["x64", "arm64"]
    }
];

async function build(token, email) {
    let platform = os.platform();
    let serialport = pkg.dependencies.serialport.replace("^", "");
    let codeVersions = pkg.codeVersions;

    let repo_folder = path.resolve(path.join("..", "..", "Pico-Go"));
    let git = new Git("https://github.com/cpwood/Pico-Go.git", "cpwood", token, repo_folder, "Chris Wood", email);

    await git.Clone();
    await git.Checkout("develop");

    let bindings_root = path.resolve(path.join(repo_folder, "native_modules"));

    let nm = new NativeModules(bindings_root);

    let minModules = _.minBy(codeVersions, x => x.modules).modules;
    let maxModules = _.maxBy(codeVersions, x => x.modules).modules;
    
    let platformResponsibilities = _.find(responsibilities, x => x.platform == platform);
    let modulesVersion = CodeVersion.GetProcessingVersions(codeVersions);
    let rebuild = new Rebuild();

    for(let arch of platformResponsibilities.arch) {
        for(let x of modulesVersion) {
            let spRemoved = nm.RemoveOtherSerialportVersions(platform, arch, serialport);
            let modRemoved = nm.RemoveOtherModulesVersions(platform, arch, minModules, maxModules);

            if (spRemoved || modRemoved) {
                await git.Commit(`Bindings-Builder cleaned up native modules for ${platform} (${arch})`);
                await git.Pull();
                await git.Push();
            }

            x.serialport = serialport;
            x.platform = platform;
            x.arch = arch;

            if (!nm.Exists(x)) {
                // NB: following line will fail when run in debug.
                let built_folder = await rebuild.RebuildPlatform(x);     
                // For debugging only
                //let built_folder = path.resolve(path.join("node_modules", "@serialport", "bindings", "bin", `${x.platform}-${x.arch}-${x.modules}`));

                let final_folder = NativeModules.Add(built_folder, bindings_root, x);

                await git.AddFile(path.join(final_folder, "bindings.node"));
                await git.AddFile(path.join(final_folder, "info.json"));

                await git.Commit(`Bindings-Builder added node-v${x.modules}-${platform}-${arch}`);
                await git.Pull();
                await git.Push();
            }
            else {
                console.log(`Not rebuilding for v${x.modules} ${x.platform} (${x.arch}).`)
            }
        }
    }
}

let args = process.argv.slice(2);

build(args[0], args[1]).then(function() {
    console.log("All done!");
});