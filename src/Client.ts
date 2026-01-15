import { EventEmitter } from "node:events";
import {
    derivePrivateKey,
    deriveSession,
    deriveVerifier,
    generateEphemeral,
    generateSalt,
} from "secure-remote-password/client.js";
import type TypedEmitter from "typed-emitter";
import { CommandClient } from "./command/CommandClient.js";
import type { ServerCommand } from "./command/ServerCommand.js";
import { ActiveObjectType } from "./command/activeobject/ActiveObjectTypes.js";
import { GenericCAOInitData } from "./command/activeobject/GenericCAOInitData.js";
import { ClientFirstSRP } from "./command/client/ClientFirstSRP.js";
import { ClientInit } from "./command/client/ClientInit.js";
import { ClientInit2 } from "./command/client/ClientInit2.js";
import { ClientReady } from "./command/client/ClientReady.js";
import { ClientRequestMedia } from "./command/client/ClientRequestMedia.js";
import { ClientSRPBytesA } from "./command/client/ClientSRPBytesA.js";
import { ClientSRPBytesM } from "./command/client/ClientSRPBytesM.js";
import { PacketType } from "./command/packet/types.js";
import { ServerAccessDenied } from "./command/server/ServerAccessDenied.js";
import { ServerActiveObjectRemoveAdd } from "./command/server/ServerActiveObjectRemoveAdd.js";
import { ServerAnnounceMedia } from "./command/server/ServerAnnounceMedia.js";
import { ServerAuthAccept } from "./command/server/ServerAuthAccept.js";
import { ServerHello } from "./command/server/ServerHello.js";
import { ServerInventory } from "./command/server/ServerInventory.js";
import { ServerMedia } from "./command/server/ServerMedia.js";
import { ServerMovePlayer } from "./command/server/ServerMovePlayer.js";
import { ServerNodeDefinitions } from "./command/server/ServerNodeDefinitions.js";
import { ServerSRPBytesSB } from "./command/server/ServerSRPBytesSB.js";
import { Inventory } from "./inventory/Inventory.js";
import { IndexedDBMediaManager } from "./media/IndexedDBMediaManager.js";
import type { MediaManager } from "./media/MediaManager.js";
import { UdpConnection } from "./net/UdpConnection.js";
import type { NodeDefinition } from "./nodedefs/NodeDefinition.js";
import { ParseNodeDefinitions } from "./nodedefs/parser.js";
import { Scene } from "./scene/Scene.js";
import { WorldMap } from "./scene/WorldMap.js";
import { arrayToHex, hexToArray } from "./util/hex.js";
import { Pos, type PosType } from "./util/pos.js";

type ClientEvents = {
    Tick: (c: Client) => void;
    PlayerMove: (p: Pos<PosType.Entity>) => void;
    LocalPlayerInit: (id: number, data: GenericCAOInitData) => void;
    InventoryUpdated: (inv: Inventory) => void;
};

type CommandConstructor<T extends ServerCommand> = new (...args: unknown[]) => T;

export class Client {
    constructor(host: string, port: number) {
        const udp = new UdpConnection(host, port);
        udp.open();
        this.cc = new CommandClient(udp);
        const wm = new WorldMap(this.cc, this.nodedefs);
        new Scene(this, wm);

        this.mediamanager = new IndexedDBMediaManager();

        this.cc.events.on("close", () => {
            if (this.tickhandle) clearInterval(this.tickhandle);
        });

        this.media_ready = new Promise((resolve, reject) => {
            let name_to_hash = new Map<string, string>();
            const cached_names = new Map<string, boolean>();
            const missing_names = new Map<string, boolean>();

            this.cc.events.on("ServerCommand", (cmd) => {
                if (cmd instanceof ServerAnnounceMedia) {
                    const filenameList = Array.from(cmd.hashes.keys());
                    const missing_filenames = new Array<string>();

                    // populate name-hash map
                    name_to_hash = cmd.hashes;

                    const promises = filenameList
                        // biome-ignore lint/style/noNonNullAssertion: filename comes from keys()
                        .map((filename) => cmd.hashes.get(filename)!)
                        .map((hash) => this.mediamanager.hasMedia(hash));

                    Promise.all(promises).then((hasMediaList) => {
                        for (let i = 0; i < hasMediaList.length; i++) {
                            const filename = filenameList[i];
                            const hasMedia = hasMediaList[i];
                            if (!hasMedia) {
                                missing_filenames.push(filename);
                                missing_names.set(filename, true);
                            }
                        }

                        if (missing_filenames.length > 0) {
                            console.debug(`Requesting ${missing_filenames.length} media files`);
                            const crm = new ClientRequestMedia();
                            crm.names = missing_filenames;
                            this.cc.sendCommand(crm, PacketType.Reliable, 10000).catch((e) => {
                                console.error("Media Request Failed/Timed out:", e);
                            });
                        } else {
                            console.debug("All media files present");
                            resolve();
                        }
                    });
                } else if (cmd instanceof ServerMedia) {
                    for (const [name, buf] of cmd.files) {
                        if (cached_names.has(name)) {
                            // skip fast
                            return;
                        }
                        cached_names.set(name, true);
                        missing_names.delete(name);
                        // biome-ignore lint/style/noNonNullAssertion: logic ensures name exists
                        const hash = name_to_hash.get(name)!;
                        console.debug(
                            `Adding '${name}'/'${hash}' (${buf.length} bytes) to mediamanager`,
                        );
                        // biome-ignore lint/suspicious/noExplicitAny: workaround for Blob type mismatch
                        this.mediamanager.addMedia(hash, name, new Blob([buf as any]));
                    }

                    if (missing_names.size === 0) {
                        resolve();
                    }
                } else if (cmd instanceof ServerMovePlayer) {
                    this.events.emit(
                        "PlayerMove",
                        new Pos<PosType.Entity>(cmd.posX, cmd.posY, cmd.posZ),
                    );
                } else if (cmd instanceof ServerActiveObjectRemoveAdd) {
                    for (const obj of cmd.addedObjects) {
                        // only care if it's Generic and we have parsed data
                        if (
                            obj.type === ActiveObjectType.GENERIC &&
                            obj.data instanceof GenericCAOInitData
                        ) {
                            const initData = obj.data;

                            // check if object is player and is me
                            if (initData.isPlayer && initData.name === this.username) {
                                console.debug(
                                    `[Client] Local player object initialized. ID: ${obj.id}`,
                                );
                                this.localPlayerId = obj.id;
                                this.localPlayerInitData = initData;
                                this.events.emit("LocalPlayerInit", obj.id, initData);
                            }
                        }
                    }
                } else if (cmd instanceof ServerInventory) {
                    console.debug("[Client] Received ServerInventory update");
                    try {
                        this.inventory.deSerialize(cmd.inventoryString);
                        this.events.emit("InventoryUpdated", this.inventory);
                    } catch (e) {
                        console.error("[Client] Failed to update inventory:", e);
                    }
                }
            });
        });

        this.nodedefs_ready = new Promise((resolve, reject) => {
            this.cc.events.on("ServerCommand", (cmd) => {
                if (cmd instanceof ServerNodeDefinitions) {
                    try {
                        console.debug("Parsing Node Definitions...");
                        const deflist = ParseNodeDefinitions(cmd);
                        for (const def of deflist) {
                            this.nodedefs.set(def.id, def);
                        }
                        console.debug(`Parsed ${deflist.length} node definitions.`);
                        resolve();
                    } catch (e) {
                        console.error("Failed to parse Node Definitions:", e);
                        reject(new Error("Node Definition Parsing Failed"));
                    }
                }
            });
        });
    }

    cc: CommandClient;

    media_ready: Promise<void>;
    nodedefs_ready: Promise<void>;

    events = new EventEmitter() as TypedEmitter<ClientEvents>;

    eph = generateEphemeral();
    nodedefs = new Map<number, NodeDefinition>();
    mediamanager: MediaManager;
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
                    return this.nodedefs_ready; //media_ready
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
