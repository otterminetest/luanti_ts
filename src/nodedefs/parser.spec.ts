import { ServerNodeDefinitions } from "../command/server/ServerNodeDefinitions.js";
import { ParseNodeDefinitions } from "./parser.js";
import { nodedef_data } from "./testdata.js"

describe("nodedefs", function(){
    test("parser", function(){
        const buf = Uint8Array.from(nodedef_data);
        const dv = new DataView(buf.buffer);

        const cmd = new ServerNodeDefinitions()
        cmd.unmarshalPacket(dv)

        const defs = ParseNodeDefinitions(cmd)
        expect(defs.length).toEqual(446)
    })
})