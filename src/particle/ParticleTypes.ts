import { PayloadHelper } from "../command/packet/PayloadHelper.js";

// Helper interface for types that can deserialize themselves
interface Deserializable<T> {
    deSerialize(dv: DataView, offset: number): number;
}

export enum TweenStyle {
    Fwd = 0,
    Rev = 1,
    Pulse = 2,
    Flicker = 3,
}

export enum BlendMode {
    Alpha = 0,
    Add = 1,
    Sub = 2,
    Screen = 3,
    Clip = 4,
}

export class Parameter<T> {
    val!: T;
    constructor(val: T) {
        this.val = val;
    }
}

export class RangedParameter<T> {
    min!: T;
    max!: T;
    bias = 0;

    constructor(
        private reader: (ph: PayloadHelper, offset: number) => [T, number],
        defaultVal: T,
    ) {
        this.min = defaultVal;
        this.max = defaultVal;
    }

    deSerialize(dv: DataView, offset: number): number {
        const ph = new PayloadHelper(dv);
        // Deserializes min (T), max (T), bias (f32)
        let o = offset;
        let readLen = 0;

        [this.min, readLen] = this.reader(ph, o);
        o += readLen;

        [this.max, readLen] = this.reader(ph, o);
        o += readLen;

        this.bias = dv.getFloat32(o);
        o += 4;

        return o - offset;
    }
}

export class TweenedParameter<T> {
    style = TweenStyle.Fwd;
    reps = 1;
    beginning = 0.0;
    start!: T;
    end!: T;

    constructor(
        private reader: (ph: PayloadHelper, offset: number) => [T, number],
        defaultVal: T,
    ) {
        this.start = defaultVal;
        this.end = defaultVal;
    }

    deSerialize(dv: DataView, offset: number): number {
        const ph = new PayloadHelper(dv);
        let o = offset;

        this.style = dv.getUint8(o) as TweenStyle;
        o += 1;
        this.reps = dv.getUint16(o);
        o += 2;
        this.beginning = dv.getFloat32(o);
        o += 4;

        let readLen = 0;
        [this.start, readLen] = this.reader(ph, o);
        o += readLen;

        [this.end, readLen] = this.reader(ph, o);
        o += readLen;

        return o - offset;
    }
}

export class TileAnimationParams {
    type = 0;
    aspect_w = 1;
    aspect_h = 1;
    length = 1.0;

    deSerialize(dv: DataView, offset: number): number {
        let o = offset;
        this.type = dv.getUint8(o++);
        this.aspect_w = dv.getUint8(o++);
        this.aspect_h = dv.getUint8(o++);
        this.length = dv.getFloat32(o);
        o += 4;
        return o - offset;
    }
}

export class ParticleTexture {
    string = "";
    animated = false;
    blendmode = BlendMode.Alpha;
    animation = new TileAnimationParams();
    alpha = new TweenedParameter<number>((ph, o) => [ph.dv.getFloat32(o), 4], 1.0);
    scale = new TweenedParameter<{ x: number; y: number }>((ph, o) => [ph.getV2F(o), 8], {
        x: 1,
        y: 1,
    });

    deSerialize(dv: DataView, offset: number): number {
        let o = offset;
        const len = dv.byteLength;
        const ph = new PayloadHelper(dv);

        // Need at least 1 byte for flags
        if (o + 1 > len) return 0;

        const flags = dv.getUint8(o++);
        this.animated = (flags & 1) !== 0;
        this.blendmode = (flags >> 1) as BlendMode;

        // Alpha is f32Tween: 1(style) + 2(reps) + 4(begin) + 4(start) + 4(end) = 15 bytes
        if (o + 15 > len) return o - offset;
        o += this.alpha.deSerialize(dv, o);

        // Scale is v2fTween: 1(style) + 2(reps) + 4(begin) + 8(start) + 8(end) = 23 bytes
        if (o + 23 > len) return o - offset;
        o += this.scale.deSerialize(dv, o);

        return o - offset;
    }
}

export class ParticleParameters {
    pos = { x: 0, y: 0, z: 0 };
    vel = { x: 0, y: 0, z: 0 };
    acc = { x: 0, y: 0, z: 0 };
    expirationtime = 1.0;
    size = 1.0;
    collisiondetection = false;
    texture = new ParticleTexture();
    vertical = false;
    collision_removal = false;
    animation = new TileAnimationParams();
    glow = 0;
    object_collision = false;

    // Node params
    node = { param0: 0, param2: 0 };
    node_tile = 0;

    // Physics
    drag = { x: 0, y: 0, z: 0 };
    jitter = new RangedParameter<{ x: number; y: number; z: number }>(
        (ph, o) => [ph.getV3F(o), 12],
        { x: 0, y: 0, z: 0 },
    );
    bounce = new RangedParameter<number>((ph, o) => [ph.dv.getFloat32(o), 4], 0.0);

    deSerialize(dv: DataView, offset: number): number {
        const ph = new PayloadHelper(dv);
        let o = offset;
        const len = dv.byteLength;

        this.pos = ph.getV3F(o);
        o += 12;
        this.vel = ph.getV3F(o);
        o += 12;
        this.acc = ph.getV3F(o);
        o += 12;

        this.expirationtime = dv.getFloat32(o);
        o += 4;
        this.size = dv.getFloat32(o);
        o += 4;
        this.collisiondetection = ph.getBool(o++);

        // Texture String (serializeString32)
        this.texture.string = ph.getLongString(o);
        o += 4 + this.texture.string.length;

        this.vertical = ph.getBool(o++);
        this.collision_removal = ph.getBool(o++);

        o += this.animation.deSerialize(dv, o);

        this.glow = dv.getUint8(o++);
        this.object_collision = ph.getBool(o++);

        if (o >= len) return o - offset;

        // >= 5.3.0
        this.node.param0 = dv.getUint16(o);
        o += 2;
        this.node.param2 = dv.getUint8(o++);
        this.node_tile = dv.getUint8(o++);

        if (o >= len) return o - offset;

        // >= 5.6.0
        this.drag = ph.getV3F(o);
        o += 12;
        o += this.jitter.deSerialize(dv, o);
        o += this.bounce.deSerialize(dv, o);

        if (o >= len) return o - offset;

        // >= 5.9.0
        // Deserialize extended texture properties (blend mode, tweened alpha/scale)
        // Note: The previous logic failed here if 'o' was close to 'len' but not equal,
        // or if server sent partial extension data. The check inside texture.deSerialize handles this now.
        o += this.texture.deSerialize(dv, o);

        return o - offset;
    }
}
