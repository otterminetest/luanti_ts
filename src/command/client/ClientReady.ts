import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

export class ClientReady implements ClientCommand {
    versionMajor = 5;
    versionMinor = 7;
    versionPatch = 0;
    fullVersion = "";
    formspecVersion = 4;

    getCommandID(): number {
        return 0x43;
    }

    marshalPacket(): Uint8Array {
        const pb = new PayloadBuilder(6 + 2 + this.fullVersion.length);
        pb.appendUint8(this.versionMajor);
        pb.appendUint8(this.versionMinor);
        pb.appendUint8(this.versionPatch);
        pb.appendUint8(0);
        pb.appendString(this.fullVersion);
        pb.appendUint16(this.formspecVersion);

        return pb.toUint8Array();
    }
}
