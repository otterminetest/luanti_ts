import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerMediaPush implements ServerCommand {
    digest!: string;
    filename!: string;
    cached!: boolean;
    token?: number;
    data?: Uint8Array;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        // raw_hash (20 bytes)
        const hashBytes = new Uint8Array(dv.buffer, dv.byteOffset + offset, 20);
        this.digest = [...hashBytes].map((b) => b.toString(16).padStart(2, "0")).join("");
        offset += 20;

        this.filename = ph.getString(offset);
        offset += 2 + this.filename.length;

        this.cached = ph.getBool(offset);
        offset += 1;

        const remaining = dv.byteLength - offset;

        // Protocol >= 40 sends a single u32 token (4 bytes).
        // Older protocols send a LongString (u32 length + bytes).
        if (remaining === 4) {
            this.token = dv.getUint32(offset);
            offset += 4;
        } else if (remaining >= 4) {
            // Check if it matches the structure of a LongString
            const dataLen = dv.getUint32(offset);
            if (dataLen + 4 <= remaining) {
                // Legacy inline data
                offset += 4;
                // Create a copy or view of the data
                this.data = new Uint8Array(dv.buffer, dv.byteOffset + offset, dataLen);
                offset += dataLen;
            }
        }
    }
}
