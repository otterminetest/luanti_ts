export class PayloadHelper {
    constructor(public dv: DataView) {}

    getBoolean(offset: number, mask: number): boolean {
        return (this.dv.getUint8(offset) & mask) === mask;
    }

    // Generic boolean reader for single byte fields (0 = false, 1 = true)
    getBool(offset: number): boolean {
        return this.dv.getUint8(offset) !== 0;
    }

    getArray(offset: number): Array<number> {
        const len = this.dv.getUint16(offset);
        const a = new Array<number>(len);
        for (let i = 0; i < len; i++) {
            a[i] = this.dv.getUint8(offset + i + 2);
        }
        return a;
    }

    getStringArray(offset: number): Array<string> {
        const a = new Array<string>();
        const count = this.dv.getUint16(offset);
        let o = offset + 2;

        for (let i = 0; i < count; i++) {
            a.push(this.getString(o));
            // shift offset
            o += 2 + this.dv.getUint16(o);
        }

        return a;
    }

    getUint8Array(offset: number): Uint8Array {
        const buf = new Uint8Array(this.dv.buffer);
        const len = this.dv.getUint32(offset);
        const subOffset = this.dv.byteOffset + offset + 4;
        return buf.subarray(subOffset, subOffset + len);
    }

    getUint8ArraySize(buf: Uint8Array) {
        return 4 + buf.byteLength;
    }

    getString(offset: number): string {
        const len = this.dv.getUint16(offset);
        let str = "";
        for (let i = 0; i < len; i++) {
            str += String.fromCharCode(this.dv.getUint8(offset + 2 + i));
        }
        return str;
    }

    // Extracts the raw bytes of a string field (u16 len + bytes)
    getStringData(offset: number): Uint8Array {
        const len = this.dv.getUint16(offset);
        // Return a view into the buffer to avoid copying if possible
        const subOffset = this.dv.byteOffset + offset + 2;
        return new Uint8Array(this.dv.buffer, subOffset, len);
    }

    // Used by InventoryFormspec, NodeDefs, etc.
    getLongString(offset: number): string {
        const len = this.dv.getUint32(offset);
        let str = "";
        for (let i = 0; i < len; i++) {
            str += String.fromCharCode(this.dv.getUint8(offset + 4 + i));
        }
        return str;
    }

    getWideString(offset: number): string {
        const len = this.dv.getUint16(offset);
        let str = "";
        for (let i = 0; i < len; i++) {
            str += String.fromCharCode(this.dv.getUint16(offset + 2 + i * 2)); // Use getUint16 for wide chars
        }
        return str;
    }

    getV3F(offset: number): { x: number; y: number; z: number } {
        return {
            x: this.dv.getFloat32(offset),
            y: this.dv.getFloat32(offset + 4),
            z: this.dv.getFloat32(offset + 8),
        };
    }

    getV2F(offset: number): { x: number; y: number } {
        return {
            x: this.dv.getFloat32(offset),
            y: this.dv.getFloat32(offset + 4),
        };
    }

    getS32(offset: number): number {
        return this.dv.getInt32(offset);
    }

    getU32(offset: number): number {
        return this.dv.getUint32(offset);
    }

    getS16(offset: number): number {
        return this.dv.getInt16(offset);
    }
}
