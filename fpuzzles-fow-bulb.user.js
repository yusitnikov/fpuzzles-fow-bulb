// ==UserScript==
// @name         Fpuzzles-FOW
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Adds the Fog of War Bulb constraint to f-puzzles.
// @author       Chameleon
// @updateURL    https://github.com/yusitnikov/fpuzzles-fow-bulb/raw/main/fpuzzles-fow-bulb.user.js
// @match        https://*.f-puzzles.com/*
// @match        https://f-puzzles.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
    const id = 'fogofwarbulb';
    const name = 'Fog of War Bulb';
    const bulbChar = '💡';

    const doShim = () => {
        const origExportPuzzle = exportPuzzle;
        exportPuzzle = function(includeCandidates) {
            const compressed = origExportPuzzle(includeCandidates);
            const puzzle = JSON.parse(compressor.decompressFromBase64(compressed));

            if (puzzle[id]) {
                if (puzzle[id].length) {
                    puzzle.fogofwar = puzzle[id].map(({cell}) => cell);
                }
                delete puzzle[id];
            }

            if (puzzle.negative && puzzle.negative.includes(id)) {
                puzzle.negative = puzzle.negative.filter(v => v !== id);
                if (puzzle.negative.length === 0) {
                    delete puzzle.negative;
                }
            } else if (puzzle.fogofwar) {
                puzzle.text = puzzle.text || [];
                puzzle.text.push(...puzzle.fogofwar.map(cell => ({
                    cells: [cell],
                    value: bulbChar,
                    color: '#ff0000',
                    size: 0.75
                })));
            }

            return compressor.compressToBase64(JSON.stringify(puzzle));
        }

        const origImportPuzzle = importPuzzle;
        importPuzzle = function(string, clearHistory) {
            const puzzle = JSON.parse(compressor.decompressFromBase64(string));

            if (puzzle.fogofwar) {
                if (Array.isArray(puzzle.fogofwar)) {
                    puzzle[id] = puzzle.fogofwar.map(cell => ({cell}));

                    const isFowText = ({cells, value}) => value === bulbChar && cells.length === 1 && puzzle.fogofwar.includes(cells[0]);
                    if (puzzle.text && puzzle.text.some(isFowText)) {
                        puzzle.text = puzzle.text.filter(obj => !isFowText(obj));
                        if (puzzle.text.length === 0) {
                            delete puzzle.text;
                        }
                    } else {
                        puzzle.negative = puzzle.negative || [];
                        puzzle.negative.push(id);
                    }
                }

                delete puzzle.fogofwar;
            }

            string = compressor.compressToBase64(JSON.stringify(puzzle));
            origImportPuzzle(string, clearHistory);
        }

        const origDrawConstraints = drawConstraints;
        drawConstraints = (...args) => {
            origDrawConstraints(...args);

            for (const c of constraints[id] || []) {
                c.show();
            }
        }

        window[id] = function(cells) {
            if (cells && cells.length) {
                this.cell = cells[0];
            }

            this.show = () => {
                if (!this.cell) {
                    return;
                }

                ctx.save();

                const size = 0.7;
                ctx.translate(this.cell.x + cellSL / 2, this.cell.y + cellSL / 2);
                ctx.font = (cellSL * 0.8 * size) + 'px Arial';
                ctx.fillText('💡', 0, cellSL * 0.3 * size);

                ctx.restore();
            };
        };

        const origCategorizeTools = categorizeTools;
        categorizeTools = () => {
            origCategorizeTools();

            toolConstraints.push(name);
            perCellConstraints.push(name);
            oneCellAtATimeTools.push(name);
            tools.push(name);
            // not really a negative constraint, just tell the UI to show the checkbox
            negativableConstraints.push(name);
        };

        descriptions[name] = [
            'Click on a cell to put a "fog of war" light source in it.',
            'Putting at least one bulb into the grid enables the fog in SudokuPad.',
            '',
            'Please note that the fog feature will work properly',
            'only when the puzzle includes the solution!'
        ];
        descriptions[name + '-'] = ["Don't show the bulbs in SudokuPad"];

        if (window.boolConstraints) {
            window.onload();
        }
    };

    const intervalId = setInterval(() => {
        if (typeof grid === 'undefined' ||
            typeof exportPuzzle === 'undefined' ||
            typeof importPuzzle === 'undefined' ||
            typeof drawConstraints === 'undefined' ||
            typeof categorizeTools === 'undefined') {
            return;
        }

        clearInterval(intervalId);
        doShim();
    }, 16);
})();
