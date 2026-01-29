import { decompress } from "fzstd";
import Logger from "../../util/logger.js";
import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export interface MediaFileAnnouncement {
    name: string;
    sha1: string; // hex string
}

export class ServerAnnounceMedia implements ServerCommand {
    files: MediaFileAnnouncement[] = [];
    remoteServers: string[] = [];
    private log = Logger.get("ServerAnnounceMedia");

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        // Compressed name list (LongString: u32 len + bytes)
        const namesLen = dv.getUint32(offset);
        offset += 4;

        this.log.debug(`Compressed names length: ${namesLen}`);

        const compressedNames = new Uint8Array(dv.buffer, dv.byteOffset + offset, namesLen);
        offset += namesLen;

        const names: string[] = [];

        try {
            const decompressedNames = decompress(compressedNames);
            const namesDv = new DataView(
                decompressedNames.buffer,
                decompressedNames.byteOffset,
                decompressedNames.byteLength,
            );
            const namesPh = new PayloadHelper(namesDv);

            let namesOffset = 0;

            // Try to detect u32 count (00 00 XX XX) vs u16 count (XX XX)
            let count = namesDv.getUint16(namesOffset);
            let isU32Count = false;

            if (count === 0 && namesDv.byteLength > 4) {
                // Peek ahead to see if it looks like a u32 count
                const lower = namesDv.getUint16(namesOffset + 2);
                if (lower > 0) {
                    count = namesDv.getUint32(namesOffset);
                    isU32Count = true;
                    namesOffset += 4;
                } else {
                    namesOffset += 2;
                }
            } else {
                namesOffset += 2;
            }

            this.log.debug(`Parsing ${count} names (U32=${isU32Count})`);

            // Strategy A: Standard Interleaved [Len, String, Len, String...]
            // Strategy B: Split Arrays [Len, Len, Len...] followed by [String, String, String...]
            
            let useSplitLayout = false;

            // Robust Heuristic:
            // In Split layout, the first `count * 2` bytes are u16 lengths.
            // Since filenames are typically short (< 256 bytes), the high byte of these u16s (at index 0, 2, 4...) should be 0x00.
            // In Standard layout, `namesOffset + 2` would be the first character of the first filename, which is usually not 0x00.
            if (count > 0 && namesOffset + count * 2 <= namesDv.byteLength) {
                let zeros = 0;
                let checks = 0;
                // Check the high-byte of the first few items
                const limit = Math.min(count, 10);
                
                for(let k = 0; k < limit; k++) {
                    const highByte = namesDv.getUint8(namesOffset + (k * 2));
                    if (highByte === 0) zeros++;
                    checks++;
                }

                // If the majority of the "length high bytes" are 0, it's extremely likely to be Split Layout
                if (checks > 0 && zeros / checks >= 0.7) {
                    useSplitLayout = true;
                }
            }

            if (useSplitLayout) {
                // Strategy B: Read all lengths first
                const lengths: number[] = [];
                let lenOffset = namesOffset;

                for (let i = 0; i < count; i++) {
                    lengths.push(namesDv.getUint16(lenOffset));
                    lenOffset += 2;
                }

                // Now read strings based on lengths
                let strOffset = lenOffset;
                for (let i = 0; i < count; i++) {
                    const len = lengths[i];
                    // Manual string read to avoid recreating PayloadHelper or slicing too much
                    let str = "";
                    for (let k = 0; k < len; k++) {
                        str += String.fromCharCode(namesDv.getUint8(strOffset + k));
                    }
                    names.push(str);
                    strOffset += len;
                }
            } else {
                // Strategy A: Standard Interleaved
                for (let i = 0; i < count; i++) {
                    if (namesOffset >= namesDv.byteLength) break;
                    const str = namesPh.getString(namesOffset);
                    names.push(str);
                    namesOffset += 2 + str.length;
                }
            }
        } catch (e) {
            this.log.error("Failed to parse media announcement names:", e);
        }

        // SHA1 hashes
        for (let i = 0; i < names.length; i++) {
            if (offset + 20 > dv.byteLength) break;

            const sha1Arr = new Array<number>(20);
            for (let j = 0; j < 20; j++) {
                sha1Arr[j] = dv.getUint8(offset + j);
            }
            offset += 20;

            const sha1Hex = sha1Arr.map((b) => b.toString(16).padStart(2, "0")).join("");

            this.files.push({
                name: names[i],
                sha1: sha1Hex,
            });
        }

        // Remote servers
        if (offset < dv.byteLength) {
            try {
                if (offset + 2 <= dv.byteLength) {
                    const serverListStr = ph.getString(offset);
                    if (serverListStr) {
                        this.remoteServers = serverListStr
                            .split(",")
                            .map((s) => s.trim())
                            .filter((s) => s.length > 0);
                    }
                }
            } catch (e) {
                this.log.error("Error parsing remote servers:", e);
            }
        }
    }
}