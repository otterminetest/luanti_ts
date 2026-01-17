import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

/**
 * Sent to report damage taken by the player.
 * Opcode: TOSERVER_DAMAGE (0x35)
 */
export class ClientDamage implements ClientCommand {
    constructor(public amount: number) {}

    getCommandID(): number {
        return 0x35;
    }

    marshalPacket(): Uint8Array {
        const pb = new PayloadBuilder(2); // usually u8, but C++ uses u16 in packet read
        // C++: pkt << damage (u16)
        pb.appendUint16(this.amount);
        return pb.toUint8Array();
    }
}
