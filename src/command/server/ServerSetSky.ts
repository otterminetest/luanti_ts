import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerSetSky implements ServerCommand {
    bgColor!: number;
    type!: string;
    clouds!: boolean;
    fogSunTint!: number;
    fogMoonTint!: number;
    fogTintType!: string;

    // Type specific
    skyboxTextures = new Array<string>();
    skyColor = {
        daySky: 0,
        dayHorizon: 0,
        dawnSky: 0,
        dawnHorizon: 0,
        nightSky: 0,
        nightHorizon: 0,
        indoors: 0,
    };

    // Optional
    bodyOrbitTilt?: number;
    fogDistance?: number;
    fogStart?: number;
    fogColor?: number;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        this.bgColor = dv.getUint32(offset);
        offset += 4;
        this.type = ph.getString(offset);
        offset += 2 + this.type.length;
        this.clouds = ph.getBool(offset);
        offset += 1;
        this.fogSunTint = dv.getUint32(offset);
        offset += 4;
        this.fogMoonTint = dv.getUint32(offset);
        offset += 4;
        this.fogTintType = ph.getString(offset);
        offset += 2 + this.fogTintType.length;

        if (this.type === "skybox") {
            const count = dv.getUint16(offset);
            offset += 2;
            for (let i = 0; i < count; i++) {
                const tex = ph.getString(offset);
                offset += 2 + tex.length;
                this.skyboxTextures.push(tex);
            }
        } else if (this.type === "regular") {
            this.skyColor.daySky = dv.getUint32(offset);
            offset += 4;
            this.skyColor.dayHorizon = dv.getUint32(offset);
            offset += 4;
            this.skyColor.dawnSky = dv.getUint32(offset);
            offset += 4;
            this.skyColor.dawnHorizon = dv.getUint32(offset);
            offset += 4;
            this.skyColor.nightSky = dv.getUint32(offset);
            offset += 4;
            this.skyColor.nightHorizon = dv.getUint32(offset);
            offset += 4;
            this.skyColor.indoors = dv.getUint32(offset);
            offset += 4;
        }

        if (offset + 4 <= dv.byteLength) {
            this.bodyOrbitTilt = dv.getFloat32(offset);
            offset += 4;
        }

        if (offset + 8 <= dv.byteLength) {
            this.fogDistance = dv.getFloat32(offset);
            offset += 4;
            this.fogStart = dv.getFloat32(offset);
            offset += 4;
        }

        if (offset + 4 <= dv.byteLength) {
            this.fogColor = dv.getUint32(offset);
            offset += 4;
        }
    }
}
