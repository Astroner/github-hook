import { Server } from "http";
import { AddressInfo } from "net";

import * as express from "express";

import { RouterConfig, createRouter } from "./create-router";
import { chalk } from "./chalk";
import { Logger } from "./logger";

export interface HookConfig extends RouterConfig {
    hookPath?: string
}

type HookAddress = {
    port: number;
    host: string;
    family: string;
}

interface StartFunction {
    (port?: number): Promise<HookAddress>
    (port: number, host: string): Promise<HookAddress>
}

export interface GHHook {
    start: StartFunction;
    getExpressApp(): express.Application;
    stop(): Promise<void>;
}

export const createHook = (config: HookConfig): GHHook => {
    const { hookPath = "/", ...routerConfig } = config;
    const app = express();
    const logger = new Logger();

    app.use(hookPath, createRouter(routerConfig, logger));

    let server: Server | null = null;

    const start: StartFunction = (
        firstArg?: number | string,
        secondArg?: string,
    ) => new Promise((resolve) => {
        const port = typeof firstArg === "number" ? firstArg : null;
        const host = typeof firstArg === "string" ? firstArg : typeof secondArg === "string" ? secondArg : null;
        
        const startedServer = 
            port && host ? app.listen(port, host) 
            : port 
            ? app.listen(port) 
            : host 
            ? app.listen(host) 
            : app.listen();

        startedServer.once("listening", () => {
            const addr = startedServer.address() as AddressInfo;
            logger.group(chalk.bgGreen.black("GitHub hook started"));
            logger.log(chalk.green(`Host: ${addr.address}`))
            logger.log(chalk.green(`Port: ${addr.port}`))
            logger.groupEnd();

            server = startedServer;
            resolve({
                port: addr.port,
                host: addr.address,
                family: addr.family,
            })
        })
    })

    return {
        start,
        getExpressApp: () => app,
        stop: () => new Promise<void>((resolve, reject) => {
            server?.close((err) => err ? reject(err) : resolve())
        })
    }
}