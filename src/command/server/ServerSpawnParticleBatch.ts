import { decompress } from "fzstd";
import { ParticleParameters } from "../../particle/ParticleTypes.js";
import Logger from "../../util/logger.js";
import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export class ServerSpawnParticleBatch implements ServerCommand {
    particles = new Array<ParticleParameters>();
    private log = Logger.get("ServerSpawnParticleBatch");

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        // 1. Read the compressed LongString containing the batch
        const compressedLen = dv.getUint32(offset);
        offset += 4;

        if (offset + compressedLen > dv.byteLength) {
            this.log.error(`Invalid length: ${compressedLen} vs ${dv.byteLength - offset}`);
            return;
        }

        const compressedData = new Uint8Array(dv.buffer, dv.byteOffset + offset, compressedLen);

        let decompressedData: Uint8Array;
        try {
            decompressedData = decompress(compressedData);
        } catch (e) {
            this.log.error("Decompression failed", e);
            return;
        }

        // 2. Iterate over the decompressed stream
        const batchDv = new DataView(
            decompressedData.buffer,
            decompressedData.byteOffset,
            decompressedData.byteLength,
        );
        let batchOffset = 0;

        let pIndex = 0;
        while (batchOffset < batchDv.byteLength) {
            if (batchOffset + 4 > batchDv.byteLength) break;

            const particleDataLen = batchDv.getUint32(batchOffset);
            batchOffset += 4;

            if (batchOffset + particleDataLen > batchDv.byteLength) {
                this.log.warn(`Particle data buffer overflow at index ${pIndex}`);
                break;
            }

            const particleDv = new DataView(
                batchDv.buffer,
                batchDv.byteOffset + batchOffset,
                particleDataLen,
            );

            const p = new ParticleParameters();
            try {
                p.deSerialize(particleDv, 0);
                this.particles.push(p);
            } catch (e) {
                this.log.error(`Error parsing particle ${pIndex} (len=${particleDataLen})`, e);
            }

            batchOffset += particleDataLen;
            pIndex++;
        }

        this.log.debug(`Spawning ${this.particles.length} particles`);
    }
}
