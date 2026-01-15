import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerSetMoon implements ServerCommand {
    visible!: boolean;
    texture!: string;
    tonemap!: string;
    scale!: number;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        this.visible = ph.getBool(offset);
        offset += 1;
        this.texture = ph.getString(offset);
        offset += 2 + this.texture.length;
        this.tonemap = ph.getString(offset);
        offset += 2 + this.tonemap.length;
        this.scale = dv.getFloat32(offset);
    }
}
