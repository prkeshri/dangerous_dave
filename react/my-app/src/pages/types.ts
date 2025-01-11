
export interface Level {
    num: number
    path_data: number[]
    tiles: number[]
    warp_zone?: WarpZone | null
    rows: number
    cols: number

    startx: number
    starty: number
}

export interface WarpZone {
    zoneStartx: number
    daveStartx: number
    warp_level: number
}

export interface Pos {
    type?: string;
    row?: number;
    col?: number;

    rows?: number;
    cols?: number;

    tileI?: number;
    tileHash?: string;

    level?: Level;
    tile?: any;

    warpOf?: Level;
}

export interface MCTX {
    setSelected: Function;
    pos: Pos,
    onKeys: Function;

    Wrapper?: any;
}

export interface TileValue {
    i: number;
    l: number;
    q: number[];
}