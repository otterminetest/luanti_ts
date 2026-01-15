import { type AoCommand, parseAoCommand } from "../../activeobject/ActiveObjectCommands.js";
import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerActiveObjectMessages implements ServerCommand {
    // Changed to store parsed commands instead of raw strings
    messages = new Array<{ id: number; cmd: AoCommand }>();

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        while (offset < dv.byteLength) {
            const id = dv.getUint16(offset);
            offset += 2;

            // Get the binary payload of the string (u16 len + bytes)
            const data = ph.getStringData(offset);

            // Advance offset by string header (2) + data length
            offset += 2 + data.byteLength;

            try {
                const cmd = parseAoCommand(data);
                this.messages.push({ id, cmd });
            } catch (e) {
                console.error(`Failed to parse AO message for object ${id}`, e);
            }
        }
    }
}
