import { exec } from "child_process";

import { chalk } from "./chalk";
import { Logger } from "./logger";
import { GHHandlerAPI, GHMessage, GHScript } from "./types";

export const executeScripts = async (
    scripts: GHScript,
    message: GHMessage,
    logger: Logger,
) => {
    const api: GHHandlerAPI = {
        log: message => logger.log(message),
        error: message => logger.error(message),
    }

    if(scripts instanceof Array) {
        for(let i = 0; i < scripts.length; i++) {
            logger.setPrefix(chalk.magenta(`[${i}]`) + " ")
            try {
                await executeScripts(scripts[i], message, logger);
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
        
        logger.log(chalk.italic.magenta(script))
        
        await new Promise<void>((resolve, reject) => {
            const child = exec(script, {
                cwd, 
                env: Object.fromEntries(
                    Object.entries(message).map(([key, value]) => ["GH_" + key, value])
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