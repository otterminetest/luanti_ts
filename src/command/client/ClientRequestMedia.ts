import { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

export class ClientRequestMedia implements ClientCommand {

    names = new Array<string>

    getCommandID() {
        return 0x40;
    }

    marshalPacket(): Uint8Array {
        let name_size = 0
        this.names.forEach(n => name_size += n.length + 2)

        const pb = new PayloadBuilder(2 + name_size);
        pb.appendUint16(this.names.length);
        this.names.forEach(n => pb.appendString(n));
        return pb.toUint8Array();
    }
}