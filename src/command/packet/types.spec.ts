import { PacketType } from "./types.js";

describe("types", () => {
    test("PacketType", () => {
        const c = PacketType.Control;
        expect(c).toBe(0x00);
        expect(PacketType[0x00]).toBe("Control");
    });
});
