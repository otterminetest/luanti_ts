import { ServerCommand } from "../ServerCommand.js";

export class ServerMovePlayer implements ServerCommand {
    posX = 0
    posY = 0
    posZ = 0
    pitch = 0
    yaw = 0

    unmarshalPacket(dv: DataView): void {
        this.posX = dv.getFloat32(0) / 10;
        this.posY = dv.getFloat32(4) / 10;
        this.posZ = dv.getFloat32(8) / 10;
        this.pitch = dv.getFloat32(12);
        this.yaw = dv.getFloat32(16);
    }
}