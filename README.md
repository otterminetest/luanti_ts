# luanti_ts

(not currently maintained but that might change in the future)      
Credits to https://github.com/otterminetest/meseweb for base of this project.      

A TypeScript implementation of the Luanti (Minetest) network protocol. This library provides a client interface for connecting to Luanti servers via UDP, handling SRP authentication, packet serialization, and state management.

## Build and Installation

This library is intended to be used from source for development builds.

### Prerequisites

* Node.js (v16+ recommended)
* npm

### Building

1. Download and cd into the repository
```bash
cd luanti_ts
```
3. Install dependencies:
```bash
npm install
```
4. Compile the TypeScript source to the `dist` directory:
```bash
npx tsc
cd ../
```

## Usage with .mjs

The following example demonstrates how to import the built client in an `.mjs` file, connect to a server, and handle inventory events.

**index.mjs**

```javascript
import { Client } from "./luanti_ts/dist/Client.js";
import { ServerDetachedInventory } from "./luanti_ts/dist/command/server/ServerDetachedInventory.js";

const config = {
    host: "127.0.0.1",
    port: 30000,
    username: "BotUsername",
    password: "BotPassword"
};

// Disable internal logging if preferred
Client.Logger.setLevel(Client.Logger.OFF); 

// Initialize client with media fetching disabled
const client = new Client(config.host, config.port, { fetchMedia: false });

// Register event listeners for server commands
client.cc.events.on("ServerCommand", (cmd) => {
    // Example: Intercepting detached inventory updates
    if (cmd instanceof ServerDetachedInventory) {
        if (!cmd.parsedInventory) return;

        for (const [listName, list] of cmd.parsedInventory.lists) {
            for (const item of list.items) {
                // Check for specific item metadata or names
                if (item && item.name && item.name.endsWith("lodestone")) {
                    console.log(`Found item in ${cmd.name}/${listName}:`);
                    console.dir(item, { depth: null, colors: true });
                }
            }
        }
    }
});

// Handle process signals
process.on('SIGINT', () => {
    client.close();
    process.exit(0);
});

// Execute login sequence
await client.login(config.username, config.password);
await client.ready();
```

## API Reference

### Core Components

#### Client

**Source:** `src/Client.ts`
The main controller for the connection.

* **Properties**
* `cc` (CommandClient): Access to low-level network commands.
* `wm` (WorldMap): Access to map data.
* `scene` (Scene): Access to player position and physics state.
* `inventory` (Inventory): The local player's inventory.
* `events` (EventEmitter): High-level event emitter.
* `username` (string): The current username.
* `localPlayerId` (number): The entity ID of the bot.


* **Methods**
* `login(username: string, password: string): Promise<void>`
* `ready(): Promise<void[]>`
* `close(): void`



#### CommandClient

**Source:** `src/command/CommandClient.ts`
Handles protocol reliability and packet dispatch.

* **Properties**
* `peerId` (number): The peer ID assigned by the server.
* `events` (EventEmitter): Emits `ServerCommand` and `ServerPacket`.


* **Methods**
* `sendCommand(cmd: ClientCommand, type?: PacketType): Promise<void[]>`
* `waitForCommand<T>(type: Constructor<T>): Promise<T>`



#### WorldMap

**Source:** `src/scene/WorldMap.ts`
Manages received map blocks and node definitions.

* **Methods**
* `getNode(pos: Pos)`: Returns a `WorldNode` containing the definition and ID.
* `getBlock(pos: Pos)`: Returns raw `BlockData`.
* `getNodeID(pos: Pos)`: Returns the numeric ID of a node.



#### EntityManager

**Source:** `src/scene/EntityManager.ts`
Tracks active objects (players, entities) in range.

* **Properties**
* `entities` (Map<number, string>): Map of Entity ID to Name.
* `attachedToId` (number): ID of the parent entity if attached.


* **Methods**
* `isAttachedTo(entityName: string): boolean`



#### Scene

**Source:** `src/scene/Scene.ts`
Manages the bot's physical presence in the world.

* **Properties**
* `pos` (Pos): Current entity position.
* `speed` (Pos): Current velocity.
* `pitch`, `yaw` (number): view angles.



### Data Structures

#### Pos

**Source:** `src/util/pos.ts`
Represents a 3D coordinate.

* `x`, `y`, `z` (number)
* `add(p)`, `subtract(p)`, `multiply(p)`, `divide(p)`

#### Inventory

**Source:** `src/inventory/Inventory.ts`

* `lists` (Map<string, InventoryList>): Inventory lists keyed by name.

#### InventoryList

**Source:** `src/inventory/InventoryList.ts`

* `name` (string)
* `width` (number)
* `size` (number)
* `items` (ItemStack[]): Array of items.

#### ItemStack

**Source:** `src/inventory/ItemStack.ts`

* `name` (string): Item identifier (e.g. "default:stone").
* `count` (number): Number of items.
* `wear` (number): Durability (0-65535).
* `metadata` (string): Serialized metadata.
* `empty()`: Returns boolean.

#### BlockData

**Source:** `src/block/blockdata.ts`

* `pos` (Pos): MapBlock position.
* `mapNodes` (number[]): Flattened array of node IDs (4096 entries).
* `underground`, `dayNightDiff`, `generated` (boolean).

#### NodeDefinition

**Source:** `src/nodedefs/NodeDefinition.ts`

* `id` (number)
* `name` (string)
* `drawType` (NodeDrawType)
* `groups` (Map<string, number>)
* `paramtype1`, `paramtype2` (ContentParamType)

#### GenericCAOInitData

**Source:** `src/activeobject/GenericCAOInitData.ts`

* `name` (string)
* `isPlayer` (boolean)
* `id` (number)
* `pos` (x, y, z)
* `rot` (x, y, z)
* `hp` (number)

#### ParticleParameters

**Source:** `src/particle/ParticleTypes.ts`

* `pos`, `vel`, `acc` (x, y, z)
* `expirationtime` (number)
* `size` (number)
* `texture` (ParticleTexture)

---

### Client Commands (Outgoing)

Classes instantiated by the user to send actions to the server.
**Source:** `src/command/client/`

* **ClientChat**: `constructor(message: string)`
* **ClientDamage**: `constructor(amount: number)`
* **ClientDeletedBlocks**: `constructor(blocks: Pos[])`
* **ClientFirstSRP**: `constructor(salt: number[], verificationKey: number[])`
* **ClientGotBlocks**: `constructor(blocks: Pos[])`
* **ClientHaveMedia**: `constructor(tokens: number[])`
* **ClientInit**: `constructor(playername: string)`
* **ClientInit2**: `constructor(lang: string)`
* **ClientInteract**: `constructor(action: InteractAction, itemIndex: number, pointed: PointedThing, playerOptions: PlayerPosOptions)`
* **ClientInventoryAction**: `constructor(actionString: string)`
* **ClientInventoryFields**: `constructor(formname: string, fields: Map<string, string>)`
* **ClientNodemetaFields**: `constructor(pos: Pos, formname: string, fields: Map<string, string>)`
* **ClientPlayerItem**: `constructor(itemIndex: number)`
* **ClientPlayerPos**: `constructor(options: PlayerPosOptions)`
* **ClientReady**: `constructor()`
* **ClientRemovedSounds**: `constructor(soundIds: number[])`
* **ClientRequestMedia**: `constructor(fileNames: string[])`
* **ClientRespawn**: `constructor()`
* **ClientSRPBytesA**: `constructor(bytesA: number[])`
* **ClientSRPBytesM**: `constructor(bytesM: number[])`
* **ClientUpdateClientInfo**: `constructor(renderTargetWidth: number, renderTargetHeight: number, guiScaling: number, hudScaling: number, maxFormspecWidth: number, maxFormspecHeight: number, touchControls: boolean)`

---

### Server Commands (Incoming)

Classes received via the `ServerCommand` event.
**Source:** `src/command/server/`

* **ServerAccessDenied**: `reason` (DenyReason), `customReason` (string), `errorMessage` (string).
* **ServerActiveObjectMessages**: `messages` (Array<{ id: number, cmd: AoCommand }>).
* **ServerActiveObjectRemoveAdd**: `addedObjects` (Array<AddedObject>), `removedIds` (number[]).
* **ServerAnnounceMedia**: `files` (Array<{ name: string, sha1: string }>), `remoteServers` (string[]).
* **ServerAuthAccept**: `posX`, `posY`, `posZ` (number), `seed` (string).
* **ServerBlockData**: `pos` (Pos), `data` (Uint8Array).
* **ServerBreath**: `breath` (number).
* **ServerChatMessage**: `message` (string).
* **ServerCloudParams**: `density`, `colorBright`, `colorAmbient`, `height`, `thickness` (number).
* **ServerCSMRestrictionFlags**: `flags`, `range` (number).
* **ServerDetachedInventory**: `name` (string), `keepInventory` (boolean), `parsedInventory` (Inventory | undefined).
* **ServerFormspecPrepend**: `prepend` (string).
* **ServerHello**: `protocolVersion`, `authMechanismSrp`, `authMechanismFirstSrp`.
* **ServerHP**: `hp` (number), `damageEffect` (boolean).
* **ServerHudAdd**: `id`, `type`, `pos`, `name`, `scale`, `text`, `number`, `item`, `dir`, `align`, `offset`.
* **ServerHudChange**: `id` (number), `stat` (HudElementStat), `value` (any).
* **ServerHudSetFlags**: `flags`, `mask` (number).
* **ServerHudSetParam**: `param` (HudParam), `value` (string).
* **ServerInventory**: `inventoryString` (string), `parsedInventory` (Inventory | undefined).
* **ServerInventoryFormspec**: `formspec` (string).
* **ServerItemDefinitions**: `data` (Uint8Array).
* **ServerMedia**: `numBunches`, `bunchIndex` (number), `files` (MediaFileData[]).
* **ServerMovePlayer**: `posX`, `posY`, `posZ`, `pitch`, `yaw` (number).
* **ServerMovement**: `accelDefault`, `speedWalk`, `speedCrouch`, `speedFast`, `speedJump`, `gravity` (numbers).
* **ServerNodeDefinitions**: `data` (ArrayBuffer).
* **ServerOverrideDayNightRatio**: `doOverride` (boolean), `ratio` (number).
* **ServerPlaySound**: `serverId` (number), `name` (string), `pos` (x,y,z), `loop` (boolean).
* **ServerPlayerSpeed**: `addedVel` (x,y,z).
* **ServerPrivileges**: `privileges` (string[]).
* **ServerSRPBytesSB**: `bytesS` (number[]), `bytesB` (number[]).
* **ServerSetLighting**: `shadowIntensity`, `saturation`, `bloomIntensity` (optional numbers).
* **ServerSetMoon**: `visible` (boolean), `texture` (string).
* **ServerSetSky**: `bgColor` (number), `type` (string), `clouds` (boolean), `skyboxTextures` (string[]).
* **ServerSetStars**: `visible` (boolean), `count` (number), `color` (number).
* **ServerSetSun**: `visible` (boolean), `texture` (string).
* **ServerShowFormspec**: `formspec` (string), `formname` (string).
* **ServerSpawnParticleBatch**: `particles` (ParticleParameters[]).
* **ServerTimeOfDay**: `time_speed` (number), `time_of_day` (number).
* **ServerUpdatePlayerList**: `action` (PlayerListAction), `players` (string[]).
