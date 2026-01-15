import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerPlayerSpeed implements ServerCommand {
    addedVel: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        this.addedVel = ph.getV3F(0);
    }
}
