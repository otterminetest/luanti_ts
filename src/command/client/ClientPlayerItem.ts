import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

/**
 * Sent to change selected item in the hotbar.
 * Opcode: TOSERVER_PLAYERITEM (0x37)
 */
export class ClientPlayerItem implements ClientCommand {
    constructor(public itemIndex: number) {}

    getCommandID(): number {
        return 0x37;
    }

    marshalPacket(): Uint8Array {
        const pb = new PayloadBuilder(2);
        pb.appendUint16(this.itemIndex);
        return pb.toUint8Array();
    }
}
