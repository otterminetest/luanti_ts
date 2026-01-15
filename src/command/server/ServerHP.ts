import type { ServerCommand } from "../ServerCommand.js";

export class ServerHP implements ServerCommand {
    hp!: number;
    damageEffect = true;

    unmarshalPacket(dv: DataView): void {
        this.hp = dv.getUint8(0); // Usually HP is u8 (0-255), though C++ reads u16, but protocols often use u8 for legacy reasons. Let's check C++: *pkt >> hp (u16).
        // Correction: C++ reads u16.
        this.hp = dv.getUint16(0);

        if (dv.byteLength > 2) {
            this.damageEffect = dv.getUint8(2) !== 0;
        }
    }
}
