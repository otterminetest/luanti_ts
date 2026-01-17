import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

export class ClientRequestMedia implements ClientCommand {
    constructor(public fileNames: string[]) {}

    getCommandID(): number {
        return 0x40; // TOSERVER_REQUEST_MEDIA
    }

    marshalPacket(): Uint8Array {
        // Calculate strict byte size
        // u16 count
        let size = 2;
        const encoder = new TextEncoder();

        for (const s of this.fileNames) {
            // u16 len + bytes
            size += 2 + encoder.encode(s).length;
        }

        const pb = new PayloadBuilder(size);
        pb.appendUint16(this.fileNames.length);

        for (const s of this.fileNames) {
            pb.appendString(s);
        }

        return pb.toUint8Array();
    }
}
