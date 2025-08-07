import { TileDefinition } from "./TileDefinition.js";

export enum NodeDrawType {
	// A basic solid block
	NDT_NORMAL = 0x00,
	// Nothing is drawn
	NDT_AIRLIKE = 0x01,
	// Do not draw face towards same kind of flowing/source liquid
	NDT_LIQUID = 0x02,
	// A very special kind of thing
	NDT_FLOWINGLIQUID = 0x03,
	// Glass-like, don't draw faces towards other glass
	NDT_GLASSLIKE = 0x04,
	// Leaves-like, draw all faces no matter what
	NDT_ALLFACES = 0x05,
	// Enabled -> ndt_allfaces, disabled -> ndt_normal
	NDT_ALLFACES_OPTIONAL = 0x06,
	// Single plane perpendicular to a surface
	NDT_TORCHLIKE = 0x07,
	// Single plane parallel to a surface
	NDT_SIGNLIKE = 0x08,
	// 2 vertical planes in a 'X' shape diagonal to XZ axes.
	// paramtype2 = "meshoptions" allows various forms, sizes and
	// vertical and horizontal random offsets.
	NDT_PLANTLIKE = 0x09,
	// Fenceposts that connect to neighbouring fenceposts with horizontal bars
	NDT_FENCELIKE = 0x0A,
	// Selects appropriate junction texture to connect like rails to
	// neighbouring raillikes.
	NDT_RAILLIKE = 0x0B,
	// Custom Lua-definable structure of multiple cuboids
	NDT_NODEBOX = 0x0C,
	// Glass-like, draw connected frames and all visible faces.
	// param2 > 0 defines 64 levels of internal liquid
	// Uses 3 textures, one for frames, second for faces,
	// optional third is a 'special tile' for the liquid.
	NDT_GLASSLIKE_FRAMED = 0x0D,
	// Draw faces slightly rotated and only on neighbouring nodes
	NDT_FIRELIKE = 0x0E,
	// Enabled -> ndt_glasslike_framed, disabled -> ndt_glasslike
	NDT_GLASSLIKE_FRAMED_OPTIONAL = 0x0F,
	// Uses static meshes
	NDT_MESH = 0x10,
	// Combined plantlike-on-solid
	NDT_PLANTLIKE_ROOTED = 0x11
};

export enum ContentParamType {
	CPT_NONE = 0x00,
	CPT_LIGHT = 0x01
};

export enum ContentParamType2 {
	CPT2_NONE = 0x00,
	// Need 8-bit param2
	CPT2_FULL = 0x01,
	// Flowing liquid properties
	CPT2_FLOWINGLIQUID = 0x02,
	// Direction for chests and furnaces and such
	CPT2_FACEDIR = 0x03,
	// Direction for signs, torches and such
	CPT2_WALLMOUNTED = 0x04,
	// Block level like FLOWINGLIQUID
	CPT2_LEVELED = 0x05,
	// 2D rotation
	CPT2_DEGROTATE = 0x06,
	// Mesh options for plants
	CPT2_MESHOPTIONS = 0x07,
	// Index for palette
	CPT2_COLOR = 0x08,
	// 3 bits of palette index, then facedir
	CPT2_COLORED_FACEDIR = 0x09,
	// 5 bits of palette index, then wallmounted
	CPT2_COLORED_WALLMOUNTED = 0x0A,
	// Glasslike framed drawtype internal liquid level, param2 values 0 to 63
	CPT2_GLASSLIKE_LIQUID_LEVEL = 0x0B,
	// 3 bits of palette index, then degrotate
	CPT2_COLORED_DEGROTATE = 0x0C
};


export class NodeDefinition {
    tileDefs = new Array<TileDefinition>()
    tileDefOverlays = new Array<TileDefinition>()
    tileSpecial = new Array<TileDefinition>()
    groups = new Map<string, number>()
    connectsToId = new Array<number>()

	version!: number
	name!: string
	id!: number
	paramtype1!: ContentParamType
	paramtype2!: ContentParamType2
	drawType!: NodeDrawType
	mesh!: string
	visualScale!: number

	legacyAlpha!: number
	red!: number
	green!: number
	blue!: number
	paletteName!: string
	
	waving!: number
	connectSides!: number
	
	postEffectColor!: number
	leveled!: number
	lightPropagates!: number
	sunlightPropagates!: number
	lightSource!: number
	groundContent!: number
}