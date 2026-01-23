import type { Client } from "../Client.js";
import { ClientRequestMedia } from "../command/client/ClientRequestMedia.js";
import { PacketType } from "../command/packet/types.js";
import { ServerAnnounceMedia } from "../command/server/ServerAnnounceMedia.js";
import { ServerMedia } from "../command/server/ServerMedia.js";
import Logger from "../util/logger.js";
import type { MediaStore } from "./MediaStore.js";

export class MediaManager {
    // Hashes that the server says we need
    private requiredFiles = new Map<string, string>();
    // Filenames we have successfully acquired (either from DB or download)
    private receivedFiles = new Set<string>();

    private resolveReady?: () => void;
    // biome-ignore lint/suspicious/noExplicitAny: error type
    private rejectReady?: (err: any) => void;

    private requestSent = false;
    private log = Logger.get("MediaManager");

    constructor(
        private client: Client,
        public store: MediaStore,
    ) {
        client.cc.events.on("ServerCommand", (cmd) => {
            if (cmd instanceof ServerAnnounceMedia) {
                this.handleAnnounce(cmd);
            } else if (cmd instanceof ServerMedia) {
                this.handleMedia(cmd);
            }
        });
    }

    public waitForMedia(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.requestSent && this.receivedFiles.size >= this.requiredFiles.size) {
                resolve();
            } else {
                this.resolveReady = resolve;
                this.rejectReady = reject;
            }
        });
    }

    private async handleAnnounce(cmd: ServerAnnounceMedia) {
        this.log.info(`Server announced ${cmd.files.length} files.`);

        const toRequest: string[] = [];

        const checks = cmd.files.map(async (file) => {
            this.requiredFiles.set(file.name, file.sha1);

            // Check if we already have it in store
            const has = await this.store.hasMedia(file.sha1);
            if (has) {
                this.receivedFiles.add(file.name);
            } else {
                return file.name;
            }
            return null;
        });

        const results = await Promise.all(checks);

        for (const name of results) {
            if (name) toRequest.push(name);
        }

        if (toRequest.length > 0) {
            this.log.info(`Requesting ${toRequest.length} files...`);
            this.client.cc.sendCommand(new ClientRequestMedia(toRequest), PacketType.Reliable);
        } else {
            this.log.info("No new media files to request (all in cache).");
        }

        this.requestSent = true;
        this.checkCompletion();
    }

    private async handleMedia(cmd: ServerMedia) {
        let added = 0;

        for (const file of cmd.files) {
            if (this.requiredFiles.has(file.name)) {
                const hash = this.requiredFiles.get(file.name);
                if (hash) {
                    await this.store.addMedia(hash, file.name, file.data);
                    if (!this.receivedFiles.has(file.name)) {
                        this.receivedFiles.add(file.name);
                        added++;
                    }
                }
            }
        }

        if (added > 0) {
            const percent = ((this.receivedFiles.size / this.requiredFiles.size) * 100).toFixed(1);
            if (
                this.receivedFiles.size % 100 === 0 ||
                this.receivedFiles.size === this.requiredFiles.size
            ) {
                this.log.info(
                    `Progress: ${this.receivedFiles.size}/${this.requiredFiles.size} (${percent}%)`,
                );
            }
        }

        this.checkCompletion();
    }

    private checkCompletion() {
        if (!this.requestSent) return;

        if (this.receivedFiles.size >= this.requiredFiles.size) {
            this.log.info(`Media sync complete (${this.receivedFiles.size} files).`);
            if (this.resolveReady) {
                this.resolveReady();
                this.resolveReady = undefined;
            }
        }
    }
}
