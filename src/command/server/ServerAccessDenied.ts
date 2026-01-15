import type { ServerCommand } from "../ServerCommand.js";
import { PayloadHelper } from "../packet/PayloadHelper.js";

export enum DenyReason {
    SERVER_ACCESSDENIED_WRONG_PASSWORD = 0,
    SERVER_ACCESSDENIED_UNEXPECTED_DATA = 1,
    SERVER_ACCESSDENIED_SINGLEPLAYER = 2,
    SERVER_ACCESSDENIED_WRONG_VERSION = 3,
    SERVER_ACCESSDENIED_WRONG_CHARS_IN_NAME = 4,
    SERVER_ACCESSDENIED_WRONG_NAME = 5,
    SERVER_ACCESSDENIED_TOO_MANY_USERS = 6,
    SERVER_ACCESSDENIED_EMPTY_PASSWORD = 7,
    SERVER_ACCESSDENIED_ALREADY_CONNECTED = 8,
    SERVER_ACCESSDENIED_SERVER_FAIL = 9,
    SERVER_ACCESSDENIED_CUSTOM_STRING = 10,
    SERVER_ACCESSDENIED_SHUTDOWN = 11,
    SERVER_ACCESSDENIED_CRASH = 12,
    SERVER_ACCESSDENIED_MAX = 13,
}

const AccessDeniedStrings = [
    "Invalid password",
    "Your client sent something the server didn't expect.  Try reconnecting or updating your client.",
    "The server is running in singleplayer mode.  You cannot connect.",
    "Your client's version is not supported.\nPlease contact the server administrator.",
    "Player name contains disallowed characters",
    "Player name not allowed",
    "Too many users",
    "Empty passwords are disallowed.  Set a password and try again.",
    "Another client is connected with this name.  If your client closed unexpectedly, try again in a minute.",
    "Internal server error",
    "Unknown", // Custom string usually replaces this
    "Server shutting down",
    "The server has experienced an internal error.  You will now be disconnected.",
];

export class ServerAccessDenied implements ServerCommand {
    reason: DenyReason = 0;
    customReason = "";
    reconnect = false;

    // The final, human-readable error message to display to the user
    errorMessage = "";

    unmarshalPacket(dv: DataView): void {
        const ph = new PayloadHelper(dv);
        let offset = 0;

        // 1. u8 reason
        this.reason = dv.getUint8(offset);
        offset += 1;

        // 2. std::string custom_reason
        if (offset < dv.byteLength) {
            this.customReason = ph.getString(offset);
            offset += 2 + this.customReason.length;
        }

        // 3. u8 reconnect (bool)
        if (offset < dv.byteLength) {
            this.reconnect = ph.getBool(offset);
            offset += 1;
        }

        // Determine the final message
        if (this.customReason.length > 0) {
            this.errorMessage = this.customReason;
        } else {
            this.errorMessage = AccessDeniedStrings[this.reason] || "Unknown access denied error";
        }
    }
}
