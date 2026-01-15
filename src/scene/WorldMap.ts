import { EventEmitter } from "node:events";
import type TypedEventEmitter from "typed-emitter";
import type { BlockData } from "../block/blockdata.js";
import { parseBlock } from "../block/blockparser.js";
import type { CommandClient } from "../command/CommandClient.js";
import { ServerBlockData } from "../command/server/ServerBlockData.js";
import type { NodeDefinition } from "../nodedefs/NodeDefinition.js";
import { type Pos, type PosType, getNodeRegion, toMapblock } from "../util/pos.js";

export type WorldMapEvents = {
    BlockAdded: (b: BlockData) => void;
    //TODO BlockRemoved
};

export class WorldMap {
    // TODO: block cleanup / TTL
    readonly blocks = new Map<string, BlockData>();

    readonly events = new EventEmitter() as TypedEventEmitter<WorldMapEvents>;

    constructor(
        cc: CommandClient,
        public nodedefs: Map<number, NodeDefinition>,
    ) {
        cc.events.addListener("ServerCommand", (cmd) => {
            if (cmd instanceof ServerBlockData) {
                const block = parseBlock(cmd.data, cmd.pos);
                this.blocks.set(cmd.pos.toString(), block);
                console.debug(`Got block: ${cmd.pos}`, block.blockMapping);
                this.events.emit("BlockAdded", block);
            }
        });
    }

    getNodeID(pos: Pos<PosType.Node>): number | undefined {
        const bp = toMapblock(pos);
        const [min] = getNodeRegion(bp);

        const block = this.blocks.get(bp.toString());
        if (!block) {
            return;
        }

        // node-position inside the block
        const intra_pos = pos.subtract(min);
        const nodeid = block.getNodeID(intra_pos);
        return nodeid;
    }

    getNode(pos: Pos<PosType.Node>): WorldNode | undefined {
        const nodeid = this.getNodeID(pos);
        if (!nodeid) {
            return;
        }

        const nodedef = this.nodedefs.get(nodeid);
        if (!nodedef) {
            return;
        }

        return {
            pos: pos,
            nodeid: nodeid,
            nodedef: nodedef,
        };
    }

    getBlock(pos: Pos<PosType.Mapblock>): BlockData | undefined {
        return this.blocks.get(pos.toString());
    }
}

export interface WorldNode {
    readonly pos: Pos<PosType.Node>;
    readonly nodeid: number;
    readonly nodedef: NodeDefinition;
}
