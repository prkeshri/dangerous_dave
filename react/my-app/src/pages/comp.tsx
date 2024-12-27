import { createContext, JSX, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import l from "../../../../dave.json"
import { init, Level, MCTX, Pos, TileValue, WarpZone } from './level'
let initLevels: Level[] = init(l as unknown as Level[]);
let levels: Level[] = init(JSON.parse(JSON.stringify(l)));
const mCtx = createContext<MCTX>({ setSelected: () => { }, pos: {}, onKeys: () => { } });
const details: any = {};
const tileValues: Record<string, TileValue> = {};

function toStorage(lvl: number) {
    window.localStorage.setItem(`level-${lvl}`, JSON.stringify(levels[lvl]));
}
function fromStorage() {
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
            levels = _levels;
            initLevels = JSON.parse(JSON.stringify(levels));
            return true;
        }
    } catch (e) {
        console.error("Error while fromStorage", e);
    }
    return false;
}
function Clicker({ children, keysListener = true, onKeys: onKeysIn, onNewPos, ctx: setCtx }: { children: any; keysListener?: boolean; onNewPos?: Function; onKeys?: Function; ctx?: Function }) {
    const [pos, setPos] = useState<Pos>({});
    const setSelected = ((t: any) => {
        if (t.warpOf) {
            t.row = 0;
        }
        setPos({
            ...pos,
            ...t,
        });
    });

    useEffect(() => {
        onNewPos?.(pos);
        if (!keysListener) {
            return;
        }
        window.addEventListener('keydown', onKeys);
        return () => window.removeEventListener('keydown', onKeys);
    }, [pos]);
    const onKeys = (event: any) => {
        const { row = 0, col = 0, rows = 0, cols = 0 } = pos;
        let nRow = row, nCol = col;
        const tileI = row * cols + col;
        const { level, warpOf } = pos;
        const { num = -1 } = level ?? {};
        switch (event.key) {
            case "ArrowLeft":
                // Left pressed
                nCol--;
                break;
            case "ArrowRight":
                // Right pressed
                nCol++;
                break;
            case "ArrowUp":
                // Up pressed
                if (!warpOf) {
                    nRow--;
                }
                break;
            case "ArrowDown":
                // Down pressed
                if (!warpOf) {
                    nRow++;
                }
                break;
            case "B":
            case "b": {
                if (!warpOf) {
                    return;
                }
                const { warp_zone: _warp } = warpOf;
                const warp = _warp as WarpZone;
                if(col > warp.zoneStartx + warp.daveStartx) {
                    return;
                }
                const diff = warp.zoneStartx - col;
                warp.zoneStartx = col;
                warp.daveStartx += diff;
                toStorage(warpOf.num);
                setPos({ ...pos }); // Just to trigger rerender!

                event.preventDefault();
            }
                break;
            case "S":
            case "s": {
                if (warpOf) {
                    const { warp_zone: _warp } = warpOf;
                    const warp = _warp as WarpZone;
                    if (col < warp.zoneStartx) {
                        return;
                    }
                    const diff = col - warp.zoneStartx;
                    warp.daveStartx = diff;
                    toStorage(warpOf.num);
                } else if (level) {
                    level.startx = col;
                    level.starty = row;
                    toStorage(num);
                } else {
                    break;
                }
                setPos({ ...pos }); // Just to trigger rerender!

                event.preventDefault();
                break;
            }
            case " ":
                {
                    if (warpOf) {
                        break;
                    }
                    const { sym } = details;
                    const currentValue = levels[num].tiles[tileI];
                    if (sym === undefined || currentValue == sym) {
                        break;
                    }
                    const tKey = `${num}-${tileI}`;
                    let tileValue = tileValues[tKey];
                    if (!tileValue) {
                        tileValue = tileValues[tKey] = {
                            i: 0,
                            l: 0,
                            q: [currentValue]
                        }
                    }
                    tileValue.l = ++tileValue.i;
                    tileValue.q[tileValue.l] = sym;
                    levels[num].tiles[tileI] = sym;
                    toStorage(num);
                    setPos({ ...pos }); // Just to trigger rerender!
                    event.preventDefault();
                }
                break;
            case "z":
                {
                    if (!event.ctrlKey) {
                        break;
                    }
                    const tKey = `${num}-${tileI}`;
                    const tileValue = tileValues[tKey];

                    if (!tileValue || tileValue.i <= 0) {
                        return;
                    }
                    const sym = tileValue.q[--tileValue.i];
                    levels[num].tiles[tileI] = sym;
                    toStorage(num);
                    setPos({ ...pos }); // Just to trigger rerender!
                    event.preventDefault();
                }
                break;
            case "y":
                {
                    if (!event.ctrlKey) {
                        break;
                    }
                    const tKey = `${num}-${tileI}`;
                    const tileValue = tileValues[tKey];

                    if (!tileValue || tileValue.i >= tileValue.l) {
                        return;
                    }
                    const sym = tileValue.q[++tileValue.i];
                    levels[num].tiles[tileI] = sym;
                    toStorage(num);
                    setPos({ ...pos }); // Just to trigger rerender!
                    event.preventDefault();
                }
                break;
        }
        const newPos: Pos = {};
        let updated = false;
        if (row !== nRow && nRow >= 0 && nRow < rows) {
            newPos.row = nRow;
            updated = true;
        }
        if (col != nCol && nCol >= 0 && nCol < cols) {
            newPos.col = nCol;
            updated = true;
        }
        if (updated) {
            event.preventDefault();
            setPos({
                ...pos,
                ...newPos
            });
        } else if (onKeysIn) {
            onKeysIn(event);
        }
    }
    const val: MCTX = ({
        setSelected, pos, onKeys
    });
    setCtx?.(val);
    return <div style={{ height: 'fit-content' }} onKeyDown={onKeys}>
        <mCtx.Provider value={val}>
            {children}
        </mCtx.Provider>
    </div>
}
export default function Comp() {
    const [sym, setSym] = useState(0);
    const onNewPos = (pos: Pos) => {
        setSym(parseInt(pos.tileHash ?? '0'));
    }

    details.sym = sym;

    const setCtx = (val: MCTX) => {
        val.Wrapper = ({ className, children }: any) => <div className={`col-wrap ${className ?? ''}`}>{children}</div>
    };
    const [rx, rerender] = useState(0);
    const fileInputMsgRef = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const load = fromStorage();
        if (load) {
            const fileInputMsg = fileInputMsgRef.current as NonNullable<HTMLSpanElement>;
            fileInputMsg.textContent = "Retrieved from Local Storage!";
            fileInputMsg.className = 'json-load-success';
        }
    }, []);


    const loadFile = (event: any) => {
        const fileInputMsg = fileInputMsgRef.current as NonNullable<HTMLSpanElement>;
        // Handle file selection and read the JSON file
        const file = event.target.files[0];

        if (file && file.type === "application/json") {
            const reader = new FileReader();

            // Read the file as text
            reader.readAsText(file);

            reader.onload = function (e) {
                const fileContent = e.target?.result;
                try {
                    // Parse the file content as JSON
                    const jsonContent = JSON.parse(fileContent as string);
                    const newLevels = init(jsonContent as Level[]);
                    if (levels) {
                        if (!confirm("This will override current data. Agree?")) {
                            return;
                        }
                    }
                    initLevels = init(JSON.parse(fileContent as string));
                    levels = newLevels;
                    // Display the parsed JSON in the pre element
                    fileInputMsg.textContent = "Load successful!";
                    fileInputMsg.className = 'json-load-success';

                    for (let i = 0; i < 12; i++) {
                        toStorage(i);
                    }
                    rerender(x => x + 1);
                } catch (error) {
                    // Handle invalid JSON
                    fileInputMsg.textContent = "Invalid JSON format.";
                    fileInputMsg.className = 'json-load-error';
                }
            };

            reader.onerror = function () {
                fileInputMsg.textContent = "Error reading the file.";
                fileInputMsg.className = 'json-load-error';
            };
        } else {
            fileInputMsg.textContent = "Please upload a valid JSON file.";
            fileInputMsg.className = 'json-load-error';
        }
    };

    return <>
        <div style={{ margin: 20 }}>
            Load JSON: <input type="file" onChange={loadFile} accept=".json"></input>&nbsp;&nbsp;<span ref={fileInputMsgRef} />
            <hr />
        </div>
        {<div key={rx}>
            <Clicker>
                <Levels />
            </Clicker>
            <hr style={{ margin: '10px 0px' }} />
            <Clicker keysListener={false} ctx={setCtx} onNewPos={onNewPos}>
                <Selectors />
            </Clicker>
        </div>
        }
    </>
}

function Levels({ lvl, isWarp }: { lvl?: number; isWarp?: boolean }) {
    const [currLevel, setCurrLevel] = useState(1);
    const [rx, rerender] = useState(0);
    const wLvl = useRef<HTMLInputElement>(null);
    const bClick = (incDec: number) => {
        let nextLevel = currLevel + incDec;
        if (nextLevel >= 0 && nextLevel <= 11) setCurrLevel(nextLevel);
    }
    const level = levels[lvl ?? currLevel];

    const download = () => {
        // Convert the JSON content to a string and create a Blob
        const jsonStr = JSON.stringify(levels, null, 4);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create a temporary link to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dave.json';  // Set the default download file name
        a.click();

        // Clean up by revoking the object URL
        URL.revokeObjectURL(url);
    };
    const resetLevel = () => {
        if (!confirm("This will reset the current level. All changes will be lost. Sure?")) {
            return;
        }
        levels[currLevel] = JSON.parse(JSON.stringify(initLevels[currLevel]));
        toStorage(currLevel);
        rerender(x => x + 1);
    }
    const resetAll = () => {
        if (!confirm("This will reset everything. All changes will be lost. Sure?")) {
            return;
        }
        levels = JSON.parse(JSON.stringify(initLevels));
        rerender(x => x + 1);
    }

    const changeWarp = (value$: string) => {
        if (value$ === '') {
            return;
        }

        let value = parseInt(value$);
        if (value > 10 || value < 0) {
            return;
        }
        const cMSg = value === 0 ? "Are you sure want to remove warp zone?" : "Are you sure want to change warp to level: " + value;
        if (!confirm(cMSg)) {
            return;
        }


        if (value === 0) {
            level.warp_zone = null;
        } else {
            if (!level.warp_zone) {
                level.warp_zone = {
                    zoneStartx: 0,
                    daveStartx: 0,
                    warp_level: value,
                }
            } else {
                level.warp_zone.warp_level = value;
            }
        }
        toStorage(level.num);
        setWLvTmpl(value + '');
        rerender(x => x + 1);
    }
    let warpInfo;

    const [wLvlTmp, setWLvTmpl] = useState('');
    useEffect(() => {
        setWLvTmpl((level.warp_zone?.warp_level ?? '') + '');
    }, [level.warp_zone?.warp_level]);
    if (!isWarp && level.warp_zone) {
        warpInfo = <>
            <ul style={{ fontSize: 15, marginLeft: 20 }}>
                <li>Can only change dave start point at the first row.</li>
                <li>If you want to change dave before start point, first change start point by pressing 'B'</li>
                <li>Cannot change start point after dave point!</li>
                <li>Warp level info will be shown below (if applicable). Press 'S' to make dave start at that point in warp level!</li>
                <li>Select a level.</li>
            </ul>
            <div style={{ overflow: 'scroll' }}>
                <LevelComp level={levels[level.warp_zone.warp_level]} warpOf={level} />
            </div>
        </>
    }


    const ctx = useContext(mCtx);
    return <>
        <div key={rx}>
            <h2 className='ctrl-container'>
                <div style={{ minWidth: '50%' }}>
                    <div>
                        <div>
                            <ul style={{ fontSize: 15, marginLeft: 20 }}>
                                <li>Select a level.</li>
                                <li>Click any tile item from below.</li>
                                <li>Use arrow keys or click on any tile to edit.</li>
                                <li>Press space to apply, Ctrl+z to undo, Ctrl+y to redo for that tile!</li>
                                <li>Press 'S' to make dave start at that point!</li>
                                <li>Download the json and load using dave_parse.py!</li>
                            </ul>
                            <hr style={{ marginTop: 10, marginBottom: 10 }} />
                            <div style={{ display: 'flex' }}>
                                LEVEL&nbsp;
                                <button className='btnX' onClick={() => bClick(-1)}>&lt;</button>&nbsp;{currLevel}&nbsp;
                                <button className='btnX' onClick={() => bClick(1)}>&gt;</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, justifyContent: 'flex-end', paddingRight: 20 }}>
                    <button className='btnXP download-btn' onClick={() => download()}>⬇️ Download <small>dave.json</small></button>
                    <button className='btnXP reset-btn' onClick={() => resetLevel()}>RESET LEVEL</button>
                    <button className='btnXP reset-btn' onClick={() => resetAll()}>RESET ALL</button>
                </div>
            </h2>
        </div>
        <hr style={{ margin: '10px 0px' }} />
        <div style={{ overflow: 'scroll' }}>
            <div>
                <LevelComp level={level} />
            </div>
        </div>
        <div>< hr />
            <div><h2 style={{ display: 'inline-block' }}>Warp Zone:</h2> <input type="number" ref={wLvl} value={wLvlTmp} onChange={e => setWLvTmpl(e.target.value)} min={0} max={10} style={{ width: 40 }} /> <button onClick={e => changeWarp(wLvl.current?.value ?? '')}>✔</button> (Enter 0 to reset)</div>
            {warpInfo}
        </div>
    </>
}

function Selectors() {
    const tiles = [];
    for (let i = 1; i < 53; i++) {
        tiles.push(i);
    }
    const l: Partial<Level> = {
        num: -1,
        tiles,
        rows: 3,
        cols: 12
    };
    return <>
        <h2 style={{ marginTop: 20, marginBottom: -20 }}>Click any:</h2>
        <div className='selectors' style={{ zoom: 2 }}>
            <LevelComp level={l as Level} />
        </div>
    </>
}
function LevelComp({ level, warpOf }: { level: Level; warpOf?: Level }) {
    const tileRows = [];
    const { rows, cols, num, tiles } = level;
    const ctx = useContext(mCtx);
    useEffect(() => {
        ctx.setSelected({
            cols,
            rows,

            level,
        });
    }, [num]);
    let i = 0;
    for (let row = 0; row < rows; row++) {
        const tileCols: JSX.Element[] = [];
        tileRows.push(<div className={`level-row level-row-${row}`}>{tileCols}</div>);
        for (let col = 0; col < cols; col++, i++) {
            const tileHash = tiles[i];
            tileCols.push(<Tile row={row} warpOf={warpOf} col={col} tileHash={tileHash} tileI={i} level={level} />);
        }
    }
    return <div style={{ zoom: 2 }} className={`level level-${level.num}`}>
        {tileRows}
    </div>;
}

function Tile(props: { warpOf?: Level; row: number; col: number; tileHash: number; tileI: number; level: Level }) {
    const { row, col, tileHash, level, warpOf } = props;
    const ctx = useContext(mCtx);
    const { Wrapper = ({ children }: { children: any; }) => <>{children}</> } = ctx;
    const { pos } = ctx;
    const { warp_zone: warp } = warpOf ?? {}
    return <Wrapper className={
        classNames({
            focus: pos.type === 'tile' && pos.col === col && pos.row === row
        })
    }>
        <div onClick={(e) => ctx.setSelected({ type: 'tile', ...props, tile: e.target })} className={
            classNames('level-col',
                {
                    [`level-col-${tileHash}`]: tileHash !== 0,
                    focus: pos.level?.num === level.num && pos.type === 'tile' && pos.col === col && pos.row === row,
                    'level-warp-dave-start': (warp?.daveStartx ?? -1) + (warp?.zoneStartx ?? 0) === col && row === 0,
                    'level-dave-start': (!warp && level.startx === col && level.starty === row),
                    'level-warp-start': warp?.zoneStartx === col,
                    'level-warp-pre': (warp ? (col < warp.zoneStartx) : false),
                },
            )} data-row={row} data-col={col} />
    </Wrapper>;
}