// src/js/app.js

import BingoBoard from './bingoBoard.js';

const MARKED_KEY = 'bingo:marked:v1';
const tasksPath = './data/tasks.json';

const boardEl = document.getElementById('board');
const tasksListEl = document.getElementById('tasksList');
const lettersEl = document.getElementById('letters');
const resetBtn = document.getElementById('resetBtn');

const bingo = new BingoBoard();

function saveMarkedNumbers(set) {
    const arr = Array.from(set);
    localStorage.setItem(MARKED_KEY, JSON.stringify(arr));
}

function loadMarkedNumbers() {
    const raw = localStorage.getItem(MARKED_KEY);
    if (!raw) return new Set();
    try {
        const arr = JSON.parse(raw);
        return new Set(arr);
    } catch {
        return new Set();
    }
}

const markedSet = loadMarkedNumbers();

// initialize board model from storage
for (const n of markedSet) {
    const idx = Number(n);
    if (Number.isInteger(idx) && idx >= 1 && idx <= 25) {
        const r = Math.floor((idx - 1) / 5);
        const c = (idx - 1) % 5;
        bingo.markTile(r, c);
    }
}

function renderBoard() {
    if (!boardEl) return;
    // ensure grid layout in case CSS didn't apply
    try {
        boardEl.style.display = 'grid';
        boardEl.style.gridTemplateColumns = 'repeat(5, var(--tile-size))';
        boardEl.style.gridAutoRows = 'var(--tile-size)';
    } catch (e) {
        console.warn('Could not set board grid styles:', e);
    }
    console.log('renderBoard: marked tiles=', Array.from(markedSet).sort((a,b)=>a-b));
    boardEl.innerHTML = '';
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const tile = document.createElement('div');
            tile.className = 'tile' + (bingo.isTileMarked(r, c) ? ' marked' : '');
            const num = bingo.board[r][c].number;
            tile.textContent = String(num);
            tile.setAttribute('data-number', String(num));
            tile.setAttribute('role', 'button');
            tile.addEventListener('click', () => {
                const checked = !bingo.isTileMarked(r, c);
                console.log('tile click', num, '->', checked);
                setMarked(num, checked, true);
            });
            boardEl.appendChild(tile);
        }
    }
    updateLetters();
}

function updateLetters() {
    // Strike letters one at a time: each completed winning line strikes the next letter
    // User must complete 5 winning lines to strike all B I N G O letters.
    if (!lettersEl) return;
    let completedCount = 0;
    for (const condition of bingo.winningConditions) {
        const complete = condition.every(([r, c]) => bingo.isTileMarked(r, c));
        if (complete) completedCount++;
    }
    const strikeCount = Math.min(completedCount, 5);
    console.log('updateLetters: completed winning lines =', completedCount, '-> striking', strikeCount, 'letters');
    const spans = Array.from(lettersEl.querySelectorAll('span'));
    spans.forEach((s, idx) => {
        if (idx < strikeCount) s.classList.add('struck'); else s.classList.remove('struck');
    });
}

function setMarked(number, checked, syncCheckboxes = false) {
    const n = Number(number);
    console.log('setMarked called for', n, checked);
    if (!Number.isInteger(n) || n < 1 || n > 25) return;
    const r = Math.floor((n - 1) / 5);
    const c = (n - 1) % 5;

    if (checked) {
        bingo.markTile(r, c);
        markedSet.add(n);
    } else {
        bingo.board[r][c].marked = false;
        markedSet.delete(n);
    }
    saveMarkedNumbers(markedSet);
    renderBoard();

    if (syncCheckboxes) {
        const cb = tasksListEl.querySelector(`input[data-number="${n}"]`);
        if (cb) cb.checked = checked;
    }
}

function renderTasks(tasks) {
    if (!tasksListEl) return;
    tasksListEl.innerHTML = '';
    tasks.forEach((text, i) => {
        const num = i + 1;
        const item = document.createElement('label');
        item.className = 'task-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.setAttribute('data-number', String(num));
        cb.checked = markedSet.has(num);
        cb.addEventListener('change', (e) => {
            console.log('checkbox change', num, e.target.checked);
            setMarked(num, e.target.checked, false);
        });
        const span = document.createElement('span');
        span.textContent = `${num}. ${text}`;
        item.appendChild(cb);
        item.appendChild(span);
        tasksListEl.appendChild(item);
    });
}

async function loadTasksFile() {
    try {
        const resp = await fetch(tasksPath);
        if (!resp.ok) throw new Error('Failed to load tasks: ' + resp.status);
        const contentType = resp.headers.get('content-type') || '';
        let lines = [];
        if (contentType.includes('application/json')) {
            const data = await resp.json();
            if (Array.isArray(data)) {
                lines = data.map((t, i) => (typeof t === 'string' ? t : (t.description ?? `Task ${t.id ?? i+1}`)));
            }
        } else {
            const txt = await resp.text();
            lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        }
        while (lines.length < 25) lines.push('Task ' + (lines.length + 1));
        renderTasks(lines.slice(0,25));
    } catch (err) {
        const fallback = Array.from({length:25}, (_,i)=>`Task ${i+1}`);
        renderTasks(fallback);
        console.warn('Could not load tasks file:', err);
    }
}

resetBtn && resetBtn.addEventListener('click', () => {
    if (!confirm('Reset board and tasks?')) return;
    localStorage.removeItem(MARKED_KEY);
    bingo.resetBoard();
    markedSet.clear();
    renderBoard();
    const cbs = tasksListEl && tasksListEl.querySelectorAll('input[type="checkbox"]');
    cbs && cbs.forEach(cb => cb.checked = false);
});

document.addEventListener('DOMContentLoaded', async () => {
    // load tasks and render initial board
    await loadTasksFile();
    renderBoard();
    // expose for debugging in console
    try {
        window.__bingo = bingo;
        window.__setMarked = setMarked;
        window.__markedSet = markedSet;
        console.log('Debug helpers: __bingo, __setMarked(number,checked), __markedSet');
    } catch (e) {
        /* ignore */
    }
});