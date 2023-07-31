import { exec } from "child_process";

import { chalk } from "./chalk";
import { Logger } from "./logger";
import { GHHandlerAPI, GHMessage, GHScript } from "./types";

export const executeScripts = async (
    scripts: GHScript,
    logger: Logger,
    message: GHMessage,
    ghEnvs: Record<string, string>,
    projectEnvs?: Record<string, string>,
) => {
    const api: GHHandlerAPI = {
        log: message => logger.log(message),
        error: message => logger.error(message),
    }

    if(scripts instanceof Array) {
        for(let i = 0; i < scripts.length; i++) {
            logger.setPrefix(chalk.magenta(`[${i}]`) + " ")
            try {
                await executeScripts(scripts[i], logger, message, ghEnvs, projectEnvs);
            } catch (e) {
                throw e;
            } finally {
                logger.setPrefix(null)
            }
        }
    } else if(typeof scripts === "function") {
        logger.log(chalk.italic.magenta(`JS`))
        await scripts(message, api);
    } else {
        const script = typeof scripts === "string" ? scripts : scripts.script;
        const cwd = typeof scripts === "string" ? undefined : scripts.cwd;
        const providedEnv = typeof scripts === "string" ? undefined : scripts.envs ?? undefined;
        
        logger.log(chalk.italic.magenta(script))
        if(cwd) logger.log(chalk.magenta("CWD:") + " " + chalk.magenta.italic(cwd))
        if(projectEnvs) {
            logger.log(chalk.magenta("Project envs:"));
            for(const key in projectEnvs)
                if(projectEnvs.hasOwnProperty(key)) {
                    logger.log(chalk.magenta(`  ${key}: ${projectEnvs[key]}`))
                }
        }
        if(providedEnv) {
            logger.log(chalk.magenta("Custom envs:"));
            for(const key in providedEnv)
                if(providedEnv.hasOwnProperty(key)) {
                    logger.log(chalk.magenta(`  ${key}: ${providedEnv[key]}`))
                }
        }
        
        await new Promise<void>((resolve, reject) => {
            const child = exec(script, {
                cwd, 
                env: Object.assign(
                    {},
                    providedEnv,
                    ghEnvs,
                    projectEnvs,
                )
            });

            child.stdout?.on('data', (a: Buffer) => logger.log(a.toString()))
            child.stderr?.on('data', (a: Buffer) => logger.error(a.toString()))

	        child.on('exit', code => {
                if(!code || code == 0) resolve()
                else reject(code)
            });
        })
    } 
}