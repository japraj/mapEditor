import rawTestJSON from "../def/test.json";
import rawJSON from "../def/map.json";
import { Cell, CELL_DEFNS } from "./Cell";

// should the test map be used, or the main map?
const TEST_MAP: boolean = true;

/**
 * Encapsulates canvas interaction, providing a simple api to edit a particular cell, and to arbitrarily
 * change the resolution of the canvas
 *
 * @class EditableCanvas
 * @property {HTMLCanvasElement} canvas
 * @property {CanvasRenderingContext2D} context
 * @property {number[][]} map map being edited
 * @property {number} cellLen length of cells on canvas (each map element represents a cell)
 * @property {any} input field used by input handlers to store data; ugly but simple
 */
export class EditableCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly map: number[][];
  cellLen: number;
  input: any;

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
    this.map = TEST_MAP ? rawTestJSON.map : rawJSON.map;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.redrawCanvas();
  }

  /**
   * Fills cell that (x, y) is a member of with cell.color; note that x, y are in px
   *
   * @method fillCell
   * @param {number} x
   * @param {number} y
   * @param {Cell} cell
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
    this.context.fillStyle = "#" + cell.color.toString(16);
    this.context.fillRect(x, y, this.cellLen, this.cellLen);
    if (redrawCanvas) this.redrawCanvas();
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
      new Blob([JSON.stringify({ map: this.map })], {
        type: "application/json",
      })
    );
    a.setAttribute("download", TEST_MAP ? "test.json" : "map.json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }
}
