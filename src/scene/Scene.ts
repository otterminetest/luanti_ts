import type { Client } from "../Client.js";
import { ClientGotBlocks } from "../command/client/ClientGotBlocks.js";
import { ClientPlayerPos } from "../command/client/ClientPlayerPos.js";
import { PacketType } from "../command/packet/types.js";
import { ServerMovePlayer } from "../command/server/ServerMovePlayer.js";
import { ServerPlayerSpeed } from "../command/server/ServerPlayerSpeed.js";
import { PlayerControlKeys } from "../util/keys.js";
import Logger from "../util/logger.js";
import { Pos, type PosType } from "../util/pos.js";
import { EntityManager } from "./EntityManager.js";
import type { WorldMap } from "./WorldMap.js";

export class Scene {
    pos = new Pos<PosType.Entity>(0, 0, 0);
    speed = new Pos<PosType.Entity>(0, 0, 0);
    pitch = 0;
    yaw = 0;
    keyPressed = PlayerControlKeys.None;
    fov = 255;
    wantedRange = 255;
    cameraInverted = false;
    movementSpeed = 0;
    movementDir = 0;

    em: EntityManager;

    private log = Logger.get("Scene");
    private hasReceivedPos = false;

    private lastSent = {
        pos: new Pos<PosType.Entity>(0, 0, 0),
        speed: new Pos<PosType.Entity>(0, 0, 0),
        pitch: 0,
        yaw: 0,
        keyPressed: 0,
        fov: 0,
        wantedRange: 0,
        cameraInverted: false,
        movementSpeed: 0,
        movementDir: 0,
    };

    private playerPosRepeatCount = 0;

    constructor(
        public client: Client,
        public wm: WorldMap,
    ) {
        this.em = new EntityManager(client);

        wm.events.on("BlockAdded", (b) => {
            const gotblocks = new ClientGotBlocks([b.pos]);
            client.cc.sendCommand(gotblocks, PacketType.Original);
        });

        client.cc.events.on("ServerCommand", (cmd) => {
            if (cmd instanceof ServerMovePlayer) {
                this.pos = new Pos<PosType.Entity>(cmd.posX, cmd.posY, cmd.posZ);
                this.pitch = cmd.pitch;
                this.yaw = cmd.yaw;

                this.hasReceivedPos = true;

                this.log.debug(`Server corrected pos to ${this.pos}`);

                client.events.emit(
                    "PlayerMove",
                    new Pos<PosType.Entity>(cmd.posX, cmd.posY, cmd.posZ),
                );
            } else if (cmd instanceof ServerPlayerSpeed) {
                this.speed = new Pos<PosType.Entity>(
                    this.speed.x + cmd.addedVel.x,
                    this.speed.y + cmd.addedVel.y,
                    this.speed.z + cmd.addedVel.z,
                );
                this.log.debug(
                    `Server added velocity: ${cmd.addedVel.x}, ${cmd.addedVel.y}, ${cmd.addedVel.z}`,
                );
            }
        });

        client.events.on("Tick", (c) => {
            this.sendPlayerPos(c);
        });

        client.events.on("PlayerMove", (p) => {
            this.pos = p;
            this.hasReceivedPos = true;
        });
    }

    private sendPlayerPos(client: Client) {
        if (!this.hasReceivedPos) {
            return;
        }

        const posChanged =
            this.pos.x !== this.lastSent.pos.x ||
            this.pos.y !== this.lastSent.pos.y ||
            this.pos.z !== this.lastSent.pos.z;

        const speedChanged =
            this.speed.x !== this.lastSent.speed.x ||
            this.speed.y !== this.lastSent.speed.y ||
            this.speed.z !== this.lastSent.speed.z;

        const identical =
            !posChanged &&
            !speedChanged &&
            this.pitch === this.lastSent.pitch &&
            this.yaw === this.lastSent.yaw &&
            this.keyPressed === this.lastSent.keyPressed &&
            this.fov === this.lastSent.fov &&
            this.cameraInverted === this.lastSent.cameraInverted &&
            this.wantedRange === this.lastSent.wantedRange &&
            this.movementSpeed === this.lastSent.movementSpeed &&
            this.movementDir === this.lastSent.movementDir;

        if (identical) {
            // If identical, we still send occasionally to prevent timeouts/desync
            this.playerPosRepeatCount++;
            if (this.playerPosRepeatCount >= 5) {
                return;
            }
        } else {
            this.playerPosRepeatCount = 0;
        }

        // Update Snapshot
        this.lastSent.pos = new Pos(this.pos.x, this.pos.y, this.pos.z);
        this.lastSent.speed = new Pos(this.speed.x, this.speed.y, this.speed.z);
        this.lastSent.pitch = this.pitch;
        this.lastSent.yaw = this.yaw;
        this.lastSent.keyPressed = this.keyPressed;
        this.lastSent.fov = this.fov;
        this.lastSent.wantedRange = this.wantedRange;
        this.lastSent.cameraInverted = this.cameraInverted;
        this.lastSent.movementSpeed = this.movementSpeed;
        this.lastSent.movementDir = this.movementDir;

        // Send Packet
        client.cc.sendCommand(
            new ClientPlayerPos({
                pos: this.pos,
                speed: this.speed,
                pitch: this.pitch,
                yaw: this.yaw,
                keyPressed: this.keyPressed,
                fov: this.fov,
                wantedRange: this.wantedRange,
                cameraInverted: this.cameraInverted,
                movementSpeed: this.movementSpeed,
                movementDir: this.movementDir,
            }),
            PacketType.Original,
        );
    }
}
