import { Packet } from "./Packet.js";
import { getNextSeqNr } from "./sequence.js";
import { ControlType, PacketType, ProtocolID } from "./types.js";

function createPacketHeader(p: Packet) {
    const buf = new Uint8Array(8);
    const dv = new DataView(buf.buffer);
    for (let i=0; i<ProtocolID.length; i++){
        dv.setUint8(i, ProtocolID[i]);
    }
    dv.setUint16(4, p.peerId);
    dv.setUint8(6, p.channel);
    dv.setUint8(7, p.packetType || 0);

    return buf;
}

export function marshal(p: Packet) {
    const header = createPacketHeader(p);
    let buf, dv;

    switch (p.packetType){
    case PacketType.Control:
        switch (p.controlType){
            case ControlType.Ping:
            case ControlType.Ack:
            case ControlType.Disco: {
                const control = new Uint8Array(3);
                dv = new DataView(control.buffer);
                dv.setUint8(0, p.controlType || 0);
                dv.setUint16(1, p.seqNr!);

                const buf = new Uint8Array(header.length + control.length);
                buf.set(header, 0);
                buf.set(control, header.length);
                return buf;
            }
        }
        break;

    case PacketType.Original:
        buf = new Uint8Array(header.length + p.payload.length);
        buf.set(header, 0);
        buf.set(p.payload, header.length);
        return buf;

    case PacketType.Reliable:

        switch (p.subType) {
            case PacketType.Original:
            case PacketType.Reliable:
            case PacketType.Split:
                buf = new Uint8Array(header.length + 3 + p.payload.length);
                buf.set(header, 0);
                dv = new DataView(buf.buffer);
                if (p.seqNr < 0) {
                    p.seqNr = getNextSeqNr();
                }
                dv.setUint16(header.length, p.seqNr);
                dv.setUint8(header.length + 2, p.subType || 0);
                buf.set(p.payload, header.length + 3);
                return buf;
        }
    }

    throw new Error("not implemented yet: " + p);
}


export function unmarshal(buf: Uint8Array) {
    if (buf.byteLength < 5) {
        throw new Error("invalid packet length");
    }

    const dv = new DataView(buf.buffer);

    for (let i=0; i<ProtocolID.length; i++){
        if (dv.getUint8(i) != ProtocolID[i]){
            throw new Error("invalid protocol id");
        }
    }

    const p = new Packet();
    p.peerId = dv.getUint16(4);
    p.channel = dv.getUint8(6);
    p.packetType = dv.getUint8(7);
    
    switch (p.packetType){
        case PacketType.Original:
            p.payload = buf.subarray(8);
            p.payloadView = new DataView(buf.buffer, 8);
            return p;

        case PacketType.Reliable:
            p.seqNr = dv.getUint16(8);
            p.subType = dv.getUint8(10);

            switch (p.subType){
                case PacketType.Control:
                    p.controlType = dv.getUint8(11);
                    if (p.controlType == ControlType.SetPeerID) {
                        p.peerId = dv.getUint16(12);
                    }
                    return p;
                case PacketType.Original:
                case PacketType.Split:
                        p.payload = buf.subarray(11);
                        p.payloadView = new DataView(buf.buffer, 11);
                    return p;
            }
            break;
        case PacketType.Control:
            p.controlType = dv.getUint8(8);
            p.seqNr = dv.getUint16(9)
            return p;

    }

    throw new Error(`not implemented yet: packetType: ${p.packetType}, subtype: ${p.subType}, controlType: ${p.controlType}, data: ${dumpPacket(buf)}`);
}

function dumpPacket(buf: Uint8Array) {
    let str = "";
    const dv = new DataView(buf.buffer);
    for (let i=0; i<dv.byteLength; i++){
        str += "0x" + dv.getUint8(i).toString(16) + ",";
    }
    return str;
}