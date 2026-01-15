import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

export class ClientSRPBytesM implements ClientCommand {
    constructor(public bytesM: number[]) {}

    getCommandID(): number {
        return 0x52;
    }

    marshalPacket(): Uint8Array {
        const p = new PayloadBuilder(2 + this.bytesM.length + 1);
        p.appendArray(this.bytesM);
        p.appendUint8(0x01);
        return p.toUint8Array();
    }
}
