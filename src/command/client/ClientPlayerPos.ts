import { PlayerControlKeys } from "../../util/keys.js";
import { Pos, type PosType } from "../../util/pos.js";
import type { ClientCommand } from "../ClientCommand.js";
import { PayloadBuilder } from "../packet/PayloadBuilder.js";

export interface PlayerPosOptions {
    pos: Pos<PosType.Entity>;
    speed?: Pos<PosType.Entity>;
    pitch?: number; // In degrees
    yaw?: number; // In degrees
    keyPressed?: number; // Bitmask from PlayerControlKeys
    fov?: number; // In radians (default is approx 72 degrees)
    wantedRange?: number; // In map blocks (usually chunks)
    cameraInverted?: boolean;
    movementSpeed?: number;
    movementDir?: number;
}

export class ClientPlayerPos implements ClientCommand {
    pos: Pos<PosType.Entity>;
    speed: Pos<PosType.Entity>;
    pitch: number;
    yaw: number;
    keyPressed: number;
    fov: number;
    wantedRange: number;
    cameraInverted: boolean;
    movementSpeed: number;
    movementDir: number;

    constructor(options: PlayerPosOptions) {
        this.pos = options.pos;
        this.speed = options.speed || new Pos(0, 0, 0);
        this.pitch = options.pitch || 0;
        this.yaw = options.yaw || 0;
        this.keyPressed = options.keyPressed || PlayerControlKeys.None;
        // Default FOV ~72 degrees (1.25 rad), Default Range 0
        this.fov = options.fov || 1.25;
        this.wantedRange = options.wantedRange || 0;
        this.cameraInverted = options.cameraInverted || false;
        this.movementSpeed = options.movementSpeed || 0;
        this.movementDir = options.movementDir || 0;
    }

    getCommandID(): number {
        return 0x23;
    }

    marshalPacket(): Uint8Array {
        // Size calculation based on C++ struct:
        // v3s32(12) + v3s32(12) + s32(4) + s32(4) + u32(4) + u8(1) + u8(1) + u8(1) + f32(4) + f32(4)
        // Total: 47 bytes
        const pb = new PayloadBuilder(47);
        ClientPlayerPos.appendPlayerPos(pb, this);
        return pb.toUint8Array();
    }

    /**
     * Shared serialization logic used by ClientPlayerPos and ClientInteract
     * Matches void writePlayerPos in serverpackethandler.cpp
     */
    static appendPlayerPos(pb: PayloadBuilder, state: ClientPlayerPos) {
        // [0] v3s32 position * 100
        pb.appendInt32(Math.round(state.pos.x * 100));
        pb.appendInt32(Math.round(state.pos.y * 100));
        pb.appendInt32(Math.round(state.pos.z * 100));

        // [12] v3s32 speed * 100
        pb.appendInt32(Math.round(state.speed.x * 100));
        pb.appendInt32(Math.round(state.speed.y * 100));
        pb.appendInt32(Math.round(state.speed.z * 100));

        // [24] s32 pitch * 100
        pb.appendInt32(Math.round(state.pitch * 100));

        // [28] s32 yaw * 100
        pb.appendInt32(Math.round(state.yaw * 100));

        // [32] u32 keyPressed
        pb.appendUint32(state.keyPressed);

        // [36] u8 fov * 80 (clamped to 255)
        const fovScaled = Math.min(255, Math.round(state.fov * 80.0));
        pb.appendUint8(fovScaled);

        // [37] u8 wanted_range / MAP_BLOCKSIZE (16)
        // C++: std::ceil(clientMap->getWantedRange() * (1.0f / MAP_BLOCKSIZE))
        const rangeScaled = Math.min(255, Math.ceil(state.wantedRange));
        pb.appendUint8(rangeScaled);

        // [38] u8 camera_inverted
        pb.appendUint8(state.cameraInverted ? 1 : 0);

        // [39] f32 movement_speed
        pb.appendFloat32(state.movementSpeed);

        // [43] f32 movement_direction
        pb.appendFloat32(state.movementDir);
    }
}
