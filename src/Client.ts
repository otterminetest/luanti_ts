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
import { ServerItemDefinitions } from "./command/server/ServerItemDefinitions.js";
import { ServerNodeDefinitions } from "./command/server/ServerNodeDefinitions.js";
import { ServerSRPBytesSB } from "./command/server/ServerSRPBytesSB.js";
import { Inventory } from "./inventory/Inventory.js";
import type { ItemDefinition } from "./itemdefs/ItemDefinition.js";
import { getDigParams } from "./itemdefs/ItemDefinition.js";
import { ParseItemDefinitions } from "./itemdefs/parser.js";
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
        this.wm = new WorldMap(this.cc, this.nodedefs);
        this.scene = new Scene(this, this.wm);

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
                            this.nodeNameMap.set(def.name, def.id);
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

        this.itemdefs_ready = new Promise((resolve, reject) => {
            this.cc.events.on("ServerCommand", (cmd) => {
                if (cmd instanceof ServerItemDefinitions) {
                    try {
                        this.log.debug("Parsing Item Definitions...");
                        const { items, aliases } = ParseItemDefinitions(cmd, this.protocolVersion);
                        this.itemdefs = items;
                        this.itemAliases = aliases;
                        this.log.debug(
                            `Parsed ${items.size} item definitions and ${aliases.size} aliases.`,
                        );
                        resolve();
                    } catch (e) {
                        this.log.error("Failed to parse Item Definitions:", e);
                        reject(new Error("Item Definition Parsing Failed"));
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
    wm: WorldMap;
    scene: Scene;
    mediaManager?: MediaManager;

    media_ready: Promise<void>;
    nodedefs_ready: Promise<void>;
    itemdefs_ready: Promise<void>;

    events = new EventEmitter() as TypedEmitter<ClientEvents>;

    eph = generateEphemeral();
    nodedefs = new Map<number, NodeDefinition>();
    nodeNameMap = new Map<string, number>();
    itemdefs = new Map<string, ItemDefinition>();
    itemAliases = new Map<string, string>();

    protocolVersion = 0;

    tickhandle!: NodeJS.Timeout;

    // Inventory State
    inventory = new Inventory();

    // Player State
    username = "";
    localPlayerId = 0;
    localPlayerInitData?: GenericCAOInitData;

    /**
     * Calculates the time required to dig a specific node with a specific tool.
     * @param nodeName The name of the node (e.g., "mcl_core:obsidian")
     * @param toolName The name of the tool (e.g., "mcl_tools:pick_wood")
     * @returns Time in seconds, or Infinity if not diggable.
     */
    getDigTime(nodeName: string, toolName: string): number {
        const nodeId = this.nodeNameMap.get(nodeName);
        if (nodeId === undefined) {
            this.log.warn(`Node '${nodeName}' not found in definitions.`);
            return Number.POSITIVE_INFINITY;
        }
        const nodeDef = this.nodedefs.get(nodeId);
        if (!nodeDef) return Number.POSITIVE_INFINITY;

        let actualToolName = toolName;
        if (this.itemAliases.has(toolName)) {
            actualToolName = this.itemAliases.get(toolName) || toolName;
        }

        let itemDef = this.itemdefs.get(actualToolName);

        if (!itemDef) {
            itemDef = this.itemdefs.get("");
        }

        let toolCaps = itemDef?.tool_capabilities;

        if (!toolCaps) {
            const hand = this.itemdefs.get("");
            toolCaps = hand?.tool_capabilities;
        }

        if (!toolCaps) {
            this.log.warn("No tool capabilities found.");
            return Number.POSITIVE_INFINITY;
        }

        const params = getDigParams(nodeDef.groups, toolCaps);
        if (!params.diggable) return Number.POSITIVE_INFINITY;
        return params.time;
    }

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
                    this.protocolVersion = sh.protocolVersion;
                    this.log.debug(`Server Protocol Version: ${this.protocolVersion}`);

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
                    // Wait for definitions and media
                    return Promise.all([
                        this.nodedefs_ready,
                        this.itemdefs_ready,
                        this.media_ready,
                    ]);
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
