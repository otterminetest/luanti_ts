export const MaxPacketLength = 495;

export const ProtocolID = [0x4f, 0x45, 0x74, 0x03];

export enum PacketType {
    Control = 0x00,
    Original = 0x01,
    Split = 0x02,
    Reliable = 0x03
}

export enum ControlType {
    Ack = 0x00,
    SetPeerID = 0x01,
    Ping = 0x02,
    Disco = 0x03
}

