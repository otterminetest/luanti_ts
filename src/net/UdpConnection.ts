import * as dgram from "node:dgram";
import { EventEmitter } from "node:events";

export class UdpConnection extends EventEmitter {
    private socket: dgram.Socket;
    public remoteHost: string;
    public remotePort: number;
    public isOpen = false;

    constructor(host: string, port: number) {
        super();
        this.remoteHost = host;
        this.remotePort = port;
        this.socket = dgram.createSocket("udp4");
        this.socket.on("message", (msg) => {
            this.emit("message", { data: msg });
        });
        this.socket.on("error", (err) => {
            this.emit("error", err);
        });
        this.socket.on("close", () => {
            this.isOpen = false;
            this.emit("close");
        });
    }

    open() {
        // No connect in udp, but bind for receiving
        if (!this.isOpen) {
            this.socket.bind(() => {
                this.isOpen = true;
                this.emit("open");
            });
        }
    }

    send(data: Buffer | Uint8Array) {
        this.socket.send(data, this.remotePort, this.remoteHost);
    }

    close() {
        this.socket.close();
    }
}
