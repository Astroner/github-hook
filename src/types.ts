export type GHData = {
    ref: string;
    repository: {
        name: string;
    };
    head_commit: {
        id: string;
        message: string;
    };
    pusher: {
        name: string;
    }
}

export type GHHandlerAPI = {
    log(message: string): void
    error(message: string): void
}

export type GHMessage = {
    repo: string;
    branch: string;
    lastCommitID: string;
    lastCommitMessage: string;
    pushAuthor: string;
}

export type GHHandler = (message: GHMessage, api: GHHandlerAPI) => Promise<void> | void;

export type Script = {
    script: string;
    cwd?: string;
    env?: Record<string, string>;
}

export type GHScript = string | Script | GHHandler | Array<string | Script | GHHandler>;