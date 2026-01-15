import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export enum HudParam {
    HotbarItemCount = 0,
    HudElemSelectionBox = 1,
    HotbarSelectedImage = 2,
    CloudParams = 3, // Deprecated in favor of 0x54
}

export class ServerHudSetParam implements ServerCommand {
    param!: HudParam;
    value!: string;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        // C++: *pkt >> param >> value;
        // param is u16
        this.param = dv.getUint16(0);
        // value is String (u16 len + chars), starts at offset 2
        this.value = ph.getString(2);
    }
}
