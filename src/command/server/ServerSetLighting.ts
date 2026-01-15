import type { ServerCommand } from "../ServerCommand.js";

export class ServerSetLighting implements ServerCommand {
    shadowIntensity?: number;
    saturation?: number;
    // Exposure
    luminanceMin?: number;
    luminanceMax?: number;
    exposureCorrection?: number;
    speedDarkBright?: number;
    speedBrightDark?: number;
    centerWeightPower?: number;

    volumetricLightStrength?: number;
    shadowTint?: number;

    // Bloom
    bloomIntensity?: number;
    bloomStrengthFactor?: number;
    bloomRadius?: number;

    unmarshalPacket(dv: DataView): void {
        let offset = 0;

        if (offset + 4 <= dv.byteLength) {
            this.shadowIntensity = dv.getFloat32(offset);
            offset += 4;
        }
        if (offset + 4 <= dv.byteLength) {
            this.saturation = dv.getFloat32(offset);
            offset += 4;
        }
        if (offset + 24 <= dv.byteLength) {
            this.luminanceMin = dv.getFloat32(offset);
            offset += 4;
            this.luminanceMax = dv.getFloat32(offset);
            offset += 4;
            this.exposureCorrection = dv.getFloat32(offset);
            offset += 4;
            this.speedDarkBright = dv.getFloat32(offset);
            offset += 4;
            this.speedBrightDark = dv.getFloat32(offset);
            offset += 4;
            this.centerWeightPower = dv.getFloat32(offset);
            offset += 4;
        }
        if (offset + 4 <= dv.byteLength) {
            this.volumetricLightStrength = dv.getFloat32(offset);
            offset += 4;
        }
        if (offset + 4 <= dv.byteLength) {
            this.shadowTint = dv.getUint32(offset);
            offset += 4;
        }
        if (offset + 12 <= dv.byteLength) {
            this.bloomIntensity = dv.getFloat32(offset);
            offset += 4;
            this.bloomStrengthFactor = dv.getFloat32(offset);
            offset += 4;
            this.bloomRadius = dv.getFloat32(offset);
            offset += 4;
        }
    }
}
