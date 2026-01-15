import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerDetachedInventory implements ServerCommand {
    name!: string;
    keepInventory!: boolean;
    inventoryData?: string;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        this.name = ph.getString(offset);
        offset += 2 + this.name.length;

        this.keepInventory = ph.getBool(offset);
        offset += 1;

        // Skip 2 bytes (legacy length field)
        offset += 2;

        if (this.keepInventory && offset < dv.byteLength) {
            // Remaining bytes are the inventory serialized string
            const buf = new Uint8Array(dv.buffer, dv.byteOffset + offset);
            this.inventoryData = new TextDecoder("utf-8").decode(buf);
        }
    }
}
