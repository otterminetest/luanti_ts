import { Pos, type PosType, getNodeRegion, toMapblock } from "./pos.js";

describe("pos", () => {
    test("calc", () => {
        const np = new Pos<PosType.Node>(-1, 10, 20);

        const mbp = toMapblock(np);
        expect(mbp.x).toBeCloseTo(-1);
        expect(mbp.y).toBeCloseTo(0);
        expect(mbp.z).toBeCloseTo(1);

        const r = getNodeRegion(mbp);
        expect(r[0].x).toBeCloseTo(-16);
        expect(r[0].y).toBeCloseTo(0);
        expect(r[0].z).toBeCloseTo(16);
        expect(r[1].x).toBeCloseTo(-1);
        expect(r[1].y).toBeCloseTo(15);
        expect(r[1].z).toBeCloseTo(31);
    });
});
