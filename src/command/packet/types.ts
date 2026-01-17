export const MaxPacketLength = 512;

export const HEADER_SIZE_BASE = 8; // Protocol(4) + Peer(2) + Chan(1) + Type(1)
export const HEADER_SIZE_RELIABLE = 3; // Seq(2) + SubType(1)
export const HEADER_SIZE_SPLIT = 6; // Seq(2) + Count(2) + Num(2) (Type handled by Reliable SubType)

export const ProtocolID = [0x4f, 0x45, 0x74, 0x03];

export enum PacketType {
    Control = 0x00,
    Original = 0x01,
    Split = 0x02,
    Reliable = 0x03,
}

export enum ControlType {
    Ack = 0x00,
    SetPeerID = 0x01,
    Ping = 0x02,
    Disco = 0x03,
}
