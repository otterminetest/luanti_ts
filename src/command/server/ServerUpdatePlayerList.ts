import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export enum PlayerListAction {
    Init = 0,
    Add = 1,
    Remove = 2,
}

export class ServerUpdatePlayerList implements ServerCommand {
    action!: PlayerListAction;
    players = new Array<string>();

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        this.action = dv.getUint8(offset);
        offset += 1;
        const count = dv.getUint16(offset);
        offset += 2;

        for (let i = 0; i < count; i++) {
            const name = ph.getString(offset);
            offset += 2 + name.length;
            this.players.push(name);
        }
    }
}
