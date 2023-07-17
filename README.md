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
The code above starts express server on port 4040 and listen for post requests with path "/", which can be specified with **projectPath** for each project and **hookPath** to specify root path for all of them. In this example we use same path for all the projects, but we can filter hook calls with **repos** and **branches** properties. **label** property just specifies project label in logs and **ghSecurityKey** specifies GitHub hook security key.

**scripts** property specifies all the scripts that will be executed after correct hook call.
Scripts are executed one by one starting from the first element. Execution will be stopped if one of the scripts returns error.
Basically, **scripts** is an array of functions and strings. 

# API