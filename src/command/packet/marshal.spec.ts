import { marshal, unmarshal } from "./marshal.js";
import { Packet } from "./Packet.js";
import { createAck } from "./packetfactory.js";
import { PacketType } from "./types.js";

describe("marshal", function(){
    test("creates a proper ack", function() {
        const srcp = new Packet();
        srcp.channel = 0;
        srcp.peerId = 1;
        srcp.packetType = PacketType.Reliable;
        srcp.subType = PacketType.Split;
        srcp.seqNr = 65504;
        
        const ack = createAck(srcp, 55);
        const buf = marshal(ack);

        const ab = new ArrayBuffer(buf.byteLength);
        const dv = new DataView(ab);
        for (let i=0; i<buf.byteLength; i++){
            dv.setUint8(i, buf[i]);
        }

        expect(buf.byteLength).toBe(11)
        expect(dv.getUint16(4)).toBe(55)
        expect(dv.getUint16(9)).toBe(srcp.seqNr)
    })

    test("properly unmarshals a packet", function() {
        // TOCLIENT_SET_LIGHTING
        const data = [
            0x4f,0x45,0x74,0x3, //protocol id
            0x0,0x1,  // peerID
            0x0, // channel
            0x1, // packet type
            0x0,0x63, // command id
            0x3e,0xf0,0x49,0xb1
        ];
        const buf = new Uint8Array(data);
        const pkg = unmarshal(buf);

        expect(pkg.payload.length).toBe(6)
    })
})