/*
import { dataViewToHexDump } from "../../util/hex"
import { Pos, PosType } from  "../../util/pos.js"
import { ClientPlayerPos } from "./ClientPlayerPos.js"

describe("ClientPlayerPos", function() {
    test("marshal", function() {
        const pp = new ClientPlayerPos(new Pos<PosType.Entity>(312.238,15,389.573))
        const a = pp.marshalPacket()

        // y
        expect(a[4]).toBe(0x00)
        expect(a[5]).toBe(0x00)
        expect(a[6]).toBe(0x3A)
        expect(a[7]).toBe(0x98)

        // x
        expect(a[0]).toBe(0x00)
        expect(a[1]).toBe(0x04)
        expect(a[2]).toBe(0xC3)
        expect(a[3]).toBe(0xAE)
    })
})
*/
