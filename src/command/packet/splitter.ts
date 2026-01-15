import { Packet } from "./Packet.js";
import { MaxPacketLength, PacketType } from "./types.js";

export function splitArray(buf: Uint8Array, limit: number): Array<Uint8Array> {
    const parts = Math.ceil(buf.length / (limit + 1));
    const a = new Array<Uint8Array>(parts);

    for (let i = 0; i < parts; i++) {
        const start = i * limit;
        const end = start + Math.min(limit, buf.byteLength - start);
        a[i] = buf.subarray(start, end);
    }
    return a;
}

let seqNr = 65500 - 1;

function nextSequenceNr() {
    if (seqNr > 65535) {
        seqNr = 0;
    } else {
        seqNr++;
    }
    return seqNr;
}

export function splitPayload(buf: Uint8Array): Array<Packet> {
    const parts = splitArray(buf, MaxPacketLength);
    const packets = new Array(parts.length);
    const seqNr = nextSequenceNr();

    for (let i = 0; i < parts.length; i++) {
        const p = new Packet();
        //add payload
        const payload = new Uint8Array(parts[i].length + 6);
        payload.set(parts[i], 6);

        //add header
        const dv = new DataView(payload.buffer);
        dv.setUint16(0, seqNr);
        dv.setUint16(2, parts.length);
        dv.setUint16(4, i);

        p.payload = payload;
        p.packetType = PacketType.Split;
        packets[i] = p;
    }

    return packets;
}
