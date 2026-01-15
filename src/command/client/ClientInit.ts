import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

export class ClientInit implements ClientCommand {
    // https://github.com/minetest/minetest/blob/master/src/serialization.h#L66
    clientMax = 29; // SER_FMT_VER_HIGHEST_READ
    // unused: https://github.com/minetest/minetest/blob/master/src/network/serverpackethandler.cpp#L100
    supportedCompressionModes = 0;
    // https://github.com/minetest/minetest/blob/master/src/network/networkprotocol.h#L208
    minNetProtoVersion = 37;
    maxNetProtoVersion = 51;

    constructor(public playername: string) {}

    getCommandID(): number {
        return 0x02;
    }

    marshalPacket(): Uint8Array {
        const p = new PayloadBuilder(7 + 2 + this.playername.length);
        p.appendUint8(this.clientMax);
        p.appendUint16(this.supportedCompressionModes);
        p.appendUint16(this.minNetProtoVersion);
        p.appendUint16(this.maxNetProtoVersion);
        p.appendString(this.playername);
        return p.toUint8Array();
    }
}
