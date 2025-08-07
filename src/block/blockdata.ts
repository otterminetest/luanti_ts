import { Pos, PosType } from "../util/pos.js"

export class BlockData {

    constructor(public pos: Pos<PosType.Mapblock>){}

    underground = false
    dayNightDiff = false
    generated = false

    lightingComplete = 0

    contentWidth = 0
    paramsWidth = 0

    mapNodes = new Array<number>
    blockMapping = new Map<number, boolean>()

    getNodeID(pos: Pos<PosType.Node>): number {
        return this.mapNodes[this.getNodePos(pos)]
    }

    // TODO: param1/2 and metadata

    getNodePos(pos: Pos<PosType.Node>): number {
        return pos.x + (pos.y * 16) + (pos.z * 256);
    }
}