# Hi there
This lib simplifies usage of GitHub webhooks as a simple CI/CD

# Install
```bash
npm install @dogonis/github-hook
```
```bash
yarn add @dogonis/github-hook
```

# Table of content
 - [Description](#description)
 - [Usage](#usage)
     - [Basic usage](#basic-usage)
     - [JS code](#js-code)
     - [Commands](#commands)
 - [API](#api)
     - [Hook](#hook)
     - [Router](#router)

# Description
This lib is just a wrapper around simple express server so it is really easy to add the lib to your existing express projects.
The package provides simple and clean API to run scripts based on GitHub webhook calls

# Usage
## Basic usage
```ts
import { createHook } from "@dogonis/github-hook"

const hook = createHook({
    projects: [
        {
            label: "frontend-prod",
            repos: ["my-frontend-repo"],
            branches: ["master"],
            ghSecurityKey: "your-gh-hook-key",
            scripts: [
                (commit, api) => api.log(`Last commit message: ${commit.lastCommitMessage}`),
                "sh restart-frontend.sh"
            ],
        },
        {
            label: "frontend-dev",
            repos: ["my-frontend-repo"],
            branches: ["dev"],
            ghSecurityKey: "your-gh-hook-key",
            scripts: "sh restart-dev-frontend.sh",
        },
    ]
})

hook.start(4040);
```
The code above starts express server on port 4040 that will listen for post requests with path "/", which can be specified with **projectPath** for each project and **hookPath** to specify root path for all of them. In this example we use same path for all the projects, but we can filter hook calls with **repos** and **branches** properties. **label** property just specifies project label in logs, **ghSecurityKey** specifies GitHub hook security key and **envs** specifies envs that will be passed to all the scripts in the projects. 

The complete project type:
```ts
interface Project {
    ghSecurityKey?: string;
    repos?: string[];
    branches?: string[];
    projectPath?: string;
    scripts: GHScript;
    label?: string;
    envs?: Record<string, string>;
}
```

**scripts** property specifies all the scripts that will be executed after correct hook call.
Scripts are executed one by one starting from the first element. Execution will be stopped if one of the scripts returned an error.
Basically, **scripts** is an array of functions, strings and objects. 

## JS code
To execute custom JS code add a function to the **scripts** array. This function will be called with two arguments: GitHub message and Handler api.
 - **GHMessage** contains message from GitHub:
   ```ts
    type GHMessage = {
        repo: string;
        branch: string;
        lastCommitID: string;
        lastCommitMessage: string;
        pushAuthor: string;
    }
   ```
 - **GHHandlerAPI** contains useful functions 
   ```ts
    type GHHandlerAPI = {
        log(message: string): void // log a message to the console
        error(message: string): void // log an error to the console
    }
   ```
   It is preferable to use provided log/error functions over **console.** methods to properly fit them into hook logs

## Commands
To execute console command add string or object to the **scripts** array.
 - String represents single command in the console
 - Object allows command execution with additional parameters
   ```ts
    type Script = {
        script: string; // Command to execute
        cwd?: string; // cwd for the script
        env?: Record<string, string>; // env variable to be passed
    }
   ```
**GHMessage** will be passed to the script as envs with prefix **GH_**. For example, the code below will log repo name to the console
```bash
echo $GH_repo
```

# API
## Hook
**createHook()** returns **GHHook** interface
```ts
interface GHHook {
    start: StartFunction;
    getExpressApp(): express.Application;
    stop(): Promise<void>;
}
```
 - **start()** method starts the express server and returns Promise containing server address
   ```ts
    type HookAddress = {
        port: number;
        host: string;
        family: string;
    }

    interface StartFunction {
        (port?: number): Promise<HookAddress>
        (port: number, host: string): Promise<HookAddress>
    }
   ```
 - **getExpressApp()** returns express application
 - **stop()** stops the server

## Router
**createRouter()** returns configured express Router
```ts
import express from "express"
import { createRouter } from "@dogonis/github-hook"

const app = express();

const hookRouter = createRouter({
    projects: [
        {
            scripts: (data, api) => api.log(data.repo)
        }
    ]
});

app.use("/hook", hookRouter);

app.listen(3000);
``` 
This function is useful if you want to integrate GitHub hook into your existing express project.
