
export interface Level {
    num: number
    height: string
    path_data: string[]
    tiles: string[]
    tiles_offset: string
    title: string
    warp_zone?: WarpZone
    width: string
    rows: number
    cols: number
}

export interface WarpZone {
    init_motion: string
    startx: number
    starty: number
    warp_level: number
}

export function init(levels: Level[]) {
    levels.forEach((level, i) => {
        if (i === 0) {
            level.rows = 7;
            level.cols = 10;
        } else {
            level.rows = 10;
            level.cols = 100;
        }
        level.num = i;
    });
    return levels;
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
}

export interface MCTX {
    setSelected: Function;
    pos: Pos,
    onKeys: Function;

    Wrapper?: any;
}