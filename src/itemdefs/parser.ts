import { decompress } from "fzstd";
import { inflate } from "pako";
import { PayloadHelper } from "../command/packet/PayloadHelper.js";
import type { ServerItemDefinitions } from "../command/server/ServerItemDefinitions.js";
import {
    ItemDefinition,
    ItemImageDef,
    type ItemType,
    SimpleSoundSpec,
    TileAnimationParams,
    ToolCapabilities,
    ToolGroupCap,
    type TouchInteractionMode,
    type WearBarBlendMode,
    WearBarParams,
} from "./ItemDefinition.js";

function readItemImageDef(
    ph: PayloadHelper,
    offset: number,
    protocolVersion: number,
): [ItemImageDef, number] {
    const def = new ItemImageDef();
    let o = offset;
    def.name = ph.getString(o);
    o += 2 + def.name.length;

    if (protocolVersion >= 51) {
        def.animation = new TileAnimationParams();
        def.animation.type = ph.dv.getUint8(o++);
        def.animation.aspect_w = ph.dv.getUint8(o++);
        def.animation.aspect_h = ph.dv.getUint8(o++);
        def.animation.length = ph.dv.getFloat32(o);
        o += 4;
    }

    return [def, o - offset];
}

function readSimpleSoundSpec(
    ph: PayloadHelper,
    offset: number,
    protocolVersion: number,
): [SimpleSoundSpec, number] {
    const spec = new SimpleSoundSpec();
    let o = offset;
    spec.name = ph.getString(o);
    o += 2 + spec.name.length;

    // These params are always present even if name is empty
    spec.gain = ph.dv.getFloat32(o);
    o += 4;
    spec.pitch = ph.dv.getFloat32(o);
    o += 4;

    if (protocolVersion >= 50) {
        spec.fade = ph.dv.getFloat32(o);
        o += 4;
    }

    return [spec, o - offset];
}

function parseToolCapabilities(buffer: Uint8Array): ToolCapabilities {
    const tc = new ToolCapabilities();
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const ph = new PayloadHelper(dv);
    let offset = 0;

    const version = ph.dv.getUint8(offset++);
    if (version < 4) {
        throw new Error(`Unsupported ToolCapabilities version: ${version}`);
    }

    tc.full_punch_interval = ph.dv.getFloat32(offset);
    offset += 4;
    tc.max_drop_level = ph.dv.getInt16(offset);
    offset += 2;

    const groupcapsSize = ph.dv.getUint32(offset);
    offset += 4;

    for (let i = 0; i < groupcapsSize; i++) {
        const name = ph.getString(offset);
        offset += 2 + name.length;

        const cap = new ToolGroupCap();
        cap.uses = ph.dv.getInt16(offset);
        offset += 2;
        cap.maxlevel = ph.dv.getInt16(offset);
        offset += 2;

        const timesSize = ph.dv.getUint32(offset);
        offset += 4;

        for (let j = 0; j < timesSize; j++) {
            const level = ph.dv.getInt16(offset);
            offset += 2;
            const time = ph.dv.getFloat32(offset);
            offset += 4;
            cap.times.set(level, time);
        }
        tc.groupcaps.set(name, cap);
    }

    const damageGroupsSize = ph.dv.getUint32(offset);
    offset += 4;

    for (let i = 0; i < damageGroupsSize; i++) {
        const name = ph.getString(offset);
        offset += 2 + name.length;
        const rating = ph.dv.getInt16(offset);
        offset += 2;
        tc.damageGroups.set(name, rating);
    }

    if (version >= 5 && !ph.isEOF(offset)) {
        tc.punch_attack_uses = ph.dv.getUint16(offset);
        offset += 2;
    }

    return tc;
}

function parseWearBarParams(ph: PayloadHelper, offset: number): [WearBarParams, number] {
    const params = new WearBarParams();
    let o = offset;

    const version = ph.dv.getUint8(o++);
    if (version > 1) {
        throw new Error(`Unsupported WearBarParams version: ${version}`);
    }

    params.blend = ph.dv.getUint8(o++) as WearBarBlendMode;
    const count = ph.dv.getUint16(o);
    o += 2;

    for (let i = 0; i < count; i++) {
        const key = ph.dv.getFloat32(o);
        o += 4;
        const color = ph.getARGB8(o);
        o += 4;
        params.colorStops.set(key, color);
    }

    return [params, o - offset];
}

function parseItemDefinition(buffer: Uint8Array, protocolVersion: number): ItemDefinition {
    const def = new ItemDefinition();
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const ph = new PayloadHelper(dv);
    let offset = 0;

    def.version = ph.dv.getUint8(offset++);
    if (def.version < 6) {
        throw new Error(`Unsupported ItemDefinition version: ${def.version}`);
    }

    def.type = ph.dv.getUint8(offset++) as ItemType;

    def.name = ph.getString(offset);
    offset += 2 + def.name.length;

    def.description = ph.getString(offset);
    offset += 2 + def.description.length;

    let readLen = 0;
    [def.inventory_image, readLen] = readItemImageDef(ph, offset, protocolVersion);
    offset += readLen;

    [def.wield_image, readLen] = readItemImageDef(ph, offset, protocolVersion);
    offset += readLen;

    def.wield_scale = ph.getV3F(offset);
    offset += 12;

    def.stack_max = ph.dv.getInt16(offset);
    offset += 2;

    def.usable = ph.getBool(offset++);
    def.liquids_pointable = ph.getBool(offset++);

    const toolCapsData = ph.getStringData(offset);
    offset += 2 + toolCapsData.byteLength;

    if (toolCapsData.byteLength > 0) {
        try {
            def.tool_capabilities = parseToolCapabilities(toolCapsData);
        } catch (e) {
            console.warn(`Failed to parse ToolCapabilities for ${def.name}:`, e);
        }
    }

    const groupCount = ph.dv.getUint16(offset);
    offset += 2;
    for (let i = 0; i < groupCount; i++) {
        const name = ph.getString(offset);
        offset += 2 + name.length;
        const val = ph.dv.getInt16(offset);
        offset += 2;
        def.groups.set(name, val);
    }

    def.node_placement_prediction = ph.getString(offset);
    offset += 2 + def.node_placement_prediction.length;

    [def.sound_place, readLen] = readSimpleSoundSpec(ph, offset, protocolVersion);
    offset += readLen;

    [def.sound_place_failed, readLen] = readSimpleSoundSpec(ph, offset, protocolVersion);
    offset += readLen;

    def.range = ph.dv.getFloat32(offset);
    offset += 4;

    def.palette_image = ph.getString(offset);
    offset += 2 + def.palette_image.length;

    def.color = ph.getARGB8(offset);
    offset += 4;

    [def.inventory_overlay, readLen] = readItemImageDef(ph, offset, protocolVersion);
    offset += readLen;

    [def.wield_overlay, readLen] = readItemImageDef(ph, offset, protocolVersion);
    offset += readLen;

    if (!ph.isEOF(offset)) {
        def.short_description = ph.getString(offset);
        offset += 2 + def.short_description.length;
    }

    if (!ph.isEOF(offset)) {
        if (protocolVersion <= 43) {
            const val = ph.dv.getUint8(offset++);
            if (val !== 0) def.place_param2 = val;
        }
    }

    if (!ph.isEOF(offset)) {
        [def.sound_use, readLen] = readSimpleSoundSpec(ph, offset, protocolVersion);
        offset += readLen;

        [def.sound_use_air, readLen] = readSimpleSoundSpec(ph, offset, protocolVersion);
        offset += readLen;
    }

    if (!ph.isEOF(offset)) {
        const hasParam2 = ph.getBool(offset++);
        if (hasParam2) {
            def.place_param2 = ph.dv.getUint8(offset++);
        }
    }

    if (!ph.isEOF(offset)) {
        def.wallmounted_rotate_vertical = ph.getBool(offset++);

        def.touch_interaction.pointed_nothing = ph.dv.getUint8(offset++) as TouchInteractionMode;
        def.touch_interaction.pointed_node = ph.dv.getUint8(offset++) as TouchInteractionMode;
        def.touch_interaction.pointed_object = ph.dv.getUint8(offset++) as TouchInteractionMode;

        const pointabilitiesStr = ph.getString(offset);
        offset += 2 + pointabilitiesStr.length;
        def.pointabilities = pointabilitiesStr;

        if (!ph.isEOF(offset)) {
            const hasWearBar = ph.getBool(offset++);
            if (hasWearBar) {
                [def.wear_bar_params, readLen] = parseWearBarParams(ph, offset);
                offset += readLen;
            }
        }
    }

    return def;
}

export function ParseItemDefinitions(
    cmd: ServerItemDefinitions,
    protocolVersion: number,
): { items: Map<string, ItemDefinition>; aliases: Map<string, string> } {
    const items = new Map<string, ItemDefinition>();
    const aliases = new Map<string, string>();

    const compressed = new Uint8Array(cmd.data);
    let output: Uint8Array;

    if (
        compressed.length >= 4 &&
        compressed[0] === 0x28 &&
        compressed[1] === 0xb5 &&
        compressed[2] === 0x2f &&
        compressed[3] === 0xfd
    ) {
        output = decompress(compressed);
    } else {
        output = inflate(compressed);
    }

    const dv = new DataView(output.buffer, output.byteOffset, output.byteLength);
    const ph = new PayloadHelper(dv);
    let offset = 0;

    const mgrVersion = ph.dv.getUint8(offset++);
    if (mgrVersion !== 0) {
        throw new Error(`Unsupported ItemDefManager version: ${mgrVersion}`);
    }

    const count = ph.dv.getUint16(offset);
    offset += 2;

    for (let i = 0; i < count; i++) {
        const itemData = ph.getStringData(offset);
        offset += 2 + itemData.byteLength;

        try {
            const def = parseItemDefinition(itemData, protocolVersion);
            items.set(def.name, def);
        } catch (e) {
            console.error(`Failed to parse item definition index ${i}`, e);
        }
    }

    const aliasCount = ph.dv.getUint16(offset);
    offset += 2;

    for (let i = 0; i < aliasCount; i++) {
        const name = ph.getString(offset);
        offset += 2 + name.length;
        const convertTo = ph.getString(offset);
        offset += 2 + convertTo.length;
        aliases.set(name, convertTo);
    }

    return { items, aliases };
}
