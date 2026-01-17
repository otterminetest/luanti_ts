import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

/**
 * Sent to acknowledge media files received.
 * Opcode: TOSERVER_HAVE_MEDIA (0x41)
 */
export class ClientHaveMedia implements ClientCommand {
    constructor(public tokens: number[]) {}

    getCommandID(): number {
        return 0x41;
    }

    marshalPacket(): Uint8Array {
        // u8 count + u32 * count
        const pb = new PayloadBuilder(1 + this.tokens.length * 4);

        // Safety clamp to 255 as per protocol u8 limit
        const count = Math.min(this.tokens.length, 255);
        pb.appendUint8(count);

        for (let i = 0; i < count; i++) {
            pb.appendUint32(this.tokens[i]);
        }

        return pb.toUint8Array();
    }
}
