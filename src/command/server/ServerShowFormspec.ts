import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerShowFormspec implements ServerCommand {
    formspec!: string;
    formname!: string;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        this.formspec = ph.getLongString(offset);
        offset += 4 + this.formspec.length;

        this.formname = ph.getString(offset);
    }
}
