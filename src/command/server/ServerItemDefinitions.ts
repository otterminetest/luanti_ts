import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerItemDefinitions implements ServerCommand {
    data!: Uint8Array;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        this.data = ph.getLongStringData(0);
    }
}
