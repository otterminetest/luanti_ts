import { InventoryList } from "./InventoryList.js";
import { ItemStack } from "./ItemStack.js";

export class Inventory {
    lists = new Map<string, InventoryList>();

    /**
     * Parses the raw inventory string protocol.
     * @param data The raw inventory string received from the server (e.g. from ServerInventory packet)
     */
    deSerialize(data: string) {
        const lines = data.split("\n");
        let currentList: InventoryList | null = null;
        let itemIndex = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0) continue;

            const parts = trimmed.split(" ");
            const command = parts[0];

            if (command === "EndInventory") {
                break; // Done
            }
            if (command === "List") {
                // Format: List <name> <size>
                const name = parts[1];
                const size = Number.parseInt(parts[2]);

                // Get or Create list
                if (!this.lists.has(name)) {
                    this.lists.set(name, new InventoryList(name, size));
                }
                // biome-ignore lint/style/noNonNullAssertion: map set above
                currentList = this.lists.get(name)!;
                currentList.setSize(size); // Ensure size matches
                itemIndex = 0;
            } else if (command === "KeepList") {
                // Format: KeepList <name>
                // We just ensure the list exists in our map if previously known,
                // but since we are parsing a stream, 'KeepList' essentially means "don't touch".
                // In a stateless parse (creating new Inventory), this might result in a missing list body,
                // but usually this method is called on an existing Inventory object to update it.
                const name = parts[1];
                currentList = null; // No subsequent items follow a KeepList command for that list
            } else if (command === "EndInventoryList") {
                currentList = null;
            } else if (currentList) {
                // We are inside a list, parse list commands
                if (command === "Width") {
                    currentList.setWidth(Number.parseInt(parts[1]));
                } else if (command === "Item") {
                    // Format: Item <itemstring>
                    // The rest of the line is the item string.
                    // We can't just join parts because spaces in quotes are valid.
                    // We strip "Item " from the raw line.
                    const itemStr = line.substring(line.indexOf("Item ") + 5);
                    const item = ItemStack.fromString(itemStr);

                    if (itemIndex < currentList.items.length) {
                        currentList.items[itemIndex] = item;
                    }
                    itemIndex++;
                } else if (command === "Empty") {
                    // Empty slot
                    if (itemIndex < currentList.items.length) {
                        currentList.items[itemIndex] = new ItemStack();
                    }
                    itemIndex++;
                } else if (command === "Keep") {
                    // Keep item at current index (no change)
                    itemIndex++;
                }
            }
        }
    }
}
