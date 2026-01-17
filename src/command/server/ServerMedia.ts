import { decompress } from "fzstd";
import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export interface MediaFileData {
    name: string;
    data: Uint8Array;
}

export class ServerMedia implements ServerCommand {
    numBunches!: number;
    bunchIndex!: number;
    files: MediaFileData[] = [];

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        try {
            this.numBunches = dv.getUint16(offset);
            offset += 2;
            this.bunchIndex = dv.getUint16(offset);
            offset += 2;
            const numFiles = dv.getUint32(offset);
            offset += 4;

            // Debug first packet to ensure structure is standard
            if (this.bunchIndex === 0) {
                console.debug(
                    `[ServerMedia] Bunch 0/${this.numBunches}, containing ${numFiles} files.`,
                );
            }

            for (let i = 0; i < numFiles; i++) {
                const name = ph.getString(offset);
                offset += 2 + name.length;

                const dataLen = dv.getUint32(offset);
                offset += 4;

                if (offset + dataLen > dv.byteLength) {
                    console.error(`[ServerMedia] Error: Data length overflow for file ${name}.`);
                    break;
                }

                const rawData = new Uint8Array(dv.buffer, dv.byteOffset + offset, dataLen);
                offset += dataLen;

                let data: Uint8Array;
                try {
                    data = decompress(rawData);
                } catch (e) {
                    // Fallback for non-compressed legacy or raw data
                    data = rawData;
                }

                this.files.push({ name, data });
            }
        } catch (e) {
            console.error("[ServerMedia] Parse error:", e);
            // Dump header for debugging
            const header = [];
            for (let i = 0; i < Math.min(16, dv.byteLength); i++)
                header.push(dv.getUint8(i).toString(16).padStart(2, "0"));
            console.debug("[ServerMedia] Header dump:", header.join(" "));
        }
    }
}
