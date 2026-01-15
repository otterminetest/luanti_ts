import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerCloudParams implements ServerCommand {
    density!: number;
    colorBright!: number;
    colorAmbient!: number;
    height!: number;
    thickness!: number;
    speed!: { x: number; y: number };
    colorShadow?: number;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        this.density = dv.getFloat32(offset);
        offset += 4;
        this.colorBright = dv.getUint32(offset);
        offset += 4;
        this.colorAmbient = dv.getUint32(offset);
        offset += 4;
        this.height = dv.getFloat32(offset);
        offset += 4;
        this.thickness = dv.getFloat32(offset);
        offset += 4;
        this.speed = ph.getV2F(offset);
        offset += 8;

        if (offset + 4 <= dv.byteLength) {
            this.colorShadow = dv.getUint32(offset);
        }
    }
}
