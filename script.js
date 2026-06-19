const GRID_SIZE = 32;
const COLORS = [
  '#FF0000',
  '#FF7F00',
  '#FFFF00',
  '#00FF00',
  '#00BFFF',
  '#0000FF',
  '#8B00FF',
  '#FFFFFF',
  '#000000'
];
const BG_COLOR = '#533213';
let grid = [];
let selectedColorIndex = 0;
let currentTool = 'pencil';
let isDrawing = false;

function intGrid() {
  const loaded = loadGrid();
  if (!loaded){
    grid =[];
    for (let r=0; r<GRID_SIZE; r++){
      grid[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                grid[r][c] = -1;
    }
  }
}
  if (!loadSelectedColor()) {
    selectedColorIndex = 0;
  }
  renderGrid();
  renderPalette();
  updateActiveUI();
  saveGrid();
}
function renderGrid() {
    gridEl.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            pixel.dataset.row = r;
            pixel.dataset.col = c;
            const colorIndex = grid[r][c];
            pixel.style.background = (colorIndex === -1) ? BG_COLOR : COLORS[colorIndex];
            pixel.addEventListener('mousedown', onPixelMouseDown);
            pixel.addEventListener('mouseenter', onPixelMouseEnter);
            pixel.addEventListener('mouseup', onPixelMouseUp);
            pixel.addEventListener('contextmenu', e => e.preventDefault());
            gridEl.appendChild(pixel);
        }
    }
}


function renderPalette() {
    paletteEl.innerHTML = '';
    for (let i = 0; i < COLORS.length; i++) {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = COLORS[i];
        swatch.dataset.idx = i;
        swatch.addEventListener('click', () => selectColor(i));
        paletteEl.appendChild(swatch);
    }
    bgSwatchEl.style.background = BG_COLOR;
    updateActiveUI();
}

function updateActiveUI() {
    document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active'));
    bgSwatchEl.classList.remove('active');
    if (selectedColorIndex === -1) {
        bgSwatchEl.classList.add('active');
    } else {
        const swatches = document.querySelectorAll('.color-swatch');
        if (selectedColorIndex >= 0 && selectedColorIndex < swatches.length) {
            swatches[selectedColorIndex].classList.add('active');
        }
    }
}

function selectColor(index) {
    if (index < -1 || index >= COLORS.length) return;
    selectedColorIndex = index;
    updateActiveUI();
    saveGrid();
}
//функции инструментов 
function getPixelElement(row, col) {
    return gridEl.querySelector(`.pixel[data-row="${row}"][data-col="${col}"]`);
}

function setPixel(row, col, colorIndex) {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;
    grid[row][col] = colorIndex;
    const el = getPixelElement(row, col);
    if (el) {
        el.style.background = (colorIndex === -1) ? BG_COLOR : COLORS[colorIndex];
    }
}

function getPixel(row, col) {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return -1;
    return grid[row][col];
}
function floodFill(row, col, oldColor, newColor) {
    if (oldColor === newColor) return;
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;
    if (getPixel(row, col) !== oldColor) return;
    const queue = [[row, col]];
    const visited = new Set();
    visited.add(row + ',' + col);
    const pixelsToFill = [];
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        pixelsToFill.push([r, c]);
        const neighbors = [
            [r - 1, c], [r + 1, c],
            [r, c - 1], [r, c + 1]
        ];
        for (const [nr, nc] of neighbors) {
            const key = nr + ',' + nc;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE &&
                !visited.has(key) && getPixel(nr, nc) === oldColor) {
                visited.add(key);
                queue.push([nr, nc]);
            }
        }
    }

    if (pixelsToFill.length === 0) return;
    const elements = []; 
    for (const [r, c] of pixelsToFill) {
        grid[r][c] = newColor;
        const el = gridEl.querySelector(`.pixel[data-row="${r}"][data-col="${c}"]`);
        if (el) {
            el.style.background = (newColor === -1) ? BG_COLOR : COLORS[newColor];
            el.style.opacity = '0'; 
            elements.push(el);
        }
    }

    anime({
        targets: elements,       
        opacity: [0, 1],      
        duration: 400,          
        easing: 'easeOutQuad',    
        delay: (el, i) => {
            const r = parseInt(el.dataset.row);
            const c = parseInt(el.dataset.col);
            const distance = Math.abs(r - row) + Math.abs(c - col);
            return distance * 20 + i * 1.5;
        },
        complete: function() {
            elements.forEach(el => el.style.opacity = '1');
            saveGrid();
        }
    });
    setTimeout(() => {
        elements.forEach(el => el.style.opacity = '1');
    }, pixelsToFill.length * 2 + 500);
}
