import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerChatMessage implements ServerCommand {
    message = "";

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        this.message = ph.getWideString(4);
    }
}
