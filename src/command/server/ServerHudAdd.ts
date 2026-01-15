import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerHudAdd implements ServerCommand {
    id!: number;
    type!: number;
    pos!: { x: number; y: number };
    name!: string;
    scale!: { x: number; y: number };
    text!: string;
    number!: number;
    item!: number;
    dir!: number;
    align!: { x: number; y: number };
    offset!: { x: number; y: number };

    // Optional
    worldPos?: { x: number; y: number; z: number };
    size?: { x: number; y: number };
    zIndex?: number;
    text2?: string;
    style?: number;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        this.id = dv.getUint32(offset);
        offset += 4;
        this.type = dv.getUint8(offset);
        offset += 1;
        this.pos = ph.getV2F(offset);
        offset += 8;
        this.name = ph.getString(offset);
        offset += 2 + this.name.length;
        this.scale = ph.getV2F(offset);
        offset += 8;
        this.text = ph.getString(offset);
        offset += 2 + this.text.length;
        this.number = dv.getUint32(offset);
        offset += 4;
        this.item = dv.getUint32(offset);
        offset += 4;
        this.dir = dv.getUint32(offset);
        offset += 4;
        this.align = ph.getV2F(offset);
        offset += 8;
        this.offset = ph.getV2F(offset);
        offset += 8;

        if (offset < dv.byteLength) {
            try {
                this.worldPos = ph.getV3F(offset);
                offset += 12;
                this.size = { x: dv.getInt32(offset), y: dv.getInt32(offset + 4) };
                offset += 8;
                this.zIndex = dv.getInt16(offset);
                offset += 2;
                this.text2 = ph.getString(offset);
                offset += 2 + (this?.text2?.length || 0);
                this.style = dv.getUint8(offset);
                offset += 1;
            } catch (e) {
                // Ignore optional fields if packet ends early
            }
        }
    }
}
