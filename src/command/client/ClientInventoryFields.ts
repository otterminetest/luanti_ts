import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

/**
 * Sent when a button is pressed or fields are submitted in an inventory formspec.
 * Opcode: TOSERVER_INVENTORY_FIELDS (0x3c)
 */
export class ClientInventoryFields implements ClientCommand {
    constructor(
        public formname: string,
        public fields: Map<string, string>,
    ) {}

    getCommandID(): number {
        return 0x3c;
    }

    marshalPacket(): Uint8Array {
        // Calculate size:
        // formname (u16 + len)
        // count (u16)
        // fields (u16 + k_len + u32 + v_len) * count
        let size = 2 + this.formname.length + 2;
        for (const [k, v] of this.fields) {
            size += 2 + k.length + 4 + v.length;
        }

        const pb = new PayloadBuilder(size);
        pb.appendString(this.formname);
        pb.appendUint16(this.fields.size);

        for (const [k, v] of this.fields) {
            pb.appendString(k);
            pb.appendLongString(v);
        }

        return pb.toUint8Array();
    }
}
