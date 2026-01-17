import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

/**
 * Sent to perform an inventory action (Move, Drop, Craft).
 * Opcode: TOSERVER_INVENTORY_ACTION (0x31)
 */
export class ClientInventoryAction implements ClientCommand {
    /**
     * @param actionString The serialized action string.
     * Examples:
     * - Move: "Move <inv_from> <list_from> <index_from> <inv_to> <list_to> <index_to> <count>"
     * - Drop: "Drop <inv_from> <list_from> <index_from> <count>"
     * - Craft: "Craft <count>"
     */
    constructor(public actionString: string) {}

    getCommandID(): number {
        return 0x31;
    }

    marshalPacket(): Uint8Array {
        const pb = new PayloadBuilder(this.actionString.length);
        pb.appendRawString(this.actionString);
        return pb.toUint8Array();
    }
}
