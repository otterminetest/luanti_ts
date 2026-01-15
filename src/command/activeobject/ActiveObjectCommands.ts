import { PayloadHelper } from "../packet/PayloadHelper.js";

export enum ActiveObjectCommandType {
    SET_PROPERTIES = 0,
    UPDATE_POSITION = 1,
    SET_TEXTURE_MOD = 2,
    SET_SPRITE = 3,
    PUNCHED = 4,
    UPDATE_ARMOR_GROUPS = 5,
    SET_ANIMATION = 6,
    SET_BONE_POSITION = 7,
    ATTACH_TO = 8,
    SET_PHYSICS_OVERRIDE = 9,
    OBSOLETE1 = 10,
    SPAWN_INFANT = 11,
    SET_ANIMATION_SPEED = 12,
}

export interface AoCommand {
    type: ActiveObjectCommandType;
}

export class AoCmdUpdatePosition implements AoCommand {
    type = ActiveObjectCommandType.UPDATE_POSITION;

    pos!: { x: number; y: number; z: number };
    velocity!: { x: number; y: number; z: number };
    acceleration!: { x: number; y: number; z: number };
    rotation!: { x: number; y: number; z: number };
    doInterpolate!: boolean;
    isEndPosition!: boolean;
    updateInterval!: number;

    constructor(dv: DataView) {
        const ph = new PayloadHelper(dv);
        let offset = 1; // Skip cmd byte

        if (offset + 48 > dv.byteLength) return;

        this.pos = ph.getV3F(offset);
        offset += 12;
        this.velocity = ph.getV3F(offset);
        offset += 12;
        this.acceleration = ph.getV3F(offset);
        offset += 12;
        this.rotation = ph.getV3F(offset);
        offset += 12;

        if (offset + 2 > dv.byteLength) return;
        this.doInterpolate = ph.getBool(offset);
        offset += 1;
        this.isEndPosition = ph.getBool(offset);
        offset += 1;

        if (offset + 4 <= dv.byteLength) {
            this.updateInterval = dv.getFloat32(offset);
        } else {
            this.updateInterval = 0;
        }
    }
}

export class AoCmdPunched implements AoCommand {
    type = ActiveObjectCommandType.PUNCHED;
    hp: number;

    constructor(dv: DataView) {
        this.hp = dv.byteLength >= 3 ? dv.getUint16(1) : 0;
    }
}

export class AoCmdSetTextureMod implements AoCommand {
    type = ActiveObjectCommandType.SET_TEXTURE_MOD;
    mod = "";

    constructor(dv: DataView) {
        const ph = new PayloadHelper(dv);
        if (dv.byteLength > 1) {
            try {
                this.mod = ph.getString(1);
            } catch (e) {}
        }
    }
}

export class AoCmdSetSprite implements AoCommand {
    type = ActiveObjectCommandType.SET_SPRITE;
    p = { x: 0, y: 0 };
    num_frames = 0;
    framelength = 0;
    select_horiz_by_yawpitch = false;

    constructor(dv: DataView) {
        let offset = 1;
        if (offset + 4 > dv.byteLength) return;
        this.p = { x: dv.getInt16(offset), y: dv.getInt16(offset + 2) };
        offset += 4;

        if (offset + 2 > dv.byteLength) return;
        this.num_frames = dv.getUint16(offset);
        offset += 2;

        if (offset + 4 > dv.byteLength) return;
        this.framelength = dv.getFloat32(offset);
        offset += 4;

        if (offset + 1 <= dv.byteLength) {
            this.select_horiz_by_yawpitch = dv.getUint8(offset) !== 0;
        }
    }
}

export class AoCmdSetPhysicsOverride implements AoCommand {
    type = ActiveObjectCommandType.SET_PHYSICS_OVERRIDE;

    speed = 0;
    jump = 0;
    gravity = 0;
    sneak = true;
    sneak_glitch = true;
    new_move = true; // Default true in recent versions

    // >= 5.8.0
    speed_climb = 0;
    speed_crouch = 0;
    liquid_fluidity = 0;
    liquid_fluidity_smooth = 0;
    liquid_sink = 0;
    acceleration_default = 0;
    acceleration_air = 0;

    // >= 5.9.0
    speed_fast = 0;
    acceleration_fast = 0;
    speed_walk = 0;

    constructor(dv: DataView) {
        let offset = 1;
        const len = dv.byteLength;

        if (offset + 12 > len) return;
        this.speed = dv.getFloat32(offset);
        offset += 4;
        this.jump = dv.getFloat32(offset);
        offset += 4;
        this.gravity = dv.getFloat32(offset);
        offset += 4;

        if (offset + 3 > len) return;
        this.sneak = dv.getUint8(offset++) === 0; // sent inverted
        this.sneak_glitch = dv.getUint8(offset++) === 0; // sent inverted
        this.new_move = dv.getUint8(offset++) === 0; // sent inverted

        // Optional 5.8.0 fields
        if (offset + 28 <= len) {
            this.speed_climb = dv.getFloat32(offset);
            offset += 4;
            this.speed_crouch = dv.getFloat32(offset);
            offset += 4;
            this.liquid_fluidity = dv.getFloat32(offset);
            offset += 4;
            this.liquid_fluidity_smooth = dv.getFloat32(offset);
            offset += 4;
            this.liquid_sink = dv.getFloat32(offset);
            offset += 4;
            this.acceleration_default = dv.getFloat32(offset);
            offset += 4;
            this.acceleration_air = dv.getFloat32(offset);
            offset += 4;
        }

        // Optional 5.9.0 fields
        if (offset + 12 <= len) {
            this.speed_fast = dv.getFloat32(offset);
            offset += 4;
            this.acceleration_fast = dv.getFloat32(offset);
            offset += 4;
            this.speed_walk = dv.getFloat32(offset);
            offset += 4;
        }
    }
}

export class AoCmdSetAnimation implements AoCommand {
    type = ActiveObjectCommandType.SET_ANIMATION;
    range = { x: 0, y: 0 };
    speed = 0;
    blend = 0;
    loop = true;

    constructor(dv: DataView) {
        let offset = 1;
        if (offset + 8 > dv.byteLength) return;
        this.range = { x: dv.getFloat32(offset), y: dv.getFloat32(offset + 4) };
        offset += 8;

        if (offset + 4 > dv.byteLength) return;
        this.speed = dv.getFloat32(offset);
        offset += 4;

        if (offset + 4 > dv.byteLength) return;
        this.blend = dv.getFloat32(offset);
        offset += 4;

        if (offset + 1 <= dv.byteLength) {
            this.loop = dv.getUint8(offset) === 0; // sent inverted
        }
    }
}

export class AoCmdSetAnimationSpeed implements AoCommand {
    type = ActiveObjectCommandType.SET_ANIMATION_SPEED;
    speed: number;

    constructor(dv: DataView) {
        this.speed = dv.byteLength >= 5 ? dv.getFloat32(1) : 0;
    }
}

export class AoCmdSetBonePosition implements AoCommand {
    type = ActiveObjectCommandType.SET_BONE_POSITION;
    bone = "";
    position = { x: 0, y: 0, z: 0 };
    rotation = { x: 0, y: 0, z: 0 };
    scale = { x: 1, y: 1, z: 1 };
    interp_pos = 0;
    interp_rot = 0;
    interp_scale = 0;
    absolute_pos = true;
    absolute_rot = true;
    absolute_scale = false;

    constructor(dv: DataView) {
        const ph = new PayloadHelper(dv);
        let offset = 1;
        const len = dv.byteLength;

        if (offset + 2 > len) return;
        const boneLen = dv.getUint16(offset);
        if (offset + 2 + boneLen > len) return;
        this.bone = ph.getString(offset);
        offset += 2 + boneLen;

        if (offset + 24 > len) return;
        this.position = ph.getV3F(offset);
        offset += 12;
        this.rotation = ph.getV3F(offset);
        offset += 12;

        // Protocol >= 44 extra fields
        if (offset + 12 <= len) {
            this.scale = ph.getV3F(offset);
            offset += 12;

            if (offset + 12 <= len) {
                this.interp_pos = dv.getFloat32(offset);
                offset += 4;
                this.interp_rot = dv.getFloat32(offset);
                offset += 4;
                this.interp_scale = dv.getFloat32(offset);
                offset += 4;

                if (offset + 1 <= len) {
                    const flags = dv.getUint8(offset);
                    this.absolute_pos = (flags & 1) > 0;
                    this.absolute_rot = (flags & 2) > 0;
                    this.absolute_scale = (flags & 4) > 0;
                }
            }
        }
    }
}

export class AoCmdAttachTo implements AoCommand {
    type = ActiveObjectCommandType.ATTACH_TO;
    parent_id = 0;
    bone = "";
    position = { x: 0, y: 0, z: 0 };
    rotation = { x: 0, y: 0, z: 0 };
    force_visible = false;

    constructor(dv: DataView) {
        const ph = new PayloadHelper(dv);
        let offset = 1;
        const len = dv.byteLength;

        if (offset + 2 > len) return;
        this.parent_id = dv.getInt16(offset);
        offset += 2;

        if (offset + 2 > len) return;
        const boneLen = dv.getUint16(offset);
        if (offset + 2 + boneLen > len) return;
        this.bone = ph.getString(offset);
        offset += 2 + boneLen;

        if (offset + 24 > len) return;
        this.position = ph.getV3F(offset);
        offset += 12;
        this.rotation = ph.getV3F(offset);
        offset += 12;

        if (offset + 1 <= len) {
            this.force_visible = dv.getUint8(offset) !== 0;
        }
    }
}

export class AoCmdUpdateArmorGroups implements AoCommand {
    type = ActiveObjectCommandType.UPDATE_ARMOR_GROUPS;
    groups = new Map<string, number>();

    constructor(dv: DataView) {
        const ph = new PayloadHelper(dv);
        let offset = 1;
        const len = dv.byteLength;

        if (offset + 2 > len) return;
        const count = dv.getUint16(offset);
        offset += 2;

        for (let i = 0; i < count; i++) {
            if (offset + 2 > len) return;
            const nameLen = dv.getUint16(offset);
            if (offset + 2 + nameLen > len) return;
            const name = ph.getString(offset);
            offset += 2 + nameLen;

            if (offset + 2 > len) return;
            const rating = dv.getInt16(offset);
            offset += 2;

            this.groups.set(name, rating);
        }
    }
}

export class AoCmdSpawnInfant implements AoCommand {
    type = ActiveObjectCommandType.SPAWN_INFANT;
    id = 0;
    subType = 0;

    constructor(dv: DataView) {
        if (dv.byteLength >= 3) this.id = dv.getUint16(1);
        if (dv.byteLength >= 4) this.subType = dv.getUint8(3);
    }
}

export class AoCmdSetProperties implements AoCommand {
    type = ActiveObjectCommandType.SET_PROPERTIES;

    hp_max = 1;
    physical = false;
    collideWithObjects = true;
    weight = 5;
    collisionBox = { min: { x: -0.5, y: -0.5, z: -0.5 }, max: { x: 0.5, y: 0.5, z: 0.5 } };
    selectionBox = { min: { x: -0.5, y: -0.5, z: -0.5 }, max: { x: 0.5, y: 0.5, z: 0.5 } };
    pointable = true;
    visual = "sprite";
    visual_size = { x: 1, y: 1 };
    textures = new Array<string>();
    spritediv = { x: 1, y: 1 };
    initial_sprite_basepos = { x: 0, y: 0 };
    is_visible = true;
    makes_footstep_sound = false;
    stepheight = 0;
    automatic_rotate = 0;
    backface_culling = true;
    glow = 0;
    nametag = "";
    nametag_color = 0xffffffff; // u32 color
    nametag_bgcolor = 0; // u32 color
    automatic_face_movement_dir = 0;
    automatic_face_movement_dir_offset = 0;
    automatic_face_movement_max_rotation_per_sec = -1;
    nametag_scale_z = 0;

    // Newer properties
    infotext = "";
    wield_item = "";
    zoom_fov = 0;
    use_texture_alpha = false;
    damage_texture_modifier = "";
    shaded = true;
    show_on_minimap = true;
    eye_height = 0;
    collisionbox_created = false;

    constructor(dv: DataView) {
        const ph = new PayloadHelper(dv);
        let offset = 1; // Skip cmd byte
        const len = dv.byteLength;

        if (offset >= len) return;
        const version = dv.getUint8(offset++);

        if (offset + 2 > len) return;
        this.hp_max = dv.getInt16(offset);
        offset += 2;

        if (offset + 1 > len) return;
        this.physical = ph.getBool(offset++);

        if (offset + 4 > len) return;
        this.weight = dv.getFloat32(offset);
        offset += 4;

        // Collision Box (24 bytes)
        if (offset + 24 > len) return;
        this.collisionBox.min = ph.getV3F(offset);
        offset += 12;
        this.collisionBox.max = ph.getV3F(offset);
        offset += 12;
        this.collisionbox_created = true;

        // Visual (String)
        if (offset + 2 > len) return;
        const visualLen = dv.getUint16(offset);
        if (offset + 2 + visualLen > len) return;
        this.visual = ph.getString(offset);
        offset += 2 + this.visual.length;

        // Visual Size (8 bytes)
        if (offset + 8 > len) return;
        this.visual_size = ph.getV2F(offset);
        offset += 8;

        // Textures (String Array)
        if (offset + 2 > len) return;
        try {
            this.textures = ph.getStringArray(offset);
            // Manual offset advancement for string array
            const texCount = dv.getUint16(offset);
            offset += 2;
            for (let i = 0; i < texCount; i++) {
                if (offset + 2 > len) return;
                const sLen = dv.getUint16(offset);
                offset += 2 + sLen;
            }
        } catch (e) {
            return;
        }

        if (offset + 4 > len) return;
        this.spritediv = { x: dv.getInt16(offset), y: dv.getInt16(offset + 2) };
        offset += 4;

        if (offset + 4 > len) return;
        this.initial_sprite_basepos = { x: dv.getInt16(offset), y: dv.getInt16(offset + 2) };
        offset += 4;

        if (offset + 2 > len) return;
        this.is_visible = ph.getBool(offset++);
        this.makes_footstep_sound = ph.getBool(offset++);

        if (offset + 4 > len) return;
        this.automatic_rotate = dv.getFloat32(offset);
        offset += 4;

        if (version >= 1) {
            if (offset + 12 > len) return;
            this.stepheight = dv.getFloat32(offset);
            offset += 4;
            this.automatic_face_movement_dir = dv.getFloat32(offset);
            offset += 4;
            this.automatic_face_movement_dir_offset = dv.getFloat32(offset);
            offset += 4;
        }

        if (version >= 2) {
            if (offset + 1 > len) return;
            this.backface_culling = ph.getBool(offset++);
        }

        if (version >= 3) {
            if (offset + 2 > len) return;
            const ntLen = dv.getUint16(offset);
            if (offset + 2 + ntLen > len) return;
            this.nametag = ph.getString(offset);
            offset += 2 + this.nametag.length;

            if (offset + 8 > len) return;
            this.nametag_color = dv.getUint32(offset);
            offset += 4;
            this.automatic_face_movement_max_rotation_per_sec = dv.getFloat32(offset);
            offset += 4;
        }

        if (version >= 4) {
            if (offset + 5 > len) return;
            this.nametag_bgcolor = dv.getUint32(offset);
            offset += 4;
            offset++; // coord_frame
        }

        if (version >= 5) {
            if (offset + 2 > len) return;
            const wLen = dv.getUint16(offset);
            if (offset + 2 + wLen > len) return;
            this.wield_item = ph.getString(offset);
            offset += 2 + this.wield_item.length;
        }

        if (version >= 6) {
            if (offset + 5 > len) return;
            this.zoom_fov = dv.getFloat32(offset);
            offset += 4;
            this.use_texture_alpha = ph.getBool(offset++);
        }

        if (version >= 7) {
            if (offset + 2 > len) return;
            const dtLen = dv.getUint16(offset);
            if (offset + 2 + dtLen > len) return;
            this.damage_texture_modifier = ph.getString(offset);
            offset += 2 + this.damage_texture_modifier.length;
        }

        if (version >= 8) {
            if (offset + 28 > len) return;
            this.shaded = ph.getBool(offset++);
            this.show_on_minimap = ph.getBool(offset++);
            this.collideWithObjects = ph.getBool(offset++);
            this.selectionBox.min = ph.getV3F(offset);
            offset += 12;
            this.selectionBox.max = ph.getV3F(offset);
            offset += 12;
            this.pointable = ph.getBool(offset++);
        } else {
            this.selectionBox = JSON.parse(JSON.stringify(this.collisionBox));
        }

        if (version >= 9) {
            if (offset + 4 > len) return;
            this.eye_height = dv.getFloat32(offset);
            offset += 4;
        }

        if (version >= 10) {
            if (offset + 1 > len) return;
            this.glow = dv.getInt8(offset);
            offset += 1;
        }

        if (version >= 11) {
            if (offset + 4 > len) return;
            this.nametag_scale_z = dv.getFloat32(offset);
            offset += 4;
        }

        if (version >= 12) {
            if (offset + 2 > len) return;
            const cLen = dv.getUint16(offset);
            if (offset + 2 + cLen <= len) {
                offset += 2 + cLen;
            }
        }
    }
}

export class AoCmdRaw implements AoCommand {
    constructor(
        public type: ActiveObjectCommandType,
        public data: Uint8Array,
    ) {}
}

export function parseAoCommand(data: Uint8Array): AoCommand {
    const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const cmdId = dv.getUint8(0);

    switch (cmdId) {
        case ActiveObjectCommandType.SET_PROPERTIES:
            return new AoCmdSetProperties(dv);
        case ActiveObjectCommandType.UPDATE_POSITION:
            return new AoCmdUpdatePosition(dv);
        case ActiveObjectCommandType.SET_TEXTURE_MOD:
            return new AoCmdSetTextureMod(dv);
        case ActiveObjectCommandType.SET_SPRITE:
            return new AoCmdSetSprite(dv);
        case ActiveObjectCommandType.PUNCHED:
            return new AoCmdPunched(dv);
        case ActiveObjectCommandType.UPDATE_ARMOR_GROUPS:
            return new AoCmdUpdateArmorGroups(dv);
        case ActiveObjectCommandType.SET_ANIMATION:
            return new AoCmdSetAnimation(dv);
        case ActiveObjectCommandType.SET_BONE_POSITION:
            return new AoCmdSetBonePosition(dv);
        case ActiveObjectCommandType.ATTACH_TO:
            return new AoCmdAttachTo(dv);
        case ActiveObjectCommandType.SET_PHYSICS_OVERRIDE:
            return new AoCmdSetPhysicsOverride(dv);
        case ActiveObjectCommandType.SET_ANIMATION_SPEED:
            return new AoCmdSetAnimationSpeed(dv);
        case ActiveObjectCommandType.SPAWN_INFANT:
            return new AoCmdSpawnInfant(dv);
        default:
            return new AoCmdRaw(cmdId, data);
    }
}
