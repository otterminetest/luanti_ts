import { consumeJsonString } from "../util/serialization.js";

export class ItemStack {
    name = "";
    count = 0;
    wear = 0;
    metadata = "";

    constructor(name = "", count = 0, wear = 0, metadata = "") {
        this.name = name;
        this.count = count;
        this.wear = wear;
        this.metadata = metadata;
    }

    empty(): boolean {
        return this.count === 0 || this.name === "";
    }

    static fromString(str: string): ItemStack {
        const item = new ItemStack();
        if (!str || str.trim().length === 0) return item;

        let index = 0;

        // 1. Name
        const [name, idx1] = consumeJsonString(str, index);
        item.name = name;
        index = idx1;

        // Check if we are done
        if (index >= str.length) {
            item.count = 1;
            return item;
        }

        // 2. Count
        const [countStr, idx2] = consumeJsonString(str, index);
        if (countStr !== "") {
            item.count = Number.parseInt(countStr);
            index = idx2;
        } else {
            item.count = 1;
        }

        // Check if we are done
        if (index >= str.length) return item;

        // 3. Wear
        const [wearStr, idx3] = consumeJsonString(str, index);
        if (wearStr !== "") {
            item.wear = Number.parseInt(wearStr);
            index = idx3;
        }

        // Check if we are done
        if (index >= str.length) return item;

        // 4. Metadata
        // Metadata is often a JSON object or specific format enclosed in quotes
        const [metaStr, idx4] = consumeJsonString(str, index);
        item.metadata = metaStr;

        return item;
    }

    toString(): string {
        return `ItemStack(name="${this.name}", count=${this.count}, wear=${this.wear})`;
    }
}
