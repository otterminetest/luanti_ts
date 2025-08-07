
export interface ClientCommand {
    getCommandID(): number
    marshalPacket(): Uint8Array
}