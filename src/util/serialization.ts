export function consumeJsonString(str: string, startIndex: number): [string, number] {
    let i = startIndex;
    // Skip leading whitespace
    while (i < str.length && str[i] <= " ") i++;
    if (i >= str.length) return ["", i];

    if (str[i] === '"') {
        // It's a quoted string
        let result = "";
        i++; // skip open quote
        while (i < str.length) {
            const char = str[i];
            if (char === '"') {
                i++; // skip close quote
                break;
            }
            if (char === "\\") {
                if (i + 1 < str.length) {
                    const next = str[i + 1];
                    // Simple escape handling matching standard JSON/C++ expectations
                    if (next === '"') result += '"';
                    else if (next === "\\") result += "\\";
                    else if (next === "n") result += "\n";
                    else if (next === "t") result += "\t";
                    else result += next; // fallback
                    i += 2;
                } else {
                    // Trailing slash?
                    i++;
                }
            } else {
                result += char;
                i++;
            }
        }
        return [result, i];
    }
    // Read until next whitespace
    let end = i;
    while (end < str.length && str[end] > " ") end++;
    return [str.substring(i, end), end];
}
