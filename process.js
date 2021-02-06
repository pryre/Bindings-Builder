const fs = require("fs")
const git = require("isomorphic-git");
const http = require('isomorphic-git/http/node');
const path = require('path');
const fetch = require('node-fetch');
const glob = require("glob");
const _ = require("lodash");
const util = require('util');
const spawn = util.promisify(require('child_process').spawn);

async function findBindings(version) {
  let dir = path.resolve(path.join("node_modules", "@serialport", "bindings", "bin"));

  if (fs.existsSync(dir)) {
    // Mac or Linux
    var folder = fs.readdirSync(dir)[0];
    let regex = /(?<platform>[a-z0-9]+)-(?<arch>[a-z0-9]+)-(?<abi>[0-9]+)/i;
    let match = regex.exec(folder);

    return {
      file: path.join(dir, folder, "bindings.node"),
      binding_folder_name: `node-v${match.groups.abi}-${match.groups.platform}-${match.groups.arch}`
    };
  }
  else {
    // Windows
    let response = await fetch("https://raw.githubusercontent.com/electron/releases/master/lite.json");
    let versions = await response.json();
    let value = _.find(versions, v => v.version == version);
    let abi = value.deps.modules;
    let matches = glob.sync("**/bindings.node");
    
    return {
      file: path.resolve(matches[0]),
      binding_folder_name: `node-v${abi}-win32-x64`
    };
  }
}

async function processBuild(version, token, email) {
  let found = await findBindings(version);
  console.log(found);

  let repo_folder = path.resolve(path.join("..", "..", "Pico-Go"));
  let final_folder = path.join(repo_folder, "native_modules", "@serialport", "bindings", "lib", "binding", found.binding_folder_name);
  let final_file = path.join(final_folder, "bindings.node");

  // Delete an existing source folder and make a new one
  if (fs.existsSync(repo_folder))
    fs.rmdirSync(repo_folder, {
      recursive: true,
      force: true
    });

  fs.mkdirSync(repo_folder);

  // Clone the repo
  await git.clone({
    fs,
    http,
    dir: repo_folder,
    url: 'https://github.com/cpwood/Pico-Go.git',
    depth: 1
  });

  // Checkout "develop"
  await git.checkout({
    fs,
    dir: repo_folder,
    ref: 'develop'
  });

  // Delete an existing target folder

  if (fs.existsSync(final_folder))
  fs.rmdirSync(final_folder, {
    recursive: true,
    force: true
  });

  fs.mkdirSync(final_folder);

  // Move bindings to repo
  console.log(`Moving '${found.file}' to '${final_file}' ..`);
  fs.copyFileSync(found.file, final_file);

  await runGitCommand(["config", "user.name", `"Chris Wood"`], repo_folder);
  await runGitCommand(["config", "user.email", `"${email}"`], repo_folder);
  await runGitCommand(["add", path.relative(repo_folder, final_file)], repo_folder);
  await runGitCommand(["commit", "-m", `"Bindings-Builder added ${found.binding_folder_name}"`], repo_folder);
  await runGitCommand(["push"], repo_folder);
/*
  // Add
  await git.add({ fs, dir: repo_folder, filepath: path.relative(repo_folder, final_file) });

  // Commit
  await git.commit({
    fs,
    dir: repo_folder,
    author: {
      name: "Chris Wood",
      email: email
    },
    message: `Bindings-Builder added ${found.binding_folder_name}`
  });

  await pushChanges(repo_folder, email, token);
  */
}

async function pushChanges(repo_folder, email, token){
  let err = null;
  
  for (var i = 0; i < 3; i++){
    try {
      // Pull
      await git.pull({
        fs,
        http,
        dir: repo_folder,
        ref: 'develop',
        singleBranch: true,
        author: {
          name: "Chris Wood",
          email: email
        }
      });

      // Push
      let pushResult = await git.push({
        fs,
        http,
        dir: repo_folder,
        remote: 'origin',
        ref: 'develop',
        force: true,
        onAuth: () => ({
          username: token
        }),
      });

      if (pushResult.ok){
        console.log("Push completed successfully!");
        return;
      }

      err = pushResult.error;
    }
    catch(error){
      err = error;
    }
  }
  
  console.log("Push failed!");
  console.error(err);
}

async function runGitCommand(command, repo_folder) {
  await spawn("git", command, {
    cwd: repo_folder
  });
}

let args = process.argv.slice(2);

try{
  processBuild(args[0], args[1], args[2]).then(function () {
    console.log("All done!");
  });
}
catch (err) {
  console.error(err);
}
