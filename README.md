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

# Description
This lib is just a wrapper around simple express server so it is really easy to add the lib to your existing express projects.
The package provides simple and clean API to run scripts based on GitHub webhook calls

# Usage
Basic usage:
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
The code above starts express server on port 4040 that will listen for post requests with path "/", which can be specified with **projectPath** for each project and **hookPath** to specify root path for all of them. In this example we use same path for all the projects, but we can filter hook calls with **repos** and **branches** properties. **label** property just specifies project label in logs and **ghSecurityKey** specifies GitHub hook security key.

**scripts** property specifies all the scripts that will be executed after correct hook call.
Scripts are executed one by one starting from the first element. Execution will be stopped if one of the scripts returned an error.
Basically, **scripts** is an array of functions, strings and objects. 

## JS code
To execute custom JS code add a function to **scripts** array. This function will be called with two arguments: GitHub message and Handler api.
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

# API