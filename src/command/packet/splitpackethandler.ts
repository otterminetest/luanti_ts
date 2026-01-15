import type { Packet } from "./Packet.js";

class SplitPacket {
    constructor(
        public seqNr: number,
        public chunkCount: number,
        public chunkNumber: number,
        public data: Uint8Array,
    ) {}
}

export class SplitPacketHandler {
    store = new Map<number, Array<SplitPacket>>();
    store_count = new Map<number, number>();
    store_length = new Map<number, number>();

    AddSplitPacket(p: Packet): Uint8Array | null {
        const sp = new SplitPacket(
            p.payloadView.getUint16(0),
            p.payloadView.getUint16(2),
            p.payloadView.getUint16(4),
            p.payload.subarray(6),
        );

        let list = this.store.get(sp.seqNr);
        if (!list) {
            // create list
            list = new Array<SplitPacket>();
            this.store.set(sp.seqNr, list);
        }

        if (!list[sp.chunkNumber]) {
            // add to list
            list[sp.chunkNumber] = sp;

            //increment count
            let count = this.store_count.get(sp.seqNr) || 0;
            count++;
            this.store_count.set(sp.seqNr, count);

            //increment length
            let length = this.store_length.get(sp.seqNr) || 0;
            length += sp.data.length;
            this.store_length.set(sp.seqNr, length);

            //check if we have all parts
            if (count === sp.chunkCount) {
                //reassemble payload
                const buf = new Uint8Array(length);

                let offset = 0;
                for (let i = 0; i < list.length; i++) {
                    const data = list[i].data;
                    buf.set(data, offset);
                    offset += data.length;
                }

                //clear store
                this.store.delete(sp.seqNr);
                this.store_length.delete(sp.seqNr);
                this.store_count.delete(sp.seqNr);

                return buf;
            }
        }

        return null;
    }
}
