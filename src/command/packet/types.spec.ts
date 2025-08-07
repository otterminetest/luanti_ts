
import { PacketType } from "./types.js"

describe("types", function(){
    test("PacketType", function(){
        const c = PacketType.Control
        expect(c).toBe(0x00)
        expect(PacketType[0x00]).toBe("Control")
    })
})