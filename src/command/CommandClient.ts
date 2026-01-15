import type { UdpConnection } from "../net/UdpConnection.js";
import type { ClientCommand } from "./ClientCommand.js";
import { type ServerCommand, getServerCommand } from "./ServerCommand.js";
import { ClientInit } from "./client/ClientInit.js";
import type { Packet } from "./packet/Packet.js";
import { marshal, unmarshal } from "./packet/marshal.js";
import {
    createAck,
    createCommandPacket,
    createDisconnect,
    createPeerInit,
} from "./packet/packetfactory.js";
import { setSeqNr } from "./packet/sequence.js";
import { SplitPacketHandler } from "./packet/splitpackethandler.js";
import { ControlType, PacketType } from "./packet/types.js";

import { EventEmitter } from "node:events";
import type TypedEmitter from "typed-emitter";
import { dataViewToHexDump } from "../util/hex.js";

type CommandClientEvents = {
    ServerCommand: (c: ServerCommand) => void;
    ServerPacket: (p: Packet) => void;
    close: () => void;
};

type Constructor<T> = new (...args: unknown[]) => T;

export class CommandClient {
    peerId = 0;
    splitHandler = new SplitPacketHandler();
    events = new EventEmitter() as TypedEmitter<CommandClientEvents>;

    ready: Promise<void>;

    constructor(public ws: UdpConnection) {
        this.events.setMaxListeners(10000);

        this.ready = new Promise((resolve) => {
            console.debug("socket opened");
            ws.on("open", () => resolve());
        });

        ws.on("message", (ev) => {
            try {
                if (ev.data instanceof Blob) {
                    ev.data.arrayBuffer().then((ab: ArrayBuffer) => {
                        try {
                            this.onMessage(ab);
                        } catch (e) {
                            console.error("onMessage error", e);
                        }
                    });
                } else if (ev.data instanceof Buffer) {
                    try {
                        this.onMessage(ev.data);
                    } catch (e) {
                        console.error("onMessage error", e);
                    }
                } else {
                    console.error("invalid event type: ", ev.data);
                }
            } catch (e) {
                console.error("ws.on(message) error", e);
            }
        });
    }

    private onMessage(ab: ArrayBuffer) {
        const buf = new Uint8Array(ab);
        const p = unmarshal(buf);
        //console.debug(`<<< Received ${buf.length} bytes: ${p}`)
        this.events.emit("ServerPacket", p);

        if (p.packetType === PacketType.Reliable) {
            // send ack
            const ack = createAck(p, this.peerId);
            ack.channel = p.channel;
            this.sendPacket(ack).catch(() => {}); // ACKs don't need ACKs

            if (p.subType === PacketType.Original) {
                this.parseCommandPayload(p.payloadView);
            }

            if (p.subType === PacketType.Split) {
                const payload = this.splitHandler.AddSplitPacket(p);
                if (payload != null) {
                    // all split parts arrived
                    this.parseCommandPayload(new DataView(payload.buffer));
                }
            }
        }
    }

    private parseCommandPayload(dv: DataView) {
        const cmdId = dv.getUint16(0);
        const cmd_dv = new DataView(dv.buffer, dv.byteOffset + 2);
        try {
            const cmd = getServerCommand(cmdId);
            if (cmd != null) {
                cmd.unmarshalPacket(cmd_dv);
                console.debug("received command", cmd);
                this.events.emit("ServerCommand", cmd);
            } else {
                console.debug(`Unknown command received: ${cmdId}`);
            }
        } catch (e) {
            console.error(`Error in command-id: ${cmdId}: ${e}`);
            console.error(`Packet-Dump: ${dataViewToHexDump(cmd_dv)}`);
            console.debug("Caught error, aborting");
            this.close();
        }
    }

    close() {
        if (this.ws.isOpen) {
            this.sendPacket(createDisconnect()).catch(() => {});
            this.ws.close();
        }
        this.events.emit("close");
    }

    sendPacket(p: Packet, timeout = 2000): Promise<void> {
        if (!this.ws.isOpen) {
            return Promise.reject(new Error("Socket is closed"));
        }

        p.peerId = this.peerId;
        const payload = marshal(p);
        //console.debug(`>>> Sent ${payload.length} bytes: ${p}`)
        this.ws.send(payload);

        if (p.packetType === PacketType.Reliable) {
            // wait for ACK
            return new Promise((resolve, reject) => {
                // biome-ignore lint/style/useConst: circular dependency between listener and handle
                let handle: NodeJS.Timeout;

                const listener = (rxp: Packet) => {
                    if (
                        rxp.packetType === PacketType.Control &&
                        rxp.controlType === ControlType.Ack &&
                        rxp.seqNr === p.seqNr
                    ) {
                        this.events.off("ServerPacket", listener);
                        clearTimeout(handle);
                        resolve();
                    }
                };

                handle = setTimeout(() => {
                    reject(new Error(`Timed out while waiting ${timeout} ms for packet ${p}`));
                    // timed out, clean up
                    this.events.off("ServerPacket", listener);
                }, timeout);

                this.events.on("ServerPacket", listener);
            });
        }
        return Promise.resolve();
    }

    // biome-ignore lint/suspicious/noConfusingVoidType: Promise.all returns void[] here
    sendCommand(cmd: ClientCommand, type = PacketType.Reliable, timeout = 2000): Promise<void[]> {
        const packets = createCommandPacket(cmd, this.peerId, type || PacketType.Reliable);
        const promises = packets.map((p) => this.sendPacket(p, timeout));

        if (cmd instanceof ClientInit) {
            setSeqNr(65500 - 1);
        }

        return Promise.all(promises);
    }

    peerInit(timeout = 2000): Promise<void> {
        return new Promise((resolve, reject) => {
            this.sendPacket(createPeerInit());
            // biome-ignore lint/style/useConst: circular dependency
            let handle: NodeJS.Timeout;

            const listener = (p: Packet) => {
                if (
                    p.packetType === PacketType.Reliable &&
                    p.controlType === ControlType.SetPeerID
                ) {
                    this.peerId = p.peerId;
                    console.debug(`Set peerId to ${this.peerId}`);
                    this.events.off("ServerPacket", listener);
                    clearTimeout(handle);
                    resolve();
                }
            };

            handle = setTimeout(() => {
                reject(`Timed out while waiting ${timeout} ms for peer-init`);
                // timed out, clean up
                this.events.off("ServerPacket", listener);
            }, timeout);

            this.events.on("ServerPacket", listener);
        });
    }

    waitForCommand<T extends ServerCommand>(
        types: Constructor<T> | Constructor<T>[],
        timeout = 2000,
    ): Promise<T> {
        const typeArray = Array.isArray(types) ? types : [types];

        return new Promise<T>((resolve, reject) => {
            // biome-ignore lint/style/useConst: circular dependency
            let handle: NodeJS.Timeout;
            const listener = (c: ServerCommand) => {
                // Check if received command matches any of the expected types
                for (const t of typeArray) {
                    if (c instanceof t) {
                        this.events.off("ServerCommand", listener);
                        clearTimeout(handle);
                        resolve(c as T);
                        return;
                    }
                }
            };

            handle = setTimeout(() => {
                const names = typeArray.map((t) => t.name).join(" or ");
                reject(`Timed out while waiting ${timeout} ms for ${names}`);
                this.events.off("ServerCommand", listener);
            }, timeout);

            this.events.on("ServerCommand", listener);
        });
    }

    exchangeCommand<T extends ServerCommand>(
        cmd: ClientCommand,
        type: PacketType,
        expected: Constructor<T> | Constructor<T>[],
        timeout = 2000,
    ): Promise<T> {
        // Start listening *before* sending to avoid race conditions
        const p = this.waitForCommand(expected, timeout);
        this.sendCommand(cmd, type, timeout).catch((e) => {
            // If sending fails, we should probably stop waiting?
            // For now, let the timeout handle it or user handle rejection.
            console.error("Failed to send command during exchange", e);
        });
        return p;
    }
}
