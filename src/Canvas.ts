import rawJSON from "../def/map.json";
import rawTestJSON from "../def/test.json";
import { Cell, CellType, CELL_DEFNS } from "./Cell";
import { Input } from "./Input";

// should the test map be used, or the main map? (if this is true, will load from 'test.json' instead of 'map.json')
const TEST_MAP: boolean = false;
// color of spawn position cell
const SPAWN_POS_COLOR: number = 0x00ffff;

export interface Vector {
  x: number;
  y: number;
}

/**
 * Encapsulates canvas interaction, providing a simple api to edit a particular cell, and to arbitrarily
 * change the resolution of the canvas
 *
 * @class EditableCanvas
 * @property {HTMLCanvasElement} canvas
 * @property {CanvasRenderingContext2D} context
 * @property {number[][]} map map being edited
 * @property {Vector}
 * @property {number} cellLen length of cells on canvas (each map element represents a cell)
 * @property {number} cursorRadius determines radius of cursor/interactions
 * @property {any} input field used by input handlers to store data; ugly but simple
 */
export class EditableCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly map: number[][];
  spawnPos: Vector;
  cellLen: number;
  cursorRadius: number;
  input: Input;

  /**
   * Initializes fields, draws initial canvas based on out/map.json
   *
   * @constructor
   * @param {number} cellLen initial cell length
   */
  constructor(cellLen: number) {
    this.canvas = document.getElementById("editor") as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d")!;
    this.cellLen = cellLen;
    const JSON = TEST_MAP ? rawTestJSON : rawJSON;
    this.map = JSON.data;
    this.spawnPos = JSON.spawnPosition;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.cursorRadius = 1;
    this.input = {
      selectedCell: CellType.GRASS,
      leftPressed: false,
      rightPressed: false,
      clientX: 0,
      clientY: 0,
    };
    this.redrawCanvas();
  }

  /**
   * Fills cell that (x, y) is a member of with cell.color
   *
   * @method fillCell
   * @param {number} x coord in px
   * @param {number} y coord in px
   * @param {Cell} cell type to fill cell with
   * @returns {void}
   */
  fillCell(x: number, y: number, cell: Cell): void {
    // floor x, y to be the top left of some cell
    x -= x % this.cellLen;
    y -= y % this.cellLen;
    var redrawCanvas: boolean = false;
    var row: undefined | number[] = this.map[y / this.cellLen];

    if (!row) {
      row = this.map[y / this.cellLen] = [];
      redrawCanvas = true;
    }
    if (x / this.cellLen >= row.length) {
      redrawCanvas = true;
    }
    row[x / this.cellLen] = cell.type;
    this.context.fillStyle = "#" + cell.color.toString(16).padStart(6, "0");
    this.context.fillRect(x, y, this.cellLen, this.cellLen);
    if (redrawCanvas) this.redrawCanvas();
  }

  /**
   * Fills all cells in square of radius `this.cellLen * this.cursorRadius` centered at cell corresponding to (x, y) with specified Cell type
   *
   * @method fillRegion
   * @param {number} x coord in px
   * @param {number} y coord in px
   * @param {number} cell type to fill region with
   * @returns {void}
   */
  fillRegion(x: number, y: number, cell: Cell): void {
    x -= x % this.cellLen;
    y -= y % this.cellLen;
    var pxRadius = this.cursorRadius * this.cellLen;
    for (
      var pY: number = y - pxRadius;
      pY <= y + pxRadius;
      pY += this.cellLen
    ) {
      for (
        var pX: number = x - pxRadius;
        pX <= x + pxRadius;
        pX += this.cellLen
      ) {
        try {
          this.fillCell(pX, pY, cell);
        } catch {}
      }
    }
    this.colorCellMapIdx(this.spawnPos.x, this.spawnPos.y, SPAWN_POS_COLOR);
  }

  /**
   * Paints cell at (x, y) (not units of px, but rather map coordinates/indices) with specified color (hex);
   * does not update this.map
   *
   * @method colorCellMapIdx
   * @param {number} x coord in valid map idx
   * @param {number} y coord in valid map idx
   * @param {number} color in hex
   * @returns {void}
   */
  colorCellMapIdx(x: number, y: number, color: number): void {
    this.context.fillStyle = "#" + color.toString(16).padStart(6, "0");
    this.context.fillRect(
      x * this.cellLen,
      y * this.cellLen,
      this.cellLen,
      this.cellLen
    );
  }

  /**
   * Repaints a region of cells around x, y (px)
   *
   * @method repaintRegion
   * @param {number} x
   * @param {number} y
   * @returns {void}
   */
  repaintRegion(x: number, y: number): void {
    var radius = this.cursorRadius + 10; // +10 is to ensure that the repainting keeps up with any fast movements
    x = Math.floor(x / this.cellLen);
    y = Math.floor(y / this.cellLen);
    for (var pY: number = y - radius; pY <= y + radius; pY++) {
      for (var pX: number = x - radius; pX <= x + radius; pX++) {
        try {
          // try-catch lets us ignore out of range errors without breaking anything!
          this.context.fillStyle =
            "#" +
            CELL_DEFNS[this.map[pY][pX]].color.toString(16).padStart(6, "0");
          this.context.fillRect(
            pX * this.cellLen,
            pY * this.cellLen,
            this.cellLen,
            this.cellLen
          );
        } catch {}
      }
    }
    this.colorCellMapIdx(this.spawnPos.x, this.spawnPos.y, SPAWN_POS_COLOR);
  }

  /**
   * Outlines the cell being hovered over by the user's cursor
   *
   * @method drawCursor
   * @returns {void}
   */
  drawCursor(): void {
    var x = this.input.clientX + window.scrollX,
      y = this.input.clientY + window.scrollY;
    x -= x % this.cellLen;
    y -= y % this.cellLen;
    this.context.strokeStyle = "black";
    this.context.strokeRect(
      x - this.cursorRadius * this.cellLen,
      y - this.cursorRadius * this.cellLen,
      this.cellLen * (2 * this.cursorRadius + 1),
      this.cellLen * (2 * this.cursorRadius + 1)
    );
  }

  /**
   * Updates input state mouse position; newX, newY are optional; if either one is not specified, simply
   * redraws cursor and makes no changes to this.input
   *
   * @method updateCursor
   * @param {undefined | number} newX
   * @param {unedfined | number} newY
   * @returns {void}
   */
  updateCursor(newX?: number, newY?: number): void {
    this.repaintRegion(
      this.input.clientX + window.scrollX,
      this.input.clientY + window.scrollY
    );
    if (newX && newY) {
      this.input.clientX = newX;
      this.input.clientY = newY;
    }
    this.drawCursor();
  }

  /**
   * Updates this.spawnPos to newSpawnPos and updates canvas to reflect the change and
   * sets cell in this.map corresponding to newSpawnPos to CellType.AIR
   *
   * @method setSpawnPos
   * @param {Vector} newSpawnPos
   * @returns {void}
   */
  setSpawnPos(newSpawnPos: Vector): void {
    // guard clause to protect against invalid values
    if (
      newSpawnPos.x < 0 ||
      newSpawnPos.y < 0 ||
      newSpawnPos.x >= this.map[0].length ||
      newSpawnPos.y >= this.map.length
    )
      return;
    this.colorCellMapIdx(
      this.spawnPos.x,
      this.spawnPos.y,
      CELL_DEFNS[CellType.AIR].color
    );
    this.spawnPos = newSpawnPos;
    this.map[this.spawnPos.y][this.spawnPos.x] = CellType.AIR;
    this.colorCellMapIdx(this.spawnPos.x, this.spawnPos.y, SPAWN_POS_COLOR);
  }

  /**
   * Sets new value of cellLen and redraws the canvas
   *
   * @method setCellLen
   * @param {cellLen} cellLen
   * @returns {void}
   */
  setCellLen(cellLen: number): void {
    this.cellLen = cellLen;
    this.redrawCanvas();
  }

  setCursorRadius(cursorRadius: number): void {
    this.repaintRegion(
      this.input.clientX + window.scrollX,
      this.input.clientY + window.scrollY
    );
    this.cursorRadius = cursorRadius;
    this.drawCursor();
  }

  /**
   * Replaces any 'undefined' values with 0 and pads all rows to have same length
   *
   * @method formatMap
   * @returns {void}
   */
  formatMap(): void {
    const maxRowLen = this.map.reduce(
      (acc: number, row: number[]) => (row.length > acc ? row.length : acc),
      0
    );
    for (var rowIdx: number = 0; rowIdx < this.map.length; rowIdx++) {
      var row: undefined | number[] = this.map[rowIdx];
      if (row === undefined) row = this.map[rowIdx] = [];
      for (var col: number = 0; col < row.length; col++)
        // we sometimes have stray undefined values floating around due to random array access
        if (row[col] === undefined) row[col] = 0;
      // pad row so we have a perfect rectangular array
      while (row.length < maxRowLen) row.push(0);
    }
  }

  /**
   * Redraws canvas
   *
   * @method redrawCanvas
   * @returns {void}
   */
  redrawCanvas(): void {
    this.formatMap();
    this.canvas.width = this.map[0].length * this.cellLen;
    this.canvas.height = this.map.length * this.cellLen;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.map.forEach((row: number[], rowIdx: number) =>
      row.forEach((cell: number, col: number) =>
        this.fillCell(
          col * this.cellLen,
          rowIdx * this.cellLen,
          CELL_DEFNS[cell]
        )
      )
    );
    this.colorCellMapIdx(this.spawnPos.x, this.spawnPos.y, SPAWN_POS_COLOR);
    this.drawCursor();
  }

  /**
   * Downloads this.map as a json file
   *
   * @method save
   * @returns {void}
   */
  save(): void {
    this.formatMap();
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(
        [JSON.stringify({ data: this.map, spawnPosition: this.spawnPos })],
        {
          type: "application/json",
        }
      )
    );
    a.setAttribute("download", TEST_MAP ? "test.json" : "map.json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }
}
