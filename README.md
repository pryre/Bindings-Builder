# Bindings-Builder
Builds [node-serialport](https://serialport.io/) bindings for use with [Pico-Go](https://github.com/cpwood/Pico-Go).

## Overview

While `serialport` includes bindings for Windows, Mac and Linux platforms "out of the box", Pico-Go is still left with several issues:

1. The bindings used by `serialport` are native, meaning they have to be compiled for the OS and processor architecture, but also compiled specially for Electron;
2. Pre-built bindings aren't available for arm64 platforms (e.g. Raspberry Pi or Apple's M1 range);
3. We're reliant on the availability and quality of the pre-built images. We've already encountered issues where the pre-build bindings simply don't work, and historically it appears there's been some slowness to keep the pre-built images up-to-date.

Bindings-Builder deals with these issues. It allows us to build our own bindings on-demand using GitHub actions. The bindings are then added to the Pico-Go repo's `develop` branch.

The following platforms and architectures are supported by Bindings-Builder:

* Windows (`win32`):
  * `x64`
* macOs (`darwin`):
  * `x64`
  * `arm64`
* Linux (`linux`):
  * `x64`
  * `arm64`

## Workflow

Bindings-Builder is intended to be run as a GitHub Action as opposed to something on your own machine. The general workflow is as follows:

1. Change the `package.json` file to configure the version of VS Code you're looking to support:

   ```json
     "codeVersions": [
       {
         "code": "1.54.0",
         "electron": "11.2.2",
         "modules": 85
       },
       {
         "code": "1.53.0",
         "electron": "11.2.1",
         "modules": 85
       },
       {
         "code": "1.52.0",
         "electron": "9.3.5",
         "modules": 80
       },
       {
         "code": "1.51.0",
         "electron": "9.3.3",
         "modules": 80
       }
     ],
   ```

   2. Commit and push the changes to `package.json`;
   3. The build action will then run on hosted Windows, Linux and Mac agents.

## Establishing VS Code Versions

The current policy is to support the current insider build, the current RTM build and the two previous RTM builds.

The information for `package.json` can be determined as follows:

1. Look at the `.yarnrc` file in [VS Code](https://github.com/microsoft/vscode)'s repo, e.g.:

   ```
   disturl "https://electronjs.org/headers"
   target "11.2.3"
   runtime "electron"
   ```

   The Electron version is the `target` value. The Insider build is on the `master` branch and other RTM versions are tagged.

2. Look up the `modules` version at the [Electron Releases repo](https://github.com/electron/releases)'s [`lite.json`](https://github.com/electron/releases/blob/master/lite.json) file.