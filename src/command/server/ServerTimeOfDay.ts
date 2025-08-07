import { ServerCommand } from "../ServerCommand.js"

export class ServerTimeOfDay implements ServerCommand {
    time_speed = 0
    time_of_day = 0

    unmarshalPacket(dv: DataView): void {
        const t = dv.getUint16(0)
        this.time_of_day = t % 24000

        this.time_speed = dv.getFloat32(2)
    }
}