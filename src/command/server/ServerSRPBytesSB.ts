import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerSRPBytesSB implements ServerCommand {
    public bytesS!: number[];
    public bytesB!: number[];

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        this.bytesS = ph.getArray(0);

        if (this.bytesS.length !== 32 && this.bytesS.length !== 16) {
            console.warn(`Warning: Unexpected salt length: ${this.bytesS.length}`);
        }

        this.bytesB = ph.getArray(2 + this.bytesS.length);

        if (this.bytesB.length !== 256) {
            console.warn(`Warning: Unexpected public key length: ${this.bytesB.length}`);
        }
    }
}
