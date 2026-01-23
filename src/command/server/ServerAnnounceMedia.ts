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

            // A: Standard Interleaved [Len, String, Len, String...]
            // B: Split Arrays [Len, Len, Len...] followed by [String, String, String...]

            // Check if the first "String" looks like a sequence of valid lengths
            // If we interpret the first bytes as a string of length L, and that string contains
            // binary data that looks like lengths, switch to Strategy B.

            const probeLen = namesDv.getUint16(namesOffset);
            let useSplitLayout = false;

            // Probe: If the "string data" starts with 0x00 and a reasonable length byte (e.g. < 100),
            if (namesOffset + 2 + probeLen <= namesDv.byteLength) {
                if (probeLen > 0 && probeLen % 2 === 0) {
                    const firstByte = namesDv.getUint8(namesOffset + 2);
                    const secondByte = namesDv.getUint8(namesOffset + 3);
                    if (firstByte === 0 && secondByte > 0 && secondByte < 100) {
                        useSplitLayout = true;
                    }
                }
            }

            if (useSplitLayout) {
                // Strategy B: Read all lengths first
                const lengths: number[] = [];
                // We already read the first length in 'probeLen' but didn't advance offset for it yet
                // Reset to start of lengths
                let lenOffset = namesOffset;

                for (let i = 0; i < count; i++) {
                    lengths.push(namesDv.getUint16(lenOffset));
                    lenOffset += 2;
                }

                // Now read strings based on lengths
                let strOffset = lenOffset;
                for (let i = 0; i < count; i++) {
                    const len = lengths[i];
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
