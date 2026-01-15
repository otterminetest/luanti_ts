import { ItemStack } from "./ItemStack.js";

export class InventoryList {
    name: string;
    width = 0;
    items: ItemStack[] = [];
    size = 0;

    constructor(name: string, size: number) {
        this.name = name;
        this.size = size;
        this.items = new Array(size).fill(null).map(() => new ItemStack());
    }

    setSize(newSize: number) {
        this.size = newSize;
        // Resize array, preserving existing items where possible
        if (this.items.length !== newSize) {
            const newItems = new Array(newSize).fill(null).map(() => new ItemStack());
            for (let i = 0; i < Math.min(this.items.length, newSize); i++) {
                newItems[i] = this.items[i];
            }
            this.items = newItems;
        }
    }

    setWidth(newWidth: number) {
        this.width = newWidth;
    }

    /**
     * Helper to get item at specific index
     */
    getItem(index: number): ItemStack {
        if (index >= 0 && index < this.items.length) {
            return this.items[index];
        }
        return new ItemStack();
    }
}
