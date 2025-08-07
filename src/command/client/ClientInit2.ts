import { ClientCommand } from "../ClientCommand.js";

export class ClientInit2 implements ClientCommand {
    getCommandID(): number {
        return 0x11
    }
    marshalPacket(): Uint8Array {
        return new Uint8Array(2)
    }

}