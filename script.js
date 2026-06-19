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
