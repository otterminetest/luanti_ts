import { ServerAccessDenied } from "./server/ServerAccessDenied.js"
import { ServerAnnounceMedia } from "./server/ServerAnnounceMedia.js"
import { ServerAuthAccept } from "./server/ServerAuthAccept.js"
import { ServerBlockData } from "./server/ServerBlockData.js"
import { ServerChatMessage } from "./server/ServerChatMessage.js"
import { ServerHello } from "./server/ServerHello.js"
import { ServerMedia } from "./server/ServerMedia.js"
import { ServerMovePlayer } from "./server/ServerMovePlayer.js"
import { ServerNodeDefinitions } from "./server/ServerNodeDefinitions.js"
import { ServerPrivileges } from "./server/ServerPrivileges.js"
import { ServerSRPBytesSB } from "./server/ServerSRPBytesSB.js"
import { ServerTimeOfDay } from "./server/ServerTimeOfDay.js"

export interface ServerCommand {
    unmarshalPacket(dv: DataView): void
}

export function getServerCommand(commandId: number): ServerCommand | null {
    switch (commandId) {
        case 0x02: return new ServerHello
        case 0x60: return new ServerSRPBytesSB
        case 0x03: return new ServerAuthAccept
        case 0x0A: return new ServerAccessDenied
        case 0x3A: return new ServerNodeDefinitions
        case 0x3C: return new ServerAnnounceMedia
        case 0x38: return new ServerMedia
        case 0x20: return new ServerBlockData
        case 0x34: return new ServerMovePlayer
        case 0x29: return new ServerTimeOfDay
        case 0x2F: return new ServerChatMessage
        case 0x41: return new ServerPrivileges
    }
    return null
}