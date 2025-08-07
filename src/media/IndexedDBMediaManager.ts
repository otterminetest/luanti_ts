import { MediaManager } from "./MediaManager.js";

import "fake-indexeddb/auto";
import Dexie from 'dexie';

export class IndexedDBMediaManager extends Dexie implements MediaManager {

    media!: Dexie.Table<CachedMedia, number>

    constructor() {
        super("meseweb")
        this.version(1).stores({
            media: "hash,filename,size,data"
        })
    }

    size(): Promise<number> {
        return this.media.count()
    }
    hasMedia(hash: string): Promise<boolean> {
        return this.media.where("hash").equalsIgnoreCase(hash).first().then(v => !!v)
    }
    getMedia(filename: string): Promise<Blob | null> {
        return this.media.where("filename").equals(filename).first().then(m => {
            return m ? m.data : null
        })
    }
    addMedia(hash: string, filename: string, data: Blob): Promise<void> {
        // only store if not already in cache
        return this.hasMedia(hash)
        .then(exists => {
            if (!exists){
                return this.media.add({
                    hash: hash,
                    filename: filename,
                    size: data.size,
                    data: new Blob([data])
                })
                .then(() => {})
            }
        })
    }
    clear(): Promise<void> {
        return this.media.clear()
    }

}

interface CachedMedia {
    hash: string
    filename: string
    size: number
    data: Blob
}