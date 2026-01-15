import type { ServerCommand } from "../ServerCommand.js";

export class ServerMovement implements ServerCommand {
    accelDefault!: number;
    accelAir!: number;
    accelFast!: number;
    speedWalk!: number;
    speedCrouch!: number;
    speedFast!: number;
    speedClimb!: number;
    speedJump!: number;
    liquidFluidity!: number;
    liquidFluiditySmooth!: number;
    liquidSink!: number;
    gravity!: number;

    unmarshalPacket(dv: DataView): void {
        // 12 floats
        let o = 0;
        this.accelDefault = dv.getFloat32(o);
        o += 4;
        this.accelAir = dv.getFloat32(o);
        o += 4;
        this.accelFast = dv.getFloat32(o);
        o += 4;
        this.speedWalk = dv.getFloat32(o);
        o += 4;
        this.speedCrouch = dv.getFloat32(o);
        o += 4;
        this.speedFast = dv.getFloat32(o);
        o += 4;
        this.speedClimb = dv.getFloat32(o);
        o += 4;
        this.speedJump = dv.getFloat32(o);
        o += 4;
        this.liquidFluidity = dv.getFloat32(o);
        o += 4;
        this.liquidFluiditySmooth = dv.getFloat32(o);
        o += 4;
        this.liquidSink = dv.getFloat32(o);
        o += 4;
        this.gravity = dv.getFloat32(o);
        o += 4;
    }
}
