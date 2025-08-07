import { Pos, PosType } from  "../../util/pos.js";
import { ServerCommand } from "../ServerCommand.js";

export class ServerBlockData implements ServerCommand {

    pos!: Pos<PosType.Mapblock>
    data!: Uint8Array

    unmarshalPacket(dv: DataView): void {
        this.pos = new Pos(dv.getInt16(0), dv.getInt16(2), dv.getInt16(4))
        this.data = new Uint8Array(dv.buffer.slice(dv.byteOffset+6))
    }

}