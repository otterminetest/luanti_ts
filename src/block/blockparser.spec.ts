import { Pos, type PosType } from "../util/pos.js";
import { parseBlock } from "./blockparser.js";
import { blockdata } from "./testdata.js";

describe("blockparser", () => {
    test("parse", () => {
        const b = parseBlock(Uint8Array.from(blockdata), new Pos<PosType.Mapblock>(0, 0, 0));
        expect(b).toBeTruthy();
        expect(b.blockMapping.get(126)).toBeTruthy();
        expect(b.mapNodes.length).toBe(4096);
    });
});
