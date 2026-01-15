import type { ServerCommand } from "../ServerCommand.js";

export class ServerAuthAccept implements ServerCommand {
    public posX!: number;
    public posY!: number;
    public posZ!: number;
    public seed!: string;
    public sendInterval!: number;

    unmarshalPacket(dv: DataView): void {
        this.posX = dv.getFloat32(0) / 10;
        this.posY = dv.getFloat32(4) / 10;
        this.posZ = dv.getFloat32(8) / 10;
        this.seed = dv.getBigUint64(12).toString();
        this.sendInterval = dv.getFloat32(20);
    }
}
