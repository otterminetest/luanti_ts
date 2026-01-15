import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerSetStars implements ServerCommand {
    visible!: boolean;
    count!: number;
    color!: number;
    scale!: number;
    dayOpacity?: number;
    starSeed?: number;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        this.visible = ph.getBool(offset);
        offset += 1;
        this.count = dv.getUint32(offset);
        offset += 4;
        this.color = dv.getUint32(offset);
        offset += 4;
        this.scale = dv.getFloat32(offset);
        offset += 4;

        if (offset + 4 <= dv.byteLength) {
            this.dayOpacity = dv.getFloat32(offset);
            offset += 4;
        }
        if (offset + 4 <= dv.byteLength) {
            this.starSeed = dv.getUint32(offset);
            offset += 4;
        }
    }
}
