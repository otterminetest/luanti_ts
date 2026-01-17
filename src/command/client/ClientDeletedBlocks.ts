import type { Pos, PosType } from "../../util/pos.js";
import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

/**
 * Sent to inform server of unloaded blocks.
 * Opcode: TOSERVER_DELETEDBLOCKS (0x25)
 */
export class ClientDeletedBlocks implements ClientCommand {
    constructor(public blocks: Array<Pos<PosType.Mapblock>>) {}

    getCommandID(): number {
        return 0x25;
    }

    marshalPacket(): Uint8Array {
        // u8 count + v3s16 * count
        const count = Math.min(this.blocks.length, 255);
        const pb = new PayloadBuilder(1 + count * 6);

        pb.appendUint8(count);

        for (let i = 0; i < count; i++) {
            pb.appendInt16(this.blocks[i].x);
            pb.appendInt16(this.blocks[i].y);
            pb.appendInt16(this.blocks[i].z);
        }

        return pb.toUint8Array();
    }
}
