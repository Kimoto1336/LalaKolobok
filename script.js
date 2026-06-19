//1. Настройка 

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
