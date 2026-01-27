export class PayloadHelper {
    constructor(public dv: DataView) {}

    checkBounds(offset: number, bytes: number) {
        if (offset + bytes > this.dv.byteLength) {
            throw new Error(
                `Buffer overflow: try read ${bytes} at ${offset}, len ${this.dv.byteLength}`,
            );
        }
    }

    getBoolean(offset: number, mask: number): boolean {
        this.checkBounds(offset, 1);
        return (this.dv.getUint8(offset) & mask) === mask;
    }

    getBool(offset: number): boolean {
        this.checkBounds(offset, 1);
        return this.dv.getUint8(offset) !== 0;
    }

    getArray(offset: number): Array<number> {
        this.checkBounds(offset, 2);
        const len = this.dv.getUint16(offset);
        this.checkBounds(offset + 2, len);
        const a = new Array<number>(len);
        for (let i = 0; i < len; i++) {
            a[i] = this.dv.getUint8(offset + i + 2);
        }
        return a;
    }

    getStringArray(offset: number): Array<string> {
        const a = new Array<string>();
        this.checkBounds(offset, 2);
        const count = this.dv.getUint16(offset);
        let o = offset + 2;

        for (let i = 0; i < count; i++) {
            const s = this.getString(o);
            a.push(s);
            o += 2 + s.length;
        }

        return a;
    }

    getUint8Array(offset: number): Uint8Array {
        this.checkBounds(offset, 4);
        const len = this.dv.getUint32(offset);
        const subOffset = this.dv.byteOffset + offset + 4;
        this.checkBounds(offset + 4, len);
        return new Uint8Array(this.dv.buffer, subOffset, len);
    }

    getUint8ArraySize(buf: Uint8Array) {
        return 4 + buf.byteLength;
    }

    getString(offset: number): string {
        this.checkBounds(offset, 2);
        const len = this.dv.getUint16(offset);
        this.checkBounds(offset + 2, len);
        let str = "";
        for (let i = 0; i < len; i++) {
            str += String.fromCharCode(this.dv.getUint8(offset + 2 + i));
        }
        return str;
    }

    getStringData(offset: number): Uint8Array {
        this.checkBounds(offset, 2);
        const len = this.dv.getUint16(offset);
        const subOffset = this.dv.byteOffset + offset + 2;
        this.checkBounds(offset + 2, len);
        return new Uint8Array(this.dv.buffer, subOffset, len);
    }

    getLongStringData(offset: number): Uint8Array {
        this.checkBounds(offset, 4);
        const len = this.dv.getUint32(offset);
        const subOffset = this.dv.byteOffset + offset + 4;
        this.checkBounds(offset + 4, len);
        return new Uint8Array(this.dv.buffer, subOffset, len);
    }

    getLongString(offset: number): string {
        this.checkBounds(offset, 4);
        const len = this.dv.getUint32(offset);
        this.checkBounds(offset + 4, len);
        let str = "";
        for (let i = 0; i < len; i++) {
            str += String.fromCharCode(this.dv.getUint8(offset + 4 + i));
        }
        return str;
    }

    getWideString(offset: number): string {
        this.checkBounds(offset, 2);
        const len = this.dv.getUint16(offset);
        this.checkBounds(offset + 2, len * 2);
        let str = "";
        for (let i = 0; i < len; i++) {
            str += String.fromCharCode(this.dv.getUint16(offset + 2 + i * 2));
        }
        return str;
    }

    getV3F(offset: number): { x: number; y: number; z: number } {
        this.checkBounds(offset, 12);
        return {
            x: this.dv.getFloat32(offset),
            y: this.dv.getFloat32(offset + 4),
            z: this.dv.getFloat32(offset + 8),
        };
    }

    getV2F(offset: number): { x: number; y: number } {
        this.checkBounds(offset, 8);
        return {
            x: this.dv.getFloat32(offset),
            y: this.dv.getFloat32(offset + 4),
        };
    }

    getS32(offset: number): number {
        this.checkBounds(offset, 4);
        return this.dv.getInt32(offset);
    }

    getU32(offset: number): number {
        this.checkBounds(offset, 4);
        return this.dv.getUint32(offset);
    }

    getS16(offset: number): number {
        this.checkBounds(offset, 2);
        return this.dv.getInt16(offset);
    }

    getARGB8(offset: number): number {
        this.checkBounds(offset, 4);
        return this.dv.getUint32(offset);
    }

    isEOF(offset: number): boolean {
        return offset >= this.dv.byteLength;
    }
}
