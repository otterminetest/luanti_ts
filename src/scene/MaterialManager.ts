import type { MediaManager } from "../media/MediaManager.js";
import type { NodeDefinition } from "../nodedefs/NodeDefinition.js";
import { Directions, type Pos, type PosType } from "../util/pos.js";

export class MaterialManager {
    constructor(
        private nodedefs: Map<number, NodeDefinition>,
        private mm: MediaManager,
    ) {}

    getKey(nodeid: number, direction: Pos<PosType.Node>): string {
        return `${nodeid}/${direction}`;
    }

    getTileIndex(direction: Pos<PosType.Node>): number {
        switch (direction) {
            case Directions.Y_POS:
                return 0;
            case Directions.Y_NEG:
                return 1;
            case Directions.X_POS:
                return 2;
            case Directions.X_NEG:
                return 3;
            case Directions.Z_POS:
                return 4;
            case Directions.Z_NEG:
                return 5;
        }
        // default
        return 0;
    }
}
