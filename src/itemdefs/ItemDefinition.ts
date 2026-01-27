export enum ItemType {
    ITEM_NONE = 0,
    ITEM_NODE = 1,
    ITEM_CRAFT = 2,
    ITEM_TOOL = 3,
}

export enum TouchInteractionMode {
    LONG_DIG_SHORT_PLACE = 0,
    SHORT_DIG_LONG_PLACE = 1,
    TouchInteractionMode_USER = 2,
}

export enum WearBarBlendMode {
    BLEND_MODE_CONSTANT = 0,
    BLEND_MODE_LINEAR = 1,
}

export class SimpleSoundSpec {
    name = "";
    gain = 1.0;
    pitch = 1.0;
    fade = 0.0;
}

export class TileAnimationParams {
    type = 0;
    aspect_w = 1;
    aspect_h = 1;
    length = 1.0;
}

export class ItemImageDef {
    name = "";
    animation = new TileAnimationParams();
}

export class TouchInteraction {
    pointed_nothing = TouchInteractionMode.TouchInteractionMode_USER;
    pointed_node = TouchInteractionMode.TouchInteractionMode_USER;
    pointed_object = TouchInteractionMode.TouchInteractionMode_USER;
}

export class ToolGroupCap {
    maxlevel = 1;
    uses = 1;
    times = new Map<number, number>(); // level -> time
}

export class ToolCapabilities {
    full_punch_interval = 1.0;
    max_drop_level = 0;
    groupcaps = new Map<string, ToolGroupCap>();
    damageGroups = new Map<string, number>();
    punch_attack_uses = 0;
}

export class WearBarParams {
    blend = WearBarBlendMode.BLEND_MODE_CONSTANT;
    colorStops = new Map<number, number>(); // durability_percent (0-1) -> ARGB color
}

export class DigParams {
    constructor(
        public diggable: boolean,
        public time: number,
        public wear: number,
        public main_group: string,
    ) {}
}

/**
 * Calculates the wear points to add for a single use.
 *
 * @param uses - The number of uses the tool capability specifies.
 * @param initialWear - The current wear of the item (0-65535).
 */
function calculateResultWear(uses: number, initialWear: number): number {
    if (uses === 0) {
        return 0; // Infinite uses
    }

    const maxVal = 65536; // U16_MAX + 1
    const wearNormal = Math.floor(maxVal / uses);
    const blocksOversize = maxVal % uses;
    let wearExtra = 0;

    if (blocksOversize > 0) {
        // We have some "oversized" blocks (normal + 1) to distribute
        const blocksNormal = uses - blocksOversize;
        // The point where we switch from normal blocks to oversized blocks
        const wearExtraAt = blocksNormal * wearNormal;

        if (initialWear >= wearExtraAt) {
            wearExtra = 1;
        }
    }

    return wearNormal + wearExtra;
}

/**
 * Calculates digging properties based on node groups and tool capabilities.
 *
 * @param nodeGroups - The groups of the node being dug.
 * @param toolCaps - The capabilities of the tool being used.
 * @param currentWear - The current wear of the tool (0 if new). Affects wear calculation.
 */
export function getDigParams(
    nodeGroups: Map<string, number>,
    toolCaps: ToolCapabilities,
    currentWear = 0,
): DigParams {
    // Group dig_immediate defaults to fixed time and no wear
    // If the tool explicitly handles dig_immediate, this block is skipped.
    if (!toolCaps.groupcaps.has("dig_immediate")) {
        const imm = nodeGroups.get("dig_immediate");
        if (imm !== undefined) {
            if (imm === 2) return new DigParams(true, 0.5, 0, "dig_immediate");
            if (imm === 3) return new DigParams(true, 0, 0, "dig_immediate");
        }
    }

    let result_diggable = false;
    let result_time = 0.0;
    let result_wear = 0;
    let result_main_group = "";

    const level = nodeGroups.get("level") || 0;

    for (const [groupname, cap] of toolCaps.groupcaps) {
        const leveldiff = cap.maxlevel - level;
        if (leveldiff < 0) continue;

        // In Minetest, missing group means rating 0
        const rating = nodeGroups.get(groupname) ?? 0;

        const time = cap.times.get(rating);
        if (time === undefined) continue;

        let finalTime = time;
        if (leveldiff > 1) {
            finalTime /= leveldiff;
        }

        if (!result_diggable || finalTime < result_time) {
            result_time = finalTime;
            result_diggable = true;
            result_main_group = groupname;

            // Wear logic:
            // 1. Calculate effective uses based on level difference (exponential decay)
            // 2. Cap at 65535
            // 3. Calculate integer wear points
            const decay = 3.0 ** leveldiff;
            const realUses = Math.min(cap.uses * decay, 65535);

            result_wear = calculateResultWear(realUses, currentWear);
        }
    }

    return new DigParams(result_diggable, result_time, result_wear, result_main_group);
}

export class ItemDefinition {
    version = 0;
    type = ItemType.ITEM_NONE;
    name = "";
    description = "";
    short_description = "";

    inventory_image = new ItemImageDef();
    inventory_overlay = new ItemImageDef();
    wield_image = new ItemImageDef();
    wield_overlay = new ItemImageDef();

    palette_image = "";
    color = 0xffffffff;
    wield_scale = { x: 1, y: 1, z: 1 };

    stack_max = 99;
    usable = false;
    liquids_pointable = false;

    tool_capabilities?: ToolCapabilities;

    groups = new Map<string, number>();

    node_placement_prediction = "";

    sound_place = new SimpleSoundSpec();
    sound_place_failed = new SimpleSoundSpec();
    sound_use = new SimpleSoundSpec();
    sound_use_air = new SimpleSoundSpec();

    range = -1;

    place_param2?: number;
    wallmounted_rotate_vertical = false;

    touch_interaction = new TouchInteraction();

    // Serialized blobs
    pointabilities = "";

    wear_bar_params?: WearBarParams;
}
