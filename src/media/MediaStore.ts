export interface MediaStore {
    hasMedia(hash: string): Promise<boolean>;
    getMedia(filename: string): Promise<Uint8Array | null>;
    addMedia(hash: string, filename: string, data: Uint8Array): Promise<void>;
    size(): Promise<number>;
    clear(): Promise<void>;
}
