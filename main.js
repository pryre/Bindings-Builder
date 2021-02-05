const fs = require("fs")
const homedir = require("os").homedir();
const git = require("isomorphic-git");
const http = require('isomorphic-git/http/node')

async function processBuild(token, email) {
  let dir = "./node_modules/@serialport/bindings/bin";
  let binding_folder = fs.readdirSync(dir)[0];
  let binding_folder_fullpath = `${dir}/${binding_folder}`;
  let regex = /(?<platform>[a-z0-9]+)-(?<arch>[a-z0-9]+)-(?<abi>[0-9]+)/i;
  let match = regex.exec(binding_folder);
  let renamed_folder = `node-v${match.groups.abi}-${match.groups.platform}-${match.groups.arch}`;
  let renamed_folder_fullpath = `${dir}/${renamed_folder}`;
  let repo_folder = `${homedir}/Pico-Go`;

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

  // Rename in format node-v{abi}-{platform}-{arch}
  fs.renameSync(binding_folder_fullpath, renamed_folder_fullpath);

  // Delete an existing target folder
  if (fs.existsSync(`${repo_folder}/native_modules/@serialport/bindings/lib/binding/${renamed_folder}`))
  fs.rmdirSync(`${repo_folder}/native_modules/@serialport/bindings/lib/binding/${renamed_folder}`, {
    recursive: true,
    force: true
  });

  // Move bindings to repo
  fs.renameSync(renamed_folder_fullpath, `${repo_folder}/native_modules/@serialport/bindings/lib/binding/${renamed_folder}`);

  // Add
  await git.add({ fs, dir: repo_folder, filepath: `native_modules/@serialport/bindings/lib/binding/${renamed_folder}/bindings.node` });

  // Commit
  await git.commit({
    fs,
    dir: repo_folder,
    author: {
      name: "Chris Wood",
      email: email
    },
    message: `Bindings-Builder added ${renamed_folder}`
  });

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
    onAuth: () => ({
      username: token
    }),
  });

  console.log(`Push completed successfully: ${pushResult.ok}`);

  if (!pushResult.ok)
    console.error(pushResult.error);
}

let args = process.argv.slice(2);

processBuild(args[0], args[1]).then(function () {
  console.log("All done!");
})