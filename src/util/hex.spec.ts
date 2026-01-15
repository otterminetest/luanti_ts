import { arrayToHex } from "./hex.js";

describe("hex", () => {
    test("converts to hex properly", () => {
        const a = [1, 2, 3];
        const str = arrayToHex(a);
        expect(str).toBe("010203");
    });
});
