import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerSetSun implements ServerCommand {
    visible!: boolean;
    texture!: string;
    tonemap!: string;
    sunrise!: string;
    sunriseVisible!: boolean;
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
        this.sunrise = ph.getString(offset);
        offset += 2 + this.sunrise.length;
        this.sunriseVisible = ph.getBool(offset);
        offset += 1;
        this.scale = dv.getFloat32(offset);
    }
}
