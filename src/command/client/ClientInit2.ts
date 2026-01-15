import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

export class ClientInit2 implements ClientCommand {
    constructor(public lang = "en") {}

    getCommandID(): number {
        return 0x11;
    }
    marshalPacket(): Uint8Array {
        // Server checks: if (pkt->getSize() > 0) *pkt >> lang;
        const pb = new PayloadBuilder(2 + this.lang.length);
        pb.appendString(this.lang);
        return pb.toUint8Array();
    }
}
