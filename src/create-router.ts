import * as crypto from "crypto";
import { exec } from "child_process";

import { Router } from "express";

import { GHData, GHMessage, GHScript } from "./types";
import { chalk } from "./chalk";
import { Logger } from "./logger";
import { executeScripts } from "./execute-scripts";

export interface Project {
    ghSecurityKey?: string;
    repos?: string[];
    branches?: string[];
    projectPath?: string;
    scripts: GHScript;
    label?: string;
}

export interface RouterConfig {
    ghSecurityKey?: string;
    projects: Project[];
}

export const createRouter = (config: RouterConfig, logger: Logger = new Logger()) => {
    const router = Router();

    router.post("*", async (req, res) => {
        const stringData = await Promise.race([
            new Promise<string>((resolve) => {
                req.once("data", data => resolve(data.toString()));
            }),
            new Promise<string>((resolve) => {
                setTimeout(() => resolve("CANNOT_GET_BODY"), 100);
            })
        ]);

        if(stringData === "CANNOT_GET_BODY") {
            res.status(401).send();
            return;
        };
        
        res.send();

        for(const project of config.projects) {
            if(project.projectPath && project.projectPath !== req.path) continue;

            const key = project.ghSecurityKey ?? config.ghSecurityKey;
            

            if(key) {
                const signature = `sha256=${crypto.createHmac('sha256', key).update(stringData).digest("hex")}`;
                if(signature !== req.headers['x-hub-signature-256']) continue;
            }
            
            const data: GHData = JSON.parse(stringData);

            if(project.repos && !project.repos.includes(data.repository.name)) continue;

            const parts = data.ref.split("/")
            const branch = parts[parts.length - 1];

            if(project.branches && !project.branches.includes(branch)) continue;

            const message: GHMessage = {
                branch,
                repo: data.repository.name,
                lastCommitID: data.head_commit.id,
                lastCommitMessage: data.head_commit.message,
                pushAuthor: data.pusher.name,
            };

            const messageDict = Object.fromEntries(
                Object.entries(message).map(([key, value]) => ["GH_" + key, value])
            )
            
            logger.ln();
        
            logger.group(chalk.bgGreen.black("Update for"));
            if(project.label) logger.log(chalk.green(`Project: ${project.label}`));
            logger.log(chalk.green(`Path: ${req.path}`));
            logger.log(chalk.green(`Repo: ${message.repo}`));
            logger.groupEnd();

            try {
                logger.group(chalk.bgGreen.black("Executing scripts"));
                await executeScripts(project.scripts, logger, message, messageDict);
                logger.log(chalk.green("Done"));
            } catch (e) {
                logger.error(chalk.red("Error: ") + e);
            }
            logger.groupEnd();
            logger.ln();
        }
    })

    return router;
}