import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export enum HudElementStat {
    Pos = 0,
    Name = 1,
    Scale = 2,
    Text = 3,
    Number = 4,
    Item = 5,
    Dir = 6,
    Align = 7,
    Offset = 8,
    WorldPos = 9,
    Size = 10,
    ZIndex = 11,
    Text2 = 12,
    Style = 13,
}

export class ServerHudChange implements ServerCommand {
    id!: number;
    stat!: HudElementStat;
    // biome-ignore lint/suspicious/noExplicitAny: variant type value
    value!: any;

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        this.id = dv.getUint32(offset);
        offset += 4;
        this.stat = dv.getUint8(offset);
        offset += 1;

        switch (this.stat) {
            case HudElementStat.Pos:
            case HudElementStat.Scale:
            case HudElementStat.Align:
            case HudElementStat.Offset:
                this.value = ph.getV2F(offset);
                break;
            case HudElementStat.Name:
            case HudElementStat.Text:
            case HudElementStat.Text2:
                this.value = ph.getString(offset);
                break;
            case HudElementStat.Number:
            case HudElementStat.Item:
            case HudElementStat.Dir:
            case HudElementStat.Style: // u32 in newer protocols, typically
                this.value = dv.getUint32(offset);
                break;
            case HudElementStat.WorldPos:
                this.value = ph.getV3F(offset);
                break;
            case HudElementStat.Size:
                this.value = { x: dv.getInt32(offset), y: dv.getInt32(offset + 4) };
                break;
            case HudElementStat.ZIndex:
                this.value = dv.getInt16(offset);
                break;
            default:
                // Unknown stat type, we can't parse safely without knowing the type size.
                // However, most types are handled above.
                break;
        }
    }
}
