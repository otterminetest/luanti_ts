import type { MediaManager } from "./MediaManager.js";

export class InMemoryMediaManager implements MediaManager {
    // filename -> data
    data_map = new Map<string, Blob>();

    // hash -> filename
    hash_map = new Map<string, string>();

    hasMedia(hash: string): Promise<boolean> {
        return new Promise((resolve) => {
            resolve(this.hash_map.has(hash));
        });
    }

    getMedia(filename: string): Promise<Blob | null> {
        return new Promise((resolve) => {
            resolve(this.data_map.get(filename) ?? null);
        });
    }

    addMedia(hash: string, filename: string, data: Blob): Promise<void> {
        this.data_map.set(filename, data);
        this.hash_map.set(hash, filename);
        return Promise.resolve();
    }

    clear(): Promise<void> {
        this.data_map.clear();
        this.hash_map.clear();
        return Promise.resolve();
    }

    size(): Promise<number> {
        return Promise.resolve(this.data_map.size);
    }
}
