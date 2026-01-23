import { ServerAccessDenied } from "./server/ServerAccessDenied.js";
import { ServerActiveObjectMessages } from "./server/ServerActiveObjectMessages.js";
import { ServerActiveObjectRemoveAdd } from "./server/ServerActiveObjectRemoveAdd.js";
import { ServerAnnounceMedia } from "./server/ServerAnnounceMedia.js";
import { ServerAuthAccept } from "./server/ServerAuthAccept.js";
import { ServerBlockData } from "./server/ServerBlockData.js";
import { ServerBreath } from "./server/ServerBreath.js";
import { ServerCSMRestrictionFlags } from "./server/ServerCSMRestrictionFlags.js";
import { ServerChatMessage } from "./server/ServerChatMessage.js";
import { ServerCloudParams } from "./server/ServerCloudParams.js";
import { ServerDetachedInventory } from "./server/ServerDetachedInventory.js";
import { ServerFormspecPrepend } from "./server/ServerFormspecPrepend.js";
import { ServerHP } from "./server/ServerHP.js";
import { ServerHello } from "./server/ServerHello.js";
import { ServerHudAdd } from "./server/ServerHudAdd.js";
import { ServerHudChange } from "./server/ServerHudChange.js";
import { ServerHudSetFlags } from "./server/ServerHudSetFlags.js";
import { ServerHudSetParam } from "./server/ServerHudSetParam.js";
import { ServerInventory } from "./server/ServerInventory.js";
import { ServerInventoryFormspec } from "./server/ServerInventoryFormspec.js";
import { ServerItemDefinitions } from "./server/ServerItemDefinitions.js";
import { ServerMedia } from "./server/ServerMedia.js";
import { ServerMovePlayer } from "./server/ServerMovePlayer.js";
import { ServerMovement } from "./server/ServerMovement.js";
import { ServerNodeDefinitions } from "./server/ServerNodeDefinitions.js";
import { ServerOverrideDayNightRatio } from "./server/ServerOverrideDayNightRatio.js";
import { ServerPlaySound } from "./server/ServerPlaySound.js";
import { ServerPlayerSpeed } from "./server/ServerPlayerSpeed.js";
import { ServerPrivileges } from "./server/ServerPrivileges.js";
import { ServerSRPBytesSB } from "./server/ServerSRPBytesSB.js";
import { ServerSetLighting } from "./server/ServerSetLighting.js";
import { ServerSetMoon } from "./server/ServerSetMoon.js";
import { ServerSetSky } from "./server/ServerSetSky.js";
import { ServerSetStars } from "./server/ServerSetStars.js";
import { ServerSetSun } from "./server/ServerSetSun.js";
import { ServerShowFormspec } from "./server/ServerShowFormspec.js";
import { ServerSpawnParticleBatch } from "./server/ServerSpawnParticleBatch.js";
import { ServerTimeOfDay } from "./server/ServerTimeOfDay.js";
import { ServerUpdatePlayerList } from "./server/ServerUpdatePlayerList.js";

export interface ServerCommand {
    unmarshalPacket(dv: DataView): void;
}

export function getServerCommand(commandId: number): ServerCommand | null {
    switch (commandId) {
        case 0x02:
            return new ServerHello();
        case 0x60:
            return new ServerSRPBytesSB();
        case 0x03:
            return new ServerAuthAccept();
        case 0x0a:
            return new ServerAccessDenied();
        case 0x3a:
            return new ServerNodeDefinitions();
        case 0x3d:
            return new ServerItemDefinitions();
        case 0x3c:
            return new ServerAnnounceMedia();
        case 0x38:
            return new ServerMedia();
        case 0x20:
            return new ServerBlockData();
        case 0x34:
            return new ServerMovePlayer();
        case 0x29:
            return new ServerTimeOfDay();
        case 0x2f:
            return new ServerChatMessage();
        case 0x41:
            return new ServerPrivileges();
        case 0x31:
            return new ServerActiveObjectRemoveAdd();
        case 0x49:
            return new ServerHudAdd();
        case 0x4b:
            return new ServerHudChange();
        case 0x4c:
            return new ServerHudSetFlags();
        case 0x4d:
            return new ServerHudSetParam();
        case 0x3f:
            return new ServerPlaySound();
        case 0x56:
            return new ServerUpdatePlayerList();
        case 0x27:
            return new ServerInventory();
        case 0x2b:
            return new ServerPlayerSpeed();
        case 0x2a:
            return new ServerCSMRestrictionFlags();
        case 0x32:
            return new ServerActiveObjectMessages();
        case 0x33:
            return new ServerHP();
        case 0x42:
            return new ServerInventoryFormspec();
        case 0x43:
            return new ServerDetachedInventory();
        case 0x44:
            return new ServerShowFormspec();
        case 0x45:
            return new ServerMovement();
        case 0x4e:
            return new ServerBreath();
        case 0x4f:
            return new ServerSetSky();
        case 0x50:
            return new ServerOverrideDayNightRatio();
        case 0x54:
            return new ServerCloudParams();
        case 0x5a:
            return new ServerSetSun();
        case 0x5b:
            return new ServerSetMoon();
        case 0x5c:
            return new ServerSetStars();
        case 0x61:
            return new ServerFormspecPrepend();
        case 0x63:
            return new ServerSetLighting();
        case 0x64:
            return new ServerSpawnParticleBatch();
    }
    return null;
}
