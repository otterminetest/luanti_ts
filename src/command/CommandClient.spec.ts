import { env } from "node:process";
import srp from "secure-remote-password/client";
import { UdpConnection } from "../net/UdpConnection.js";
import { arrayToHex, hexToArray } from "../util/hex.js";
import { CommandClient } from "./CommandClient.js";
import { ClientFirstSRP } from "./client/ClientFirstSRP.js";
import { ClientInit } from "./client/ClientInit.js";
import { ClientInit2 } from "./client/ClientInit2.js";
import { ClientSRPBytesA } from "./client/ClientSRPBytesA.js";
import { ClientSRPBytesM } from "./client/ClientSRPBytesM.js";
import { PacketType } from "./packet/types.js";
import { ServerAuthAccept } from "./server/ServerAuthAccept.js";
import { ServerHello } from "./server/ServerHello.js";
import { ServerSRPBytesSB } from "./server/ServerSRPBytesSB.js";

describe("CommandClient", () => {
    if (env.INTEGRATION_TEST !== "true") {
        test("skip", () => {});
    }

    test("connect", (done) => {
        const host = "minetest";
        const port = 30000;

        const username = "test";
        const password = "enter";

        console.debug("connecting");
        const ws = new UdpConnection(host, port);
        ws.open();
        const cc = new CommandClient(ws);

        const eph = srp.generateEphemeral();

        cc.ready
            .then(() => cc.peerInit())
            .then(() => new Promise((resolve) => setTimeout(resolve, 1000)))
            .then(() =>
                cc.exchangeCommand(new ClientInit(username), PacketType.Original, ServerHello),
            )
            .then((sh) => {
                if (sh.authMechanismFirstSrp) {
                    const salt = srp.generateSalt();
                    const private_key = srp.derivePrivateKey(salt, username, password);
                    const verifier = srp.deriveVerifier(private_key);
                    const cmd = new ClientFirstSRP(hexToArray(salt), hexToArray(verifier));
                    return cc.exchangeCommand(cmd, PacketType.Reliable, ServerSRPBytesSB);
                }
                const cmd = new ClientSRPBytesA(hexToArray(eph.public));
                return cc.exchangeCommand(cmd, PacketType.Reliable, ServerSRPBytesSB);
            })
            .then((cmd) => {
                const serverSalt = arrayToHex(cmd.bytesS);
                const serverPublic = arrayToHex(cmd.bytesB);

                const privateKey = srp.derivePrivateKey(serverSalt, username, password);
                const clientSession = srp.deriveSession(
                    eph.secret,
                    serverPublic,
                    serverSalt,
                    username,
                    privateKey,
                );

                const proof = hexToArray(clientSession.proof);
                return cc.exchangeCommand(
                    new ClientSRPBytesM(proof),
                    PacketType.Reliable,
                    ServerAuthAccept,
                );
            })
            .then((cmd) => {
                expect(cmd.posX !== undefined).toBeTruthy();
                expect(cmd.posY !== undefined).toBeTruthy();
                expect(cmd.posZ !== undefined).toBeTruthy();
                expect(cmd.seed.length).toBeGreaterThan(0);
                expect(cmd.sendInterval).toBeGreaterThan(0);
                return cc.sendCommand(new ClientInit2());
            })
            //.then(() => new Promise(resolve => setTimeout(resolve, 2000)))
            .then(() => {
                done();
            })
            .catch((e) => {
                done(e);
            })
            .finally(() => {
                cc.close();
            });
    });
});
