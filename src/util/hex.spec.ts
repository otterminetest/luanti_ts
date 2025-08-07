import { arrayToHex } from "./hex.js";

describe("hex", function(){
    test("converts to hex properly", function() {
        const a = [1,2,3];
        const str = arrayToHex(a);
        expect(str).toBe("010203");
    });
})