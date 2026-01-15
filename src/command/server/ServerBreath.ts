import type { ServerCommand } from "../ServerCommand.js";

export class ServerBreath implements ServerCommand {
    breath!: number;

    unmarshalPacket(dv: DataView): void {
        this.breath = dv.getUint16(0);
    }
}
