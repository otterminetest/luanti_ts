import { Pos, PosType } from "../../util/pos.js";

export class PayloadBuilder {
    data: Uint8Array;
    dv: DataView;
    index = 0;

    constructor(size: number) {
        this.data = new Uint8Array(size);
        this.dv = new DataView(this.data.buffer);
    }

    appendUint8(v: number) {
        this.dv.setUint8(this.index, v);
        this.index++;
    }

    appendBool(v: boolean) {
        this.appendUint8(v ? 1 : 0);
    }

    appendUint16(v: number) {
        this.dv.setUint16(this.index, v);
        this.index += 2;
    }

    appendInt16(v: number) {
        this.dv.setInt16(this.index, v);
        this.index += 2;
    }

    appendUint32(v: number) {
        this.dv.setUint32(this.index, v);
        this.index += 4;
    }

    appendInt32(v: number) {
        this.dv.setInt32(this.index, v);
        this.index += 4;
    }

    appendFloat32(v: number) {
        this.dv.setFloat32(this.index, v);
        this.index += 4;
    }

    // Standard string (u16 length prefix)
    appendString(s: string) {
        this.appendUint16(s.length);
        for (let i = 0; i < s.length; i++) {
            this.appendUint8(s.charCodeAt(i));
        }
    }

    // Long string (u32 length prefix) - Used for Formspecs/Nodemeta
    appendLongString(s: string) {
        this.appendUint32(s.length);
        for (let i = 0; i < s.length; i++) {
            this.appendUint8(s.charCodeAt(i));
        }
    }

    // Raw string (No length prefix) - Used for Inventory Actions
    appendRawString(s: string) {
        for (let i = 0; i < s.length; i++) {
            this.appendUint8(s.charCodeAt(i));
        }
    }

    appendArray(a: Array<number>) {
        this.appendUint16(a.length);
        for (let i = 0; i < a.length; i++) {
            this.appendUint8(a[i]);
        }
    }

    toUint8Array(): Uint8Array {
        return this.data.subarray(0, this.index);
    }
}
