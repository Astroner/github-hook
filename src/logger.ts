import { WriteStream } from "tty";

export class Logger {
    private groupIndex = 0;
    private prefix: string = "";

    private logFlatRaw(stream: WriteStream, message: string) {
        for(let i = 0; i < this.groupIndex; i++) {
            stream.write("  ");
        }

        stream.write(message);
    }

    logFlat(message: string) {
        this.logFlatRaw(process.stdout, message);
    }

    log(message: string) {
        const entries = message.split("\n").filter(a => !!a);
        for(const entry of entries) {
            this.logFlatRaw(process.stdout, this.prefix + `${entry}\r\n`);
        }
    }

    error(message: string) {
        const entries = message.split("\n").filter(a => !!a);
        for(const entry of entries) {
            this.logFlatRaw(process.stderr, this.prefix + `${entry}\r\n`);
        }
    }

    getGroupIndex() {
        return this.groupIndex;
    }

    group(label: string) {
        this.log(label)
        this.groupIndex++;
    }

    groupEnd() {
        if(this.groupIndex > 0) this.groupIndex--;
    }

    setPrefix(prefix: null | string) {
        this.prefix = prefix ?? "";
    }

    ln() {
        process.stdout.write("\r\n");
    }
}