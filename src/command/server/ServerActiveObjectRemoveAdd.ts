import { ActiveObjectType } from "../../activeobject/ActiveObjectTypes.js";
import { GenericCAOInitData } from "../../activeobject/GenericCAOInitData.js";
import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export interface AddedObject {
    id: number;
    type: ActiveObjectType;
    // Parsed data for known types, or raw init string for unknown types
    data: GenericCAOInitData | string;
}

export class ServerActiveObjectRemoveAdd implements ServerCommand {
    removedIds = new Array<number>();
    addedObjects = new Array<AddedObject>();

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        const removedCount = dv.getUint16(offset);
        offset += 2;
        for (let i = 0; i < removedCount; i++) {
            this.removedIds.push(dv.getUint16(offset));
            offset += 2;
        }

        const addedCount = dv.getUint16(offset);
        offset += 2;
        for (let i = 0; i < addedCount; i++) {
            const id = dv.getUint16(offset);
            offset += 2;
            const type = dv.getUint8(offset);
            offset += 1;

            // Read LongString length (u32)
            const dataLen = dv.getUint32(offset);
            offset += 4;

            // Define the buffer for this object's init data
            const dataBuffer = new Uint8Array(dv.buffer, dv.byteOffset + offset, dataLen);
            const dataView = new DataView(
                dataBuffer.buffer,
                dataBuffer.byteOffset,
                dataBuffer.byteLength,
            );

            let parsedData: GenericCAOInitData | string;

            if (type === ActiveObjectType.GENERIC) {
                try {
                    parsedData = new GenericCAOInitData(dataView);
                } catch (e) {
                    console.error(`Failed to parse GenericCAO init data for object ${id}:`, e);
                    // Fallback to raw string if parsing fails
                    parsedData = new TextDecoder("latin1").decode(dataBuffer);
                }
            } else {
                // For other types (LuaEntity, etc), keep as string/binary string
                parsedData = new TextDecoder("latin1").decode(dataBuffer);
            }

            this.addedObjects.push({
                id,
                type: type as ActiveObjectType,
                data: parsedData,
            });

            offset += dataLen;
        }
    }
}
