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

const gridEl = document.getElementById('pixelGrid');
const paletteEl = document.getElementById('paletteGrid');
const bgSwatchEl = document.getElementById('bgSwatch');
const bgPickerEl = document.getElementById('bgPicker');
const toolButtons = document.querySelectorAll('.tool-btn');
const clearButton = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');    
const downloadBtn = document.getElementById('downloadBtn');  
const exportPreview = document.getElementById('exportPreview');
const exportImg = document.getElementById('exportImg');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const downloadFromPreviewBtn = document.getElementById('downloadFromPreviewBtn');

function initGrid() {
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
function selectColor(index) {
    if (index < -1 || index >= COLORS.length) return;
    selectedColorIndex = index;
    updateActiveUI();
    saveGrid();
}
function selectTool(toolName) {
    currentTool = toolName;
    toolButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === toolName);
    });
    const pixels = document.querySelectorAll('.pixel');
    if (toolName === 'fill') {
        pixels.forEach(p => p.style.cursor = 'pointer');
    } else if (toolName === 'eraser') {
        pixels.forEach(p => p.style.cursor = 'not-allowed');
    } else {
        pixels.forEach(p => p.style.cursor = 'crosshair');
    }
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
//мышь слепая
function onPixelMouseDown(e) {
    e.preventDefault();
    const el = e.currentTarget;
    const row = parseInt(el.dataset.row);
    const col = parseInt(el.dataset.col);
    if (e.button !== 0) return;
    isDrawing = true;

    if (currentTool === 'eyedropper') {
        const colorIdx = getPixel(row, col);
        selectColor(colorIdx);
        return;
    }
    if (currentTool === 'fill') {
        const targetColor = getPixel(row, col);
        const fillColor = selectedColorIndex;
        floodFill(row, col, targetColor, fillColor);
        return;
    }
    if (currentTool === 'eraser') {
        setPixel(row, col, -1);
        saveGrid();
        return;
    }
    setPixel(row, col, selectedColorIndex);
    saveGrid();
}
function onPixelMouseEnter(e) {
    if (!isDrawing) return;
    const el = e.currentTarget;
    const row = parseInt(el.dataset.row);
    const col = parseInt(el.dataset.col);
    if (currentTool === 'eraser') {
        setPixel(row, col, -1);
        saveGrid();
        return;
    }
    if (currentTool === 'pencil') {
        setPixel(row, col, selectedColorIndex);
        saveGrid();
    }
}
function onPixelMouseUp(e) {
    if (e.button === 0) isDrawing = false;
}
document.addEventListener('mouseup', () => { isDrawing = false; });

// ОЧИСТКА
function clearGrid() {
    if (!confirm('Очистить всё?')) return;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            grid[r][c] = -1;
        }
    }
    renderGrid();
    saveGrid();
    exportPreview.classList.remove('visible');
}
// работа с COOKIE (сохранение и загрузка)
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}
function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + d.toUTCString() + '; path=/';
}
function encodeGrid(gridData) {
    const flat = gridData.flat();
    const rle = [];
    let current = flat[0];
    let count = 1;
    for (let i = 1; i < flat.length; i++) {
        if (flat[i] === current) {
            count++;
        } else {
            rle.push(current, count);
            current = flat[i];
            count = 1;
        }
    }
    rle.push(current, count);
    return rle.join(',');
}

function decodeGrid(encoded, size) {
    const parts = encoded.split(',').map(Number);
    const flat = [];
    for (let i = 0; i < parts.length; i += 2) {
        const val = parts[i];
        const count = parts[i + 1];
        for (let j = 0; j < count; j++) {
            flat.push(val);
        }
    }
    while (flat.length < size * size) flat.push(-1);
    const result = [];
    for (let r = 0; r < size; r++) {
        result.push(flat.slice(r * size, (r + 1) * size));
    }
    return result;
}
function saveGrid() {
    const encoded = encodeGrid(grid);
    setCookie('pixelGrid', encoded);
    setCookie('selectedColor', String(selectedColorIndex));
}
function loadGrid() {
    const encoded = getCookie('pixelGrid');
    if (encoded) {
        try {
            grid = decodeGrid(encoded, GRID_SIZE);
            return true;
        } catch (_) { /* ignore */ }
    }
    return false;
}
function loadSelectedColor() {
    const val = getCookie('selectedColor');
    if (val !== null) {
        const idx = parseInt(val, 10);
        if (!isNaN(idx) && idx >= -1 && idx < COLORS.length) {
            selectedColorIndex = idx;
            return true;
        }
    }
    return false;
}
//экспорт и скачивание
function exportGrid() {
    const node = gridEl;
    domtoimage.toPng(node, {
        width: 640,
        height: 640,
        style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
        }
    }).then(function(dataUrl) {
        exportImg.src = dataUrl;
        exportPreview.classList.add('visible');
    }).catch(function(err) {
        console.error('Export error:', err);
        alert('Ошибка экспорта. Попробуйте снова.');
    });
}

function downloadImage(dataUrl, filename = 'pixelart.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadFromGrid() {
    const node = gridEl;
    domtoimage.toPng(node, {
        width: 640,
        height: 640,
        style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
        }
    }).then(function(dataUrl) {
        downloadImage(dataUrl, 'pixelart.png');
    }).catch(function(err) {
        console.error('Download error:', err);
        alert('Ошибка скачивания. Попробуйте снова.');
    });
}
//запуск всей программы
function init() {
    initGrid();
    selectColor(selectedColorIndex);
    selectTool('pencil');
    toolButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            selectTool(this.dataset.tool);
        });
    });
    bgPickerEl.addEventListener('click', function() {
        selectColor(-1);
    });
    clearButton.addEventListener('click', clearGrid);
    exportBtn.addEventListener('click', exportGrid);
    downloadBtn.addEventListener('click', downloadFromGrid);
    closePreviewBtn.addEventListener('click', function() {
        exportPreview.classList.remove('visible');
    });
    downloadFromPreviewBtn.addEventListener('click', function() {
        const src = exportImg.src;
        if (src) {
            downloadImage(src, 'pixelart.png');
        }
    });
    window.addEventListener('beforeunload', saveGrid);
    console.log('Редактор запущен!');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
