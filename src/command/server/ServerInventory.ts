import { Inventory } from "../../inventory/Inventory.js";
import type { ServerCommand } from "../ServerCommand.js";

export class ServerInventory implements ServerCommand {
    inventoryString!: string;

    // The parsed result.
    // Note: If the packet contains "KeepList", this parsed object will have empty/missing lists
    // for those kept entries because this object doesn't know previous state.
    // Ideally, pass this.inventoryString to a persistent Client.inventory.deSerialize().
    parsedInventory?: Inventory;

    unmarshalPacket(dv: DataView): void {
        // The packet contains the raw serialized inventory string, not a length-prefixed string.
        const buf = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
        this.inventoryString = new TextDecoder("utf-8").decode(buf);

        // Auto-parse for convenience
        this.parsedInventory = new Inventory();
        try {
            this.parsedInventory.deSerialize(this.inventoryString);
        } catch (e) {
            console.error("Error parsing inventory string:", e);
        }
    }
}
