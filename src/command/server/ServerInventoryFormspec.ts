import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerInventoryFormspec implements ServerCommand {
    formspec!: string;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        // C++ uses readLongString()
        this.formspec = ph.getLongString(0);
    }
}
