import { Client } from "../Client.js";
import { WorldMap } from "./WorldMap.js";
import { Pos, PosType } from "../util/pos.js";
import { ServerMovePlayer } from "../command/server/ServerMovePlayer.js";
import { ClientPlayerPos } from "../command/client/ClientPlayerPos.js";
import { PacketType } from "../command/packet/types.js";
import { ClientGotBlocks } from "../command/client/ClientGotBlocks.js";



export class Scene {

    pos = new Pos<PosType.Entity>(0, 0, 0)

    constructor(public client: Client, public wm: WorldMap) {
        wm.events.on("BlockAdded", b => {
            const gotblocks = new ClientGotBlocks([b.pos])
            client.cc.sendCommand(gotblocks, PacketType.Original)
        })

        client.cc.events.on("ServerCommand", cmd => {
            if (cmd instanceof ServerMovePlayer) {
                console.log(new Pos<PosType.Entity>(cmd.posX, cmd.posY, cmd.posZ))
            }
        })

        client.events.on("Tick", c => {
            // XXX: move forward 1m/s
            //this.pos = this.pos.add(new Pos<PosType.Entity>(1, 0, 0))
            c.cc.sendCommand(new ClientPlayerPos(this.pos), PacketType.Original)
        })

        client.events.on("PlayerMove", p => {
            console.log("playermove", p)
            this.pos = p
        })
    }
}