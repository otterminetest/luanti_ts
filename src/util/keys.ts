export enum PlayerControlKeys {
    None = 0,
    Up = 1 << 0,
    Down = 1 << 1,
    Left = 1 << 2,
    Right = 1 << 3,
    Jump = 1 << 4,
    Aux1 = 1 << 5, // Special/Sprint
    Sneak = 1 << 6,
    Dig = 1 << 7, // Left Mouse Button
    Place = 1 << 8, // Right Mouse Button
    Zoom = 1 << 9,
}
