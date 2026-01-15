import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerHello implements ServerCommand {
    serializationVersion!: number;
    compressionMode!: number;
    protocolVersion!: number;
    authMechanismSrp!: boolean;
    authMechanismFirstSrp!: boolean;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        this.serializationVersion = dv.getUint8(0);
        this.compressionMode = dv.getUint16(1);
        this.protocolVersion = dv.getUint16(3);
        this.authMechanismSrp = ph.getBoolean(8, 0x02);
        this.authMechanismFirstSrp = ph.getBoolean(8, 0x04);
    }
}
