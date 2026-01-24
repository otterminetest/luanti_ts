import {
    ActiveObjectCommandType,
    type AoCmdAttachTo,
} from "../activeobject/ActiveObjectCommands.js";
import { ActiveObjectType } from "../activeobject/ActiveObjectTypes.js";
import { GenericCAOInitData } from "../activeobject/GenericCAOInitData.js";
import type { Client } from "../Client.js";
import { ServerActiveObjectMessages } from "../command/server/ServerActiveObjectMessages.js";
import { ServerActiveObjectRemoveAdd } from "../command/server/ServerActiveObjectRemoveAdd.js";
import Logger from "../util/logger.js";

export class EntityManager {
    // Map ID -> Name/Identifier
    entities = new Map<number, string>();
    // ID of the entity the local player is attached to (0 = none)
    attachedToId = 0;

    private log = Logger.get("EntityManager");

    constructor(private client: Client) {
        client.cc.events.on("ServerCommand", (cmd) => {
            if (cmd instanceof ServerActiveObjectRemoveAdd) {
                this.handleRemoveAdd(cmd);
            } else if (cmd instanceof ServerActiveObjectMessages) {
                this.handleMessages(cmd);
            }
        });
    }

    /**
     * Helper to check if the local player is currently attached to a specific entity type/name.
     * @param entityName The name to check (e.g. "mcl_armor:elytra_entity")
     */
    isAttachedTo(entityName: string): boolean {
        if (this.attachedToId === 0) return false;
        const currentName = this.entities.get(this.attachedToId);
        return currentName === entityName;
    }

    private handleRemoveAdd(cmd: ServerActiveObjectRemoveAdd) {
        // Handle Added Objects
        for (const obj of cmd.addedObjects) {
            let name = "Unknown";

            if (
                obj.type === ActiveObjectType.PLAYER &&
                obj.data instanceof GenericCAOInitData
            ) {
                name = obj.data.name;
            } else if (
                obj.type === ActiveObjectType.LUAENTITY &&
                typeof obj.data === "string"
            ) {
                // LuaEntity init data is usually "EntityName params..."
                // We assume the first word (before space or null) is the entity name
                const nullIdx = obj.data.indexOf("\0");
                const spaceIdx = obj.data.indexOf(" ");
                let endIdx = obj.data.length;

                if (nullIdx !== -1 && nullIdx < endIdx) endIdx = nullIdx;
                if (spaceIdx !== -1 && spaceIdx < endIdx) endIdx = spaceIdx;

                name = obj.data.substring(0, endIdx);
            } else if (
                obj.type === ActiveObjectType.GENERIC &&
                obj.data instanceof GenericCAOInitData
            ) {
                name = obj.data.name;
            }

            this.entities.set(obj.id, name);
        }

        // Handle Removed Objects
        for (const id of cmd.removedIds) {
            this.entities.delete(id);
            // If the entity we were attached to is removed, we are no longer attached
            if (this.attachedToId === id) {
                this.attachedToId = 0;
            }
        }
    }

    private handleMessages(cmd: ServerActiveObjectMessages) {
        for (const msg of cmd.messages) {
            // We only care about messages targeting the local player
            if (msg.id === this.client.localPlayerId) {
                if (msg.cmd.type === ActiveObjectCommandType.ATTACH_TO) {
                    // Cast to the specific command class to access parent_id
                    const attachCmd = msg.cmd as AoCmdAttachTo;
                    this.attachedToId = attachCmd.parent_id;
                    
                    const parentName = this.entities.get(this.attachedToId) || "Unknown";
                    this.log.debug(
                        `Local player attached to entity ${this.attachedToId} (${parentName})`
                    );
                }
            }
        }
    }
}