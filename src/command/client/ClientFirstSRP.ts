import { PayloadBuilder } from "../packet/PayloadBuilder.js";
import { ClientCommand } from "../ClientCommand.js";

export class ClientFirstSRP implements ClientCommand {

    constructor(public salt: number[], public verificationKey: number[]) {}

    getCommandID(): number {
        return 0x50;
    }

    marshalPacket(): Uint8Array {
        const p = new PayloadBuilder(2 + this.salt.length + 2 + this.verificationKey.length + 1);
        p.appendArray(this.salt)
        p.appendArray(this.verificationKey)
        p.appendUint8(0)
        return p.toUint8Array();
    }

}