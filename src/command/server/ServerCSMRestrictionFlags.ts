import type { ServerCommand } from "../ServerCommand.js";

export class ServerCSMRestrictionFlags implements ServerCommand {
    flags!: number;
    range!: number;

    unmarshalPacket(dv: DataView): void {
        this.flags = dv.getUint32(0);
        this.range = dv.getUint32(4);
    }
}
