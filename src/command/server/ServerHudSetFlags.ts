import type { ServerCommand } from "../ServerCommand.js";

export class ServerHudSetFlags implements ServerCommand {
    flags!: number;
    mask!: number;

    unmarshalPacket(dv: DataView): void {
        this.flags = dv.getUint32(0);
        this.mask = dv.getUint32(4);
    }
}
