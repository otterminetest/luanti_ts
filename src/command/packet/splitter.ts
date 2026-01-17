import { Packet } from "./Packet.js";
import { HEADER_SIZE_SPLIT, PacketType } from "./types.js";

/**
 * Splits a buffer into chunks of a specific maximum size.
 */
export function splitArray(buf: Uint8Array, maxDataSize: number): Array<Uint8Array> {
    const parts = Math.ceil(buf.length / maxDataSize);
    const a = new Array<Uint8Array>(parts);

    for (let i = 0; i < parts; i++) {
        const start = i * maxDataSize;
        const end = Math.min(start + maxDataSize, buf.byteLength);
        a[i] = buf.subarray(start, end);
    }
    return a;
}

let seqNr = 65500 - 1;

function nextSequenceNr() {
    if (seqNr >= 65535) {
        seqNr = 0;
    } else {
        seqNr++;
    }
    return seqNr;
}

/**
 * Splits a payload into multiple split packets.
 * @param buf The full payload to split
 * @param maxDataSize The maximum amount of raw data allowed in a single packet (excluding split headers)
 */
export function splitPayload(buf: Uint8Array, maxDataSize: number): Array<Packet> {
    const parts = splitArray(buf, maxDataSize);
    const packets = new Array(parts.length);
    const splitSeqNr = nextSequenceNr();

    for (let i = 0; i < parts.length; i++) {
        const p = new Packet();

        // Payload size = SplitHeader(6) + DataPart(N)
        const payload = new Uint8Array(HEADER_SIZE_SPLIT + parts[i].length);

        // Add Split Header
        const dv = new DataView(payload.buffer);
        dv.setUint16(0, splitSeqNr);
        dv.setUint16(2, parts.length);
        dv.setUint16(4, i);

        // Add Data
        payload.set(parts[i], HEADER_SIZE_SPLIT);

        p.payload = payload;
        // Note: The caller (packetfactory) will wrap this in Reliable and set subType to Split
        p.packetType = PacketType.Split;
        packets[i] = p;
    }

    return packets;
}
