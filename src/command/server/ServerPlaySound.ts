import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerPlaySound implements ServerCommand {
    serverId!: number;
    name!: string;
    gain!: number;
    type!: number;
    pos!: { x: number; y: number; z: number };
    objectId!: number;
    loop!: boolean;

    // Optional
    fade?: number;
    pitch?: number;
    ephemeral?: boolean;
    startTime?: number;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        this.serverId = dv.getInt32(offset);
        offset += 4;
        this.name = ph.getString(offset);
        offset += 2 + this.name.length;
        this.gain = dv.getFloat32(offset);
        offset += 4;
        this.type = dv.getUint8(offset);
        offset += 1;

        const rawPos = ph.getV3F(offset);
        // C++: pos *= 1.0f/BS; (BS = 10.0)
        this.pos = { x: rawPos.x / 10.0, y: rawPos.y / 10.0, z: rawPos.z / 10.0 };
        offset += 12;

        this.objectId = dv.getUint16(offset);
        offset += 2;
        this.loop = dv.getUint8(offset) !== 0;
        offset += 1;

        if (offset < dv.byteLength) {
            try {
                this.fade = dv.getFloat32(offset);
                offset += 4;
                this.pitch = dv.getFloat32(offset);
                offset += 4;
                this.ephemeral = dv.getUint8(offset) !== 0;
                offset += 1;
                this.startTime = dv.getFloat32(offset);
                offset += 4;
            } catch (e) {}
        }
    }
}
