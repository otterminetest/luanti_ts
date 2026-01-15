import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerOverrideDayNightRatio implements ServerCommand {
    doOverride!: boolean;
    ratio!: number;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        this.doOverride = ph.getBool(0);
        // ratio sent as u16 (0-65535), representing 0.0 - 1.0
        this.ratio = dv.getUint16(1) / 65536.0;
    }
}
