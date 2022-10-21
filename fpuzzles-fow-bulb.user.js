// ==UserScript==
// @name         Fpuzzles-FOW
// @version      1.1
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

    const doShim = () => {
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
        };

        if (window.boolConstraints) {
            window.onload();
        }
    };

    const intervalId = setInterval(() => {
        if (typeof grid === 'undefined' ||
            typeof drawConstraints === 'undefined' ||
            typeof categorizeTools === 'undefined') {
            return;
        }

        clearInterval(intervalId);
        doShim();
    }, 16);
})();
