import type { Pos, PosType } from "../../util/pos.js";
import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

/**
 * Sent when a button is pressed or fields are submitted in a Node's formspec.
 * Opcode: TOSERVER_NODEMETA_FIELDS (0x3b)
 */
export class ClientNodemetaFields implements ClientCommand {
    constructor(
        public pos: Pos<PosType.Node>,
        public formname: string,
        public fields: Map<string, string>,
    ) {}

    getCommandID(): number {
        return 0x3b;
    }

    marshalPacket(): Uint8Array {
        // Calculate size:
        // pos (6)
        // formname (u16 + len)
        // count (u16)
        // fields (u16 + k_len + u32 + v_len) * count
        let size = 6 + 2 + this.formname.length + 2;
        for (const [k, v] of this.fields) {
            size += 2 + k.length + 4 + v.length;
        }

        const pb = new PayloadBuilder(size);
        pb.appendInt16(this.pos.x);
        pb.appendInt16(this.pos.y);
        pb.appendInt16(this.pos.z);
        pb.appendString(this.formname);
        pb.appendUint16(this.fields.size);

        for (const [k, v] of this.fields) {
            pb.appendString(k);
            pb.appendLongString(v);
        }

        return pb.toUint8Array();
    }
}
