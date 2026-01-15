import { ClientInit } from "../client/ClientInit.js";
import { marshal } from "./marshal.js";
import { createCommandPacket, createPing } from "./packetfactory.js";
import { PacketType } from "./types.js";

describe("packetfactory", () => {
    test("creates a ping packet", () => {
        const p = createPing();
        const payload = marshal(p);
        expect(payload.length).toBe(11);
    });

    test("creates an init command", () => {
        const name = "test";
        const packets = createCommandPacket(new ClientInit(name), 0, PacketType.Original);
        expect(packets.length).toBe(1);

        const pkg = packets[0];
        const payload = marshal(pkg);
        const expected_size = 8 + 2 + 7 + 2 + name.length;
        expect(payload.length).toBe(expected_size);
    });
});
