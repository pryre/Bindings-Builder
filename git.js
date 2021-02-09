"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

class Git {
    constructor(url, username, token, repoFolder, realName, email) {
        this._url = `https://${username}:${token}@${url.replace("https://", "")}`;
        this._repoFolder = repoFolder;
        this._realName = realName;
        this._email = email;
    }

    async clone() {
        // Delete an existing source folder and make a new one
        if (fs.existsSync(this._repoFolder))
        fs.rmdirSync(this._repoFolder, {
            recursive: true,
            force: true
        });

        fs.mkdirSync(this._repoFolder);

        await this._runGitCommand(["clone", this._url], path.resolve(path.join(this._repoFolder, "..")));
        await this._runGitCommand(["config", "user.name", `"${this._realName}"`]);
        await this._runGitCommand(["config", "user.email", `"${this._email}"`]);
    }

    async checkout(branch) {
        await this._runGitCommand(["checkout", branch]);
    }

    async addFile(absolute_file_path) {
        await this._runGitCommand(["add", path.relative(this._repoFolder, absolute_file_path)]);
    }

    async commit(message) {
        await this._runGitCommand(["commit", "-m", message]);
    }

    async pull() {
        await this._runGitCommand(["pull"]);
    }

    async push() {
        await this._runGitCommand(["push"]);
    }

    async _runGitCommand(command, repoFolder = this._repoFolder) {
        let child = spawn("git", command, {
            cwd: repoFolder
        });

        for await (let data of child.stdout) {
            console.log(`${data}`);
        };

        for await (let data of child.stderr) {
            console.error(`${data}`);
        };
      }
}

module.exports = Git;