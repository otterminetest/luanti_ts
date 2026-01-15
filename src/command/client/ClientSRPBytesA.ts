import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

export class ClientSRPBytesA implements ClientCommand {
    constructor(public bytesA: number[]) {}

    getCommandID(): number {
        return 0x51;
    }

    marshalPacket(): Uint8Array {
        const p = new PayloadBuilder(2 + this.bytesA.length + 1);
        p.appendArray(this.bytesA);
        p.appendUint8(0x01);
        return p.toUint8Array();
    }
}
