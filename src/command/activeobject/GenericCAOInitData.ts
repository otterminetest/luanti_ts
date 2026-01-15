import { PayloadHelper } from "../packet/PayloadHelper.js";
import { type AoCommand, parseAoCommand } from "./ActiveObjectCommands.js";

export class GenericCAOInitData {
    version: number;
    name: string;
    isPlayer: boolean;
    id: number;
    pos: { x: number; y: number; z: number };
    rot: { x: number; y: number; z: number };
    hp: number;
    messages: AoCommand[] = [];

    constructor(dv: DataView) {
        const ph = new PayloadHelper(dv);
        let offset = 0;
        this.version = dv.getUint8(offset++);
        this.name = ph.getString(offset);
        offset += 2 + this.name.length;
        this.isPlayer = ph.getBool(offset++);
        this.id = dv.getUint16(offset);
        offset += 2;
        this.pos = ph.getV3F(offset);
        offset += 12;
        this.rot = ph.getV3F(offset);
        offset += 12;
        this.hp = dv.getUint16(offset);
        offset += 2;

        const numMessages = dv.getUint8(offset++);

        for (let i = 0; i < numMessages; i++) {
            if (offset + 4 > dv.byteLength) break;

            const msgLen = dv.getUint32(offset);
            offset += 4;

            if (offset + msgLen <= dv.byteLength) {
                const msgData = new Uint8Array(dv.buffer, dv.byteOffset + offset, msgLen);
                try {
                    const cmd = parseAoCommand(msgData);
                    this.messages.push(cmd);
                } catch (e) {
                    console.warn(`Error parsing init message for CAO ${this.id}:`, e);
                }
            }
            offset += msgLen;
        }
    }
}
