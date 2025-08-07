import { Pos, PosType } from  "../../util/pos.js";
import { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

export class ClientPlayerPos implements ClientCommand {

    constructor(public pos: Pos<PosType.Entity>) {}

    getCommandID(): number {
        return 0x23
    }

    marshalPacket(): Uint8Array {
        const pb = new PayloadBuilder(38)
        //note: player-position and speed are scaled up by x1000

        //position
        pb.appendUint32(this.pos.x * 1000)
        pb.appendUint32(this.pos.y * 1000)
        pb.appendUint32(this.pos.z * 1000)

        //speed
        pb.appendUint32(0)
        pb.appendUint32(0)
        pb.appendUint32(0)

        pb.appendFloat32(500) //pitch
        pb.appendFloat32(6000) //yaw
        pb.appendUint32(0) //pressed keys
        pb.appendUint8(131) //fov
        pb.appendUint8(17) //requested view range

        return pb.toUint8Array()
    }

}