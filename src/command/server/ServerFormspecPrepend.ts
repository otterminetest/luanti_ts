import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerFormspecPrepend implements ServerCommand {
    prepend!: string;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        this.prepend = ph.getString(0);
    }
}
