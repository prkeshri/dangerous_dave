import { g } from './utils';
import { Level } from './types';

/**
 * Saves current progress to local storage
 */
export function toStorage(lvl: number) {
    window.localStorage.setItem(`level-${lvl}`, JSON.stringify(g.levels[lvl]));
}

/**
 * Loads progress from Localstorage
 */
export function fromStorage() {
    try {
        let k = 0;
        const _levels: Level[] = [];
        for (let lvl = 0; lvl < 12; lvl++) {
            const levelStr = window.localStorage.getItem(`level-${lvl}`);
            if (levelStr) {
                const level = JSON.parse(levelStr);
                _levels[lvl] = level;
                k++;
            }
        }
        if (k === 12) {
            g.levels = _levels;
            g.initLevels = JSON.parse(JSON.stringify(g.levels));
            return true;
        }
    } catch (e) {
        console.error("Error while fromStorage", e);
    }
    return false;
}
