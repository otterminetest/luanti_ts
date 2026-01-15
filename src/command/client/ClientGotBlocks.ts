import type { Pos, PosType } from "../../util/pos.js";
import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

export class ClientGotBlocks implements ClientCommand {
    constructor(public blocks: Array<Pos<PosType.Mapblock>>) {}

    getCommandID(): number {
        return 0x24;
    }
    marshalPacket(): Uint8Array {
        const pb = new PayloadBuilder(1 + 6 * this.blocks.length);
        pb.appendUint8(this.blocks.length);

        for (const p of this.blocks) {
            // MapBlock positions are signed 16-bit integers (v3s16)
            pb.appendInt16(p.x);
            pb.appendInt16(p.y);
            pb.appendInt16(p.z);
        }

        return pb.toUint8Array();
    }
}
