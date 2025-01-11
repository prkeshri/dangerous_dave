import { Level, TileValue } from "./types";
import l from "../../../../dave.json";

export const g: {
    initLevels: Level[];
    levels: Level[];
    details: any;
    tileValues: Record<string, TileValue>;
} = {
    initLevels: init(l as unknown as Level[]),
    levels: init(JSON.parse(JSON.stringify(l))),
    details: {},
    tileValues: {},
};

/**
 * Manipulates initialisation level data
 */
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
