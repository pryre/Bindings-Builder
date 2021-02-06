const package = require("./package.json");
const { exec } = require("child_process");
const path = require("path");

console.log(`Running electron-rebuild for Electron version ${package["electronVersion"]} ..`)

let p = path.resolve(path.join("node_modules", ".bin", "electron-rebuild"));

exec(`${p} -f -w serialport --version ${package["electronVersion"]}`, (error, stdout, stderr) => {
    if (error) {
        console.log(error.message);
        return;
    }
    if (stderr) {
        console.log(stderr);
        return;
    }
    console.log(stdout);
});
