import type { Pos, PosType } from "../../util/pos.js";
import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";
import { ClientPlayerPos, type PlayerPosOptions } from "./ClientPlayerPos.js";

export enum InteractAction {
    StartDig = 0,
    StopDig = 1,
    Dig = 2,
    Place = 3,
    Use = 4,
    Activate = 5,
}

export enum PointedThingType {
    Nothing = 0,
    Node = 1,
    Object = 2,
}

export type PointedThing =
    | { type: PointedThingType.Nothing }
    | { type: PointedThingType.Node; under: Pos<PosType.Node>; above: Pos<PosType.Node> }
    | { type: PointedThingType.Object; id: number };

export class ClientInteract implements ClientCommand {
    playerState: ClientPlayerPos;

    constructor(
        public action: InteractAction,
        public itemIndex: number,
        public pointed: PointedThing,
        playerOptions: PlayerPosOptions,
    ) {
        // Create a full state object from the options provided
        this.playerState = new ClientPlayerPos(playerOptions);
    }

    getCommandID(): number {
        return 0x39; // TOSERVER_INTERACT
    }

    marshalPacket(): Uint8Array {
        // 1. Serialize PointedThing to a temp buffer
        const ptBuilder = new PayloadBuilder(100);
        ptBuilder.appendUint8(this.pointed.type);
        if (this.pointed.type === PointedThingType.Node) {
            ptBuilder.appendInt16(this.pointed.under.x);
            ptBuilder.appendInt16(this.pointed.under.y);
            ptBuilder.appendInt16(this.pointed.under.z);
            ptBuilder.appendInt16(this.pointed.above.x);
            ptBuilder.appendInt16(this.pointed.above.y);
            ptBuilder.appendInt16(this.pointed.above.z);
        } else if (this.pointed.type === PointedThingType.Object) {
            ptBuilder.appendInt16(this.pointed.id);
        }
        const ptData = ptBuilder.toUint8Array().slice(0, ptBuilder.index);

        // 2. Build Main Packet
        // Base size: u8 action(1) + u16 item(2) + u32 plen(4) + ptData + playerPos(47)
        const pb = new PayloadBuilder(1 + 2 + 4 + ptData.length + 47);

        pb.appendUint8(this.action);
        pb.appendUint16(this.itemIndex);

        // "LongString" format: u32 length + bytes
        pb.appendUint32(ptData.length);
        for (let i = 0; i < ptData.length; i++) {
            pb.appendUint8(ptData[i]);
        }

        // 3. Append Player Pos using shared logic
        ClientPlayerPos.appendPlayerPos(pb, this.playerState);

        return pb.toUint8Array();
    }
}
