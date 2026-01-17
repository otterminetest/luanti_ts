import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

/**
 * Sent to inform server of removed sounds.
 * Opcode: TOSERVER_REMOVED_SOUNDS (0x3a)
 */
export class ClientRemovedSounds implements ClientCommand {
    constructor(public soundIds: number[]) {}

    getCommandID(): number {
        return 0x3a;
    }

    marshalPacket(): Uint8Array {
        // u16 count + s32 * count
        const count = Math.min(this.soundIds.length, 65535);
        const pb = new PayloadBuilder(2 + count * 4);

        pb.appendUint16(count);

        for (let i = 0; i < count; i++) {
            pb.appendInt32(this.soundIds[i]);
        }

        return pb.toUint8Array();
    }
}
