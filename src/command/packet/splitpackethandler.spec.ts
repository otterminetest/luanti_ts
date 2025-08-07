import { Packet } from "./Packet.js";
import { SplitPacketHandler } from "./splitpackethandler.js";

describe("splitpackethandler", function(){
    test("reassembles the data properly", function() {
        const sph = new SplitPacketHandler();
        const payload = new Uint8Array(400);
        for (let i=0; i<payload.byteLength; i++){
            payload[i] = i % 256;
        }

        const p1 = new Packet();
        p1.payload = new Uint8Array(payload.length + 6);
        p1.payloadView = new DataView(p1.payload.buffer);
        p1.payload.set(payload, 6);
        
        p1.payloadView.setUint16(0, 100); // seqNr
        p1.payloadView.setUint16(2, 2); // chunk count
        p1.payloadView.setUint16(4, 0); // chunk number

        let result = sph.AddSplitPacket(p1);
        expect(result).toBeNull()

        const p2 = new Packet();
        p2.payload = new Uint8Array(payload.length + 6);
        p2.payloadView = new DataView(p2.payload.buffer);
        p2.payload.set(payload, 6);
        
        p2.payloadView.setUint16(0, 100); // seqNr
        p2.payloadView.setUint16(2, 2); // chunk count
        p2.payloadView.setUint16(4, 1); // chunk number

        result = sph.AddSplitPacket(p2);
        expect(result).toBeTruthy()
        expect(result?.length).toBe(800)

        for (let i=0; i<payload.length; i++){
            expect(result![i]).toBe(i % 256)
            expect(result![i+payload.length]).toBe(i % 256)
        }
    })
})