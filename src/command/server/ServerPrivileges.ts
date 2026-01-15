import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerPrivileges implements ServerCommand {
    privileges = new Array<string>();

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        this.privileges = ph.getStringArray(0);
    }
}
