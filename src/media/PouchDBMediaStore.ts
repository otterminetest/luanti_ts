import PouchDB from "pouchdb";
import PouchFind from "pouchdb-find";
import type { MediaStore } from "./MediaStore.js";

PouchDB.plugin(PouchFind);

interface MediaDoc {
    _id: string;
    filename: string;
    size: number;
    _attachments?: {
        [filename: string]: {
            content_type: string;
            data: Blob | Buffer;
        };
    };
}

export class PouchDBMediaStore implements MediaStore {
    private db: PouchDB.Database<MediaDoc>;
    private initPromise: Promise<void>;
    private dbName: string;

    constructor(dbName: string) {
        this.dbName = dbName;

        this.db = new PouchDB<MediaDoc>(this.dbName);

        this.initPromise = this.db
            .createIndex({
                index: { fields: ["filename"] },
            })
            .then(() => {});
    }

    size(): Promise<number> {
        return this.db.info().then((info) => info.doc_count);
    }

    async hasMedia(hash: string): Promise<boolean> {
        try {
            await this.db.get(hash);
            return true;
        } catch (err) {
            // biome-ignore lint/suspicious/noExplicitAny: PouchDB error check
            if ((err as any).status === 404) return false;
            throw err;
        }
    }

    async getMedia(filename: string): Promise<Uint8Array | null> {
        await this.initPromise;

        const result = await this.db.find({
            selector: { filename: filename },
            limit: 1,
        });

        if (result.docs.length === 0) return null;
        const id = result.docs[0]._id;

        try {
            const doc = await this.db.get(id, { attachments: true, binary: true });

            if (!doc._attachments || !doc._attachments.data) return null;

            const attachmentData = doc._attachments.data.data;

            if (globalThis.Buffer && Buffer.isBuffer(attachmentData)) {
                return new Uint8Array(attachmentData);
            }

            if (typeof Blob !== "undefined" && attachmentData instanceof Blob) {
                return new Uint8Array(await attachmentData.arrayBuffer());
            }

            return null;
        } catch (e) {
            console.error("Error retrieving media attachment", e);
            return null;
        }
    }

    async addMedia(hash: string, filename: string, data: Uint8Array): Promise<void> {
        const exists = await this.hasMedia(hash);
        if (exists) return;

        let storageData: Blob | Buffer;

        if (typeof globalThis.Buffer !== "undefined") {
            storageData = Buffer.from(data);
        } else {
            storageData = new Blob([data]);
        }

        try {
            await this.db.put({
                _id: hash,
                filename: filename,
                size: data.byteLength,
                _attachments: {
                    data: {
                        content_type: "application/octet-stream",
                        data: storageData,
                    },
                },
            });
        } catch (err) {
            // biome-ignore lint/suspicious/noExplicitAny: PouchDB error check
            if ((err as any).status !== 409) {
                throw err;
            }
        }
    }

    async clear(): Promise<void> {
        await this.db.destroy();
        this.db = new PouchDB(this.dbName);
        this.initPromise = this.db
            .createIndex({
                index: { fields: ["filename"] },
            })
            .then(() => {});
    }
}
