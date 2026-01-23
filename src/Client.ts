import { EventEmitter } from "node:events";
import {
    derivePrivateKey,
    deriveSession,
    deriveVerifier,
    generateEphemeral,
    generateSalt,
} from "secure-remote-password/client.js";
import type TypedEmitter from "typed-emitter";
import { ActiveObjectType } from "./activeobject/ActiveObjectTypes.js";
import { GenericCAOInitData } from "./activeobject/GenericCAOInitData.js";
import { CommandClient } from "./command/CommandClient.js";
import type { ServerCommand } from "./command/ServerCommand.js";
import { ClientFirstSRP } from "./command/client/ClientFirstSRP.js";
import { ClientInit } from "./command/client/ClientInit.js";
import { ClientInit2 } from "./command/client/ClientInit2.js";
import { ClientReady } from "./command/client/ClientReady.js";
import { ClientSRPBytesA } from "./command/client/ClientSRPBytesA.js";
import { ClientSRPBytesM } from "./command/client/ClientSRPBytesM.js";
import { PacketType } from "./command/packet/types.js";
import { ServerAccessDenied } from "./command/server/ServerAccessDenied.js";
import { ServerActiveObjectRemoveAdd } from "./command/server/ServerActiveObjectRemoveAdd.js";
import { ServerAuthAccept } from "./command/server/ServerAuthAccept.js";
import { ServerHello } from "./command/server/ServerHello.js";
import { ServerInventory } from "./command/server/ServerInventory.js";
import { ServerNodeDefinitions } from "./command/server/ServerNodeDefinitions.js";
import { ServerSRPBytesSB } from "./command/server/ServerSRPBytesSB.js";
import { Inventory } from "./inventory/Inventory.js";
import { MediaManager } from "./media/MediaManager.js";
import { PouchDBMediaStore } from "./media/PouchDBMediaStore.js";
import { UdpConnection } from "./net/UdpConnection.js";
import type { NodeDefinition } from "./nodedefs/NodeDefinition.js";
import { ParseNodeDefinitions } from "./nodedefs/parser.js";
import { Scene } from "./scene/Scene.js";
import { WorldMap } from "./scene/WorldMap.js";
import { arrayToHex, hexToArray } from "./util/hex.js";
import Logger from "./util/logger.js";
import { Pos, type PosType } from "./util/pos.js";

type ClientEvents = {
    Tick: (c: Client) => void;
    PlayerMove: (p: Pos<PosType.Entity>) => void;
    LocalPlayerInit: (id: number, data: GenericCAOInitData) => void;
    InventoryUpdated: (inv: Inventory) => void;
};

type CommandConstructor<T extends ServerCommand> = new (...args: unknown[]) => T;

export interface ClientOptions {
    fetchMedia?: boolean;
}

export class Client {
    static Logger = Logger;

    private log = Logger.get("Client");

    constructor(host: string, port: number, options: ClientOptions = {}) {
        const { fetchMedia = true } = options;

        const udp = new UdpConnection(host, port);
        udp.open();
        this.cc = new CommandClient(udp);
        const wm = new WorldMap(this.cc, this.nodedefs);
        new Scene(this, wm);

        if (fetchMedia) {
            const mediaStore = new PouchDBMediaStore(`media_${host}_${port}`);
            this.mediaManager = new MediaManager(this, mediaStore);
            this.media_ready = this.mediaManager.waitForMedia();
        } else {
            this.media_ready = Promise.resolve();
        }

        this.cc.events.on("close", () => {
            if (this.tickhandle) clearInterval(this.tickhandle);
        });

        this.nodedefs_ready = new Promise((resolve, reject) => {
            this.cc.events.on("ServerCommand", (cmd) => {
                if (cmd instanceof ServerNodeDefinitions) {
                    try {
                        this.log.debug("Parsing Node Definitions...");
                        const deflist = ParseNodeDefinitions(cmd);
                        for (const def of deflist) {
                            this.nodedefs.set(def.id, def);
                        }
                        this.log.debug(`Parsed ${deflist.length} node definitions.`);
                        resolve();
                    } catch (e) {
                        this.log.error("Failed to parse Node Definitions:", e);
                        reject(new Error("Node Definition Parsing Failed"));
                    }
                }
            });
        });

        this.cc.events.on("ServerCommand", (cmd) => {
            if (cmd instanceof ServerActiveObjectRemoveAdd) {
                for (const obj of cmd.addedObjects) {
                    // only care if it's generic and we have parsed data
                    if (
                        obj.type === ActiveObjectType.GENERIC &&
                        obj.data instanceof GenericCAOInitData
                    ) {
                        const initData = obj.data;

                        // check if object is player and is me
                        if (initData.isPlayer && initData.name === this.username) {
                            this.log.debug(`Local player object initialized. ID: ${obj.id}`);
                            this.localPlayerId = obj.id;
                            this.localPlayerInitData = initData;
                            this.events.emit("LocalPlayerInit", obj.id, initData);
                        }
                    }
                }
            } else if (cmd instanceof ServerInventory) {
                this.log.debug("Received ServerInventory update");
                try {
                    this.inventory.deSerialize(cmd.inventoryString);
                    this.events.emit("InventoryUpdated", this.inventory);
                } catch (e) {
                    this.log.error("Failed to update inventory:", e);
                }
            }
        });
    }

    cc: CommandClient;
    mediaManager?: MediaManager;

    media_ready: Promise<void>;
    nodedefs_ready: Promise<void>;

    events = new EventEmitter() as TypedEmitter<ClientEvents>;

    eph = generateEphemeral();
    nodedefs = new Map<number, NodeDefinition>();
    tickhandle!: NodeJS.Timeout;

    // Inventory State
    inventory = new Inventory();

    // Player State
    username = "";
    localPlayerId = 0;
    localPlayerInitData?: GenericCAOInitData;

    login(username: string, password: string): Promise<void> {
        this.username = username;

        return new Promise((resolve, reject) => {
            const loginTimeout = setTimeout(() => {
                reject(new Error("Login process timed out"));
            }, 30000);

            this.cc.ready
                .then(() => this.cc.peerInit())
                .then(() => new Promise((resolve) => setTimeout(resolve, 1000)))
                .then(() =>
                    this.cc.exchangeCommand(
                        new ClientInit(username),
                        PacketType.Original,
                        ServerHello,
                    ),
                )
                .then((sh) => {
                    if (sh.authMechanismFirstSrp) {
                        const salt = generateSalt();
                        const private_key = derivePrivateKey(salt, username, password);
                        const verifier = deriveVerifier(private_key);
                        const cmd = new ClientFirstSRP(hexToArray(salt), hexToArray(verifier));
                        return this.cc.sendCommand(cmd);
                    }
                    const cmd = new ClientSRPBytesA(hexToArray(this.eph.public));
                    return this.cc.sendCommand(cmd);
                })
                .then(() => {
                    return this.cc.waitForCommand<
                        ServerSRPBytesSB | ServerAuthAccept | ServerAccessDenied
                    >([ServerSRPBytesSB, ServerAuthAccept, ServerAccessDenied]);
                })
                .then((response): Promise<ServerAuthAccept | ServerAccessDenied> => {
                    if (response instanceof ServerAccessDenied) {
                        throw new Error(
                            `Access Denied: ${response.errorMessage || response.reason}`,
                        );
                    }

                    if (response instanceof ServerAuthAccept) {
                        return Promise.resolve(response);
                    }

                    if (response instanceof ServerSRPBytesSB) {
                        const cmd = response;
                        const serverSalt = arrayToHex(cmd.bytesS);
                        const serverPublic = arrayToHex(cmd.bytesB);

                        const privateKey = derivePrivateKey(serverSalt, username, password);
                        const clientSession = deriveSession(
                            this.eph.secret,
                            serverPublic,
                            serverSalt,
                            username,
                            privateKey,
                        );

                        const proof = hexToArray(clientSession.proof);

                        type AuthResponse = ServerAuthAccept | ServerAccessDenied;

                        return this.cc.exchangeCommand<AuthResponse>(
                            new ClientSRPBytesM(proof),
                            PacketType.Reliable,
                            [
                                ServerAuthAccept,
                                ServerAccessDenied,
                            ] as CommandConstructor<AuthResponse>[],
                        );
                    }

                    throw new Error("Unexpected auth response state");
                })
                .then((response) => {
                    if (response instanceof ServerAccessDenied) {
                        throw new Error(
                            `Access Denied: ${response.errorMessage || response.reason}`,
                        );
                    }

                    if (response instanceof ServerAuthAccept) {
                        const aa = response;
                        this.events.emit(
                            "PlayerMove",
                            new Pos<PosType.Entity>(aa.posX, aa.posY, aa.posZ),
                        );
                        return this.cc.sendCommand(new ClientInit2());
                    }

                    throw new Error("Unexpected response after SRP Bytes M");
                })
                .then(() => {
                    clearTimeout(loginTimeout);
                    // Wait for both definitions and media
                    return Promise.all([this.nodedefs_ready, this.media_ready]);
                })
                .then(() => resolve())
                .catch((e) => {
                    clearTimeout(loginTimeout);
                    reject(e);
                });
        });
    }

    // biome-ignore lint/suspicious/noConfusingVoidType: this.cc.sendCommand returns void[]
    ready(): Promise<void[]> {
        this.tickhandle = setInterval(() => this.events.emit("Tick", this), 1);
        return this.cc.sendCommand(new ClientReady());
    }

    close() {
        if (this.tickhandle) clearInterval(this.tickhandle);
        this.cc.close();
    }
}
