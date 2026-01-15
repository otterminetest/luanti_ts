import { stringToHex } from "../../util/hex.js";
import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerAnnounceMedia implements ServerCommand {
    fileCount!: number;
    remoteServers!: Array<string>;

    // filename -> hash
    hashes = new Map<string, string>();

    unmarshalPacket(dv: DataView): void {
        this.fileCount = dv.getUint16(0);
        const ph = new PayloadHelper(dv);

        let offset = 2;
        for (let i = 0; i < this.fileCount; i++) {
            const name = ph.getString(offset);
            const hashstr = ph.getString(offset + 2 + name.length);
            const hashbin = Buffer.from(hashstr, "base64").toString("binary");
            const hashHex = stringToHex(hashbin);
            this.hashes.set(name, hashHex);
            offset += 2 + 2 + name.length + hashstr.length;
        }

        this.remoteServers = ph.getString(offset).split(",");
    }
}
