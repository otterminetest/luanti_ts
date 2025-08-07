import { PayloadHelper } from "./PayloadHelper.js"

describe("PayloadHelper", function(){
    test("stub", function(){
        const ab = new ArrayBuffer(10);
        const dv = new DataView(ab);
        dv.setUint8(0, 1)
    
        const ph = new PayloadHelper(dv)
        expect(ph.getBoolean(0, 0x01)).toBe(true)
    })
})