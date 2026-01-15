import type { ServerCommand } from "../ServerCommand.js";

export class ServerItemDefinitions implements ServerCommand {
    data!: Uint8Array;

    unmarshalPacket(dv: DataView): void {
        // The packet contains the serialized item definitions (usually Zlib compressed).
        // For now, we just read the raw buffer to clear the socket buffer and prevent "Unknown Command" errors.
        this.data = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
    }
}
