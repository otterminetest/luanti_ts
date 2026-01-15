import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

export class ClientChat implements ClientCommand {
    constructor(public message: string) {}

    getCommandID(): number {
        return 0x32; // TOSERVER_CHAT_MESSAGE
    }

    marshalPacket(): Uint8Array {
        // Message is sent as WideString (u16 len + utf16 chars)
        const len = this.message.length;
        const pb = new PayloadBuilder(2 + len * 2);
        pb.appendUint16(len);
        for (let i = 0; i < len; i++) {
            pb.appendUint16(this.message.charCodeAt(i));
        }
        return pb.toUint8Array();
    }
}
