import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

/**
 * Sent to request a respawn.
 * Opcode: TOSERVER_RESPAWN_LEGACY (0x38)
 */
export class ClientRespawn implements ClientCommand {
    getCommandID(): number {
        return 0x38;
    }

    marshalPacket(): Uint8Array {
        return new Uint8Array(0);
    }
}
