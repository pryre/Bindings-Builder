"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

class Git {
    constructor(url, username, token, repo_folder, real_name, email) {
        this._url = `https://${username}:${token}@${url.replace("https://", "")}`;
        this._repo_folder = repo_folder;
        this._real_name = real_name;
        this._email = email;
    }

    async Clone() {
        // Delete an existing source folder and make a new one
        if (fs.existsSync(this._repo_folder))
        fs.rmdirSync(this._repo_folder, {
            recursive: true,
            force: true
        });

        fs.mkdirSync(this._repo_folder);

        await this.__runGitCommand(["clone", this._url], path.resolve(path.join(this._repo_folder, "..")));
        await this.__runGitCommand(["config", "user.name", `"${this._real_name}"`]);
        await this.__runGitCommand(["config", "user.email", `"${this._email}"`]);
    }

    async Checkout(branch) {
        await this.__runGitCommand(["checkout", branch]);
    }

    async AddFile(absolute_file_path) {
        await this.__runGitCommand(["add", path.relative(this._repo_folder, absolute_file_path)]);
    }

    async Commit(message) {
        await this.__runGitCommand(["commit", "-m", message]);
    }

    async Push() {
        await this.__runGitCommand(["push"]);
    }

    async __runGitCommand(command, repo_folder = this._repo_folder) {
        let output = spawnSync("git", command, {
          cwd: repo_folder
        }).output;
      
        if (output[0] != null)
          console.log(output[0].toString('utf8'));
      
        if (output[1] != null)
          console.log(output[1].toString('utf8'));
      
        if (output[2] != null)
          console.log(output[2].toString('utf8'));
      }
}

module.exports = Git;