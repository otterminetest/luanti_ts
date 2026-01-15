import { splitArray } from "./splitter.js";
import { MaxPacketLength } from "./types.js";

describe("splitter", () => {
    test("splits buffers", () => {
        const buf = new Uint8Array(800);
        const parts = splitArray(buf, MaxPacketLength);

        expect(parts.length).toBe(2);
        expect(parts[0].byteLength).toBe(MaxPacketLength);
        expect(parts[1].byteLength).toBe(buf.length - MaxPacketLength);
    });

    test("doesn't split small buffers", () => {
        const buf = new Uint8Array(400);
        const parts = splitArray(buf, MaxPacketLength);

        expect(parts.length).toBe(1);
        expect(parts[0].byteLength).toBe(buf.length);
    });
});
