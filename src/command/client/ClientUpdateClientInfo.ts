import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

/**
 * Sent to update the server on client resolution and settings.
 * Opcode: TOSERVER_UPDATE_CLIENT_INFO (0x53)
 */
export class ClientUpdateClientInfo implements ClientCommand {
    constructor(
        public renderTargetWidth: number,
        public renderTargetHeight: number,
        public guiScaling: number,
        public hudScaling: number,
        public maxFormspecWidth: number,
        public maxFormspecHeight: number,
        public touchControls: boolean,
    ) {}

    getCommandID(): number {
        return 0x53;
    }

    marshalPacket(): Uint8Array {
        // Size: u32(4)*2 + f32(4)*4 + u8(1) = 25 bytes
        const pb = new PayloadBuilder(25);
        pb.appendUint32(this.renderTargetWidth);
        pb.appendUint32(this.renderTargetHeight);
        pb.appendFloat32(this.guiScaling);
        pb.appendFloat32(this.hudScaling);
        pb.appendFloat32(this.maxFormspecWidth);
        pb.appendFloat32(this.maxFormspecHeight);
        pb.appendBool(this.touchControls);
        return pb.toUint8Array();
    }
}
