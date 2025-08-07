import { 
    generateEphemeral,
    generateSalt,
    derivePrivateKey,
    deriveVerifier,
    deriveSession
} from "secure-remote-password/client.js"
import { arrayToHex, hexToArray } from "./util/hex.js";
import { ClientFirstSRP } from "./command/client/ClientFirstSRP.js";
import { ClientInit } from "./command/client/ClientInit.js";
import { ClientSRPBytesA } from "./command/client/ClientSRPBytesA.js";
import { ClientSRPBytesM } from "./command/client/ClientSRPBytesM.js";
import { CommandClient } from "./command/CommandClient.js";
import { PacketType } from "./command/packet/types.js";
import { ServerAccessDenied } from "./command/server/ServerAccessDenied.js";
import { ServerAuthAccept } from "./command/server/ServerAuthAccept.js";
import { ServerHello } from "./command/server/ServerHello.js";
import { ServerSRPBytesSB } from "./command/server/ServerSRPBytesSB.js";
import { NodeDefinition } from "./nodedefs/NodeDefinition.js";
import { ServerNodeDefinitions } from "./command/server/ServerNodeDefinitions.js";
import { ParseNodeDefinitions } from "./nodedefs/parser.js";
import { ServerAnnounceMedia } from "./command/server/ServerAnnounceMedia.js";
import { ClientRequestMedia } from "./command/client/ClientRequestMedia.js";
import { ServerMedia } from "./command/server/ServerMedia.js";
import { MediaManager } from "./media/MediaManager.js";
import { IndexedDBMediaManager } from "./media/IndexedDBMediaManager.js";
import { ClientInit2 } from "./command/client/ClientInit2.js";
import { ClientReady } from "./command/client/ClientReady.js";
import { Pos, PosType } from "./util/pos.js";
import { EventEmitter } from "events"
import TypedEmitter from "typed-emitter"
import { ServerMovePlayer } from "./command/server/ServerMovePlayer.js";
import { UdpConnection } from "./net/UdpConnection.js";
import { WorldMap } from "./scene/WorldMap.js";
import { Scene } from "./scene/Scene.js";

type ClientEvents = {
    Tick: (c: Client) => void
    PlayerMove: (p: Pos<PosType.Entity>) => void
}

export class Client {

    constructor(host: string, port: number) {
        const udp = new UdpConnection(host, port)
        udp.open()
        this.cc = new CommandClient(udp)
        const wm = new WorldMap(this.cc, this.nodedefs);
        new Scene(this, wm);
        
        this.mediamanager = new IndexedDBMediaManager()

        this.media_ready = new Promise((resolve, reject) => {
            let name_to_hash = new Map<string, string>()
            const cached_names = new Map<string, boolean>()
            const missing_names = new Map<string, boolean>()
    
            this.cc.events.on("ServerCommand", cmd => {
                if (cmd instanceof ServerAnnounceMedia) {
                    const filenameList = Array.from(cmd.hashes.keys())
                    const missing_filenames = new Array<string>
    
                    // populate name-hash map
                    name_to_hash = cmd.hashes
    
                    const promises = filenameList
                        .map(filename => cmd.hashes.get(filename)!)
                        .map(hash => this.mediamanager.hasMedia(hash))
                    
                    Promise.all(promises).then(hasMediaList => {
                        for (let i=0; i<hasMediaList.length; i++){
                            const filename = filenameList[i];
                            const hasMedia = hasMediaList[i];
                            if (!hasMedia) {
                                console.debug(`Adding ${filename} to requested media`)
                                missing_filenames.push(filename)
                                missing_names.set(filename, true)
                            }
                        }
    
                        if (missing_filenames.length > 0) {
                            // request missing media
                            console.debug(`Requesting ${missing_filenames.length} media files`)
                            const crm = new ClientRequestMedia()
                            crm.names = missing_filenames
                            this.cc.sendCommand(crm)
                        } else {
                            // got all media
                            console.debug("All media files present")
                            resolve()
                        }
                    })
    
                } else if (cmd instanceof ServerMedia) {
                    cmd.files.forEach((buf, name) => {
                        if (cached_names.has(name)){
                            // skip fast
                            return
                        }
                        cached_names.set(name, true)
                        missing_names.delete(name)
                        const hash = name_to_hash.get(name)!
                        console.debug(`Adding '${name}'/'${hash}' (${buf.length} bytes) to mediamanager`)
                        this.mediamanager.addMedia(hash, name, new Blob([buf]))
                    })
    
                    if (missing_names.size == 0) {
                        resolve()
                    }
                } else if (cmd instanceof ServerMovePlayer) {
                    this.events.emit("PlayerMove", new Pos<PosType.Entity>(cmd.posX, cmd.posY, cmd.posZ))
                }
            })
        })
    
        this.nodedefs_ready = new Promise((resolve, reject) => {
            this.cc.events.on("ServerCommand", cmd => {
                if (cmd instanceof ServerNodeDefinitions) {
                    const deflist = ParseNodeDefinitions(cmd)
                    deflist.forEach(def => this.nodedefs.set(def.id, def))
                    resolve()
                } 
            })
        })
    }

    cc: CommandClient;

    media_ready: Promise<void>
    nodedefs_ready: Promise<void>

    events = new EventEmitter() as TypedEmitter<ClientEvents>

    eph = generateEphemeral()
    nodedefs = new Map<number, NodeDefinition>
    mediamanager: MediaManager
    tickhandle!: NodeJS.Timer

    login(username: string, password: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.cc.events.once("ServerCommand", cmd => {
                if (cmd instanceof ServerAccessDenied) {
                    reject()
                }
            })

            this.cc.ready
            .then(() => this.cc.peerInit())
            .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
            .then(() => this.cc.exchangeCommand(new ClientInit(username), PacketType.Original, ServerHello))
            .then(sh => {
                if (sh.authMechanismFirstSrp) {
                    const salt = generateSalt()
                    const private_key = derivePrivateKey(salt, username, password)
                    const verifier = deriveVerifier(private_key)
                    const cmd = new ClientFirstSRP(hexToArray(salt), hexToArray(verifier))
                    return this.cc.exchangeCommand(cmd, PacketType.Reliable, ServerSRPBytesSB)
    
                } else {
                    const cmd = new ClientSRPBytesA(hexToArray(this.eph.public))
                    return this.cc.exchangeCommand(cmd, PacketType.Reliable, ServerSRPBytesSB)
                }
            })
            .then(cmd => {
                const serverSalt = arrayToHex(cmd.bytesS);
                const serverPublic = arrayToHex(cmd.bytesB);
        
                const privateKey = derivePrivateKey(serverSalt, username, password);
                const clientSession = deriveSession(this.eph.secret, serverPublic, serverSalt, username, privateKey);
        
                const proof = hexToArray(clientSession.proof);
                return this.cc.exchangeCommand(new ClientSRPBytesM(proof), PacketType.Reliable, ServerAuthAccept);
            })
            .then(aa => {
                this.events.emit("PlayerMove", new Pos<PosType.Entity>(aa.posX, aa.posY, aa.posZ))
                return this.cc.sendCommand(new ClientInit2())
            })
            .then(() => {
                return Promise.all([this.nodedefs_ready]) //media_ready
            })
            .then(() => resolve())
            .catch(e => reject(e))
        })
    }

    ready(): Promise<void[]> {
        this.tickhandle = setInterval(() => this.events.emit("Tick", this), 1)
        return this.cc.sendCommand(new ClientReady())

    }

    close() {
        clearInterval(this.tickhandle)
        this.cc.close()
    }
}