import rawJSON from "../def/map.json";
import rawCelldata from "../def/mapCelldata.json";
import rawTestJSON from "../def/test.json";
import rawTestCelldata from "../def/testCelldata.json";
import { Cell, CellType, CELL_DEFNS } from "./Cell";
import { Input } from "./Input";

// should the test map be used, or the main map? (if this is true, will load
// from 'test.json' instead of 'map.json')
const TEST_MAP: boolean = false;
// color of spawn position cell
const SPAWN_POS_COLOR: number = 0x00ffff;
const initialCellLen = 10;

export interface Vector {
  x: number;
  y: number;
}

/**
 * The Celldata system allows us to associate arbitrary data with a particular
 * cell. For example, if we want to use sign cells to display some kind of
 * mesage at a particular location in the world, we would store the sign cell
 * as usual in the map file, but the message itself is considered Celldata,
 * and we would store that in the appropriate Celldata json file. Celldata is
 * stored in a separate file because by nature, it does not follow any
 * pattern and therefore cannot be compressed the way map files can be.
 *
 * All Celldata satisifes this interface at the bare minimum. Note that the
 * purpose of Celldata is to associate some arbitrary object with a particular
 * cell, so Celldata objects should always have at least one additional
 * property (otherwise it is pointless).
 */
interface Celldata {
  cell: Vector;
}

/** Converts color to a valid CSS color; example: 0x00ff00 -> '#00ff00' */
const toColorString = (color: number): string =>
  "#" + color.toString(16).padStart(6, "0");

/** Generates a unique string representing the given ordered pair */
const hash = (x: number, y: number): string => x + "_" + y;

/**
 * Encapsulates canvas interaction, providing a simple api to edit a
 * particular cell, and to arbitrarily change the resolution of the canvas.
 *
 * Note: methods with the word 'fill' in their name update both this.map
 * and color the canvas, while methods with 'paint' in their name only
 * change the canvas color.
 */
export class EditableCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly map: number[][];
  /** Current position of the player spawn cell */
  spawnPos: Vector;
  /** Length of canvas cells in px */
  cellLen: number;
  /** Radius of cursor interactions */
  cursorRadius: number;
  input: Input;
  celldata: Map<string, object>;

  /** Initializes fields, draws initial canvas based on out/map.json */
  constructor() {
    this.canvas = document.getElementById("editor") as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d")!;
    this.cellLen = initialCellLen;
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
    this.celldata = new Map();
    const celldataSrc: Celldata[] = (TEST_MAP ? rawTestCelldata : rawCelldata)
      .data;
    for (let i: number = 0; i < celldataSrc.length; i++) {
      const obj: Celldata = celldataSrc[i];
      this.celldata.set(hash(obj.cell.x, obj.cell.y), obj);
    }
    this.repaintCanvas();
  }

  /** Deletes celldata associated with cell (x, y) (units of cells) */
  deleteCelldata(x: number, y: number): void {
    this.celldata.delete(hash(x, y));
  }

  /**
   * Adds a generic celldata object associated with cell (x, y) (units of
   * cells) of the form '{cell: {x: x, y: y}}'
   */
  assignCelldata(x: number, y: number): void {
    this.celldata.set(hash(x, y), {
      cell: {
        x: x,
        y: y,
      },
    });
  }

  /**
   * Fills cell corresponding to (x, y) with cell.color and paints canvas
   *
   * @param x x coord in px
   * @param y y coord in px
   * @param cell type to fill cell with
   */
  fillCell(x: number, y: number, cell: Cell): void {
    // floor x, y to be the top left of some cell
    x -= x % this.cellLen;
    y -= y % this.cellLen;
    let redrawCanvas: boolean = false;
    let row: undefined | number[] = this.map[y / this.cellLen];

    if (!row) {
      row = this.map[y / this.cellLen] = [];
      redrawCanvas = true;
    }
    if (x / this.cellLen >= row.length) {
      redrawCanvas = true;
    }
    // if the old cell had celldata associated with it, delete it
    if (CELL_DEFNS[row[x / this.cellLen]].celldata) {
      this.deleteCelldata(x / this.cellLen, y / this.cellLen);
    }
    row[x / this.cellLen] = cell.type;
    // if the new cell type requires celldata, assign a new obj. Note that it
    // may be the case that the old one has celldata and the new one does notO,
    // so we cannot omit the delete callO
    if (cell.celldata) {
      this.assignCelldata(x / this.cellLen, y / this.cellLen);
    }

    this.context.fillStyle = toColorString(cell.color);
    this.context.fillRect(x, y, this.cellLen, this.cellLen);
    if (redrawCanvas) this.repaintCanvas();
  }

  /**
   * Fills all cells in square of radius `this.cellLen * this.cursorRadius`
   * centered at cell corresponding to (x, y) with specified Cell type
   *
   * @param x x coord in px
   * @param y y coord in px
   * @param cell type to fill region with
   */
  fillRegion(x: number, y: number, cell: Cell): void {
    x -= x % this.cellLen;
    y -= y % this.cellLen;
    let pxRadius = this.cursorRadius * this.cellLen;
    for (
      let pY: number = y - pxRadius;
      pY <= y + pxRadius;
      pY += this.cellLen
    ) {
      for (
        let pX: number = x - pxRadius;
        pX <= x + pxRadius;
        pX += this.cellLen
      ) {
        try {
          this.fillCell(pX, pY, cell);
        } catch {}
      }
    }
    this.paintSpawnPos();
  }

  /**
   * Paints cell at (x, y) (px) with specified color (hex); does not update
   * this.map
   */
  paintCell(x: number, y: number, color: number): void {
    x -= x % this.cellLen;
    y -= y % this.cellLen;
    this.context.fillStyle = toColorString(color);
    this.context.fillRect(x, y, this.cellLen, this.cellLen);
  }

  /** Paints spawn position */
  paintSpawnPos(): void {
    this.context.fillStyle = toColorString(SPAWN_POS_COLOR);
    this.context.fillRect(
      this.spawnPos.x * this.cellLen,
      this.spawnPos.y * this.cellLen,
      this.cellLen,
      this.cellLen
    );
  }

  /**
   * Repaints a region of cells around x, y (px) with radius proportional to
   * this.cursorRadius
   */
  repaintRegion(x: number, y: number): void {
    // + 10 is to ensure that the repainting keeps up with any fast movements
    let radius = this.cursorRadius + 10;
    x = Math.floor(x / this.cellLen);
    y = Math.floor(y / this.cellLen);
    for (let pY: number = y - radius; pY <= y + radius; pY++) {
      for (let pX: number = x - radius; pX <= x + radius; pX++) {
        try {
          // try-catch lets us ignore out of range errors!
          this.context.fillStyle = toColorString(
            CELL_DEFNS[this.map[pY][pX]].color
          );
          this.context.fillRect(
            pX * this.cellLen,
            pY * this.cellLen,
            this.cellLen,
            this.cellLen
          );
        } catch {}
      }
    }
    this.paintSpawnPos();
  }

  /** Repaints the canvas */
  repaintCanvas(): void {
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
    this.paintSpawnPos();
    this.paintCursor();
  }

  /** Outlines the cell being hovered over by the user's cursor */
  paintCursor(): void {
    let x = this.input.clientX + window.scrollX,
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
   * Updates input state mouse position; newX, newY are optional; if either one
   * is not specified, simply redraws cursor and makes no changes to this.input
   */
  updateCursorPos(newX?: number, newY?: number): void {
    this.repaintRegion(
      this.input.clientX + window.scrollX,
      this.input.clientY + window.scrollY
    );
    if (newX && newY) {
      this.input.clientX = newX;
      this.input.clientY = newY;
    }
    this.paintCursor();
  }

  /**
   * Updates this.spawnPos to newSpawnPos and updates canvas to reflect the
   * change and sets cell in this.map corresponding to newSpawnPos to
   * CellType.AIR
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
    this.paintCell(
      this.spawnPos.x,
      this.spawnPos.y,
      CELL_DEFNS[CellType.AIR].color
    );
    this.spawnPos = newSpawnPos;
    this.map[this.spawnPos.y][this.spawnPos.x] = CellType.AIR;
    this.paintSpawnPos();
  }

  /** Sets new value of cellLen and redraws the canvas */
  setCellLen(cellLen: number): void {
    this.cellLen = cellLen;
    this.repaintCanvas();
  }

  /**
   * Sets new value for cursor radius if it is non-negative and not too large,
   * and redraws cursor
   */
  setCursorRadius(cursorRadius: number): void {
    if (cursorRadius < 0 || cursorRadius > 20) return;
    this.cursorRadius = cursorRadius;
    this.updateCursorPos();
  }

  /**
   * Replaces all instances of 'undefined' with 0, pads all rows to have same
   * length, and ensures that the spawn position is an air cell
   */
  formatMap(): void {
    const maxRowLen = this.map.reduce(
      (acc: number, row: number[]) => (row.length > acc ? row.length : acc),
      0
    );
    for (let rowIdx: number = 0; rowIdx < this.map.length; rowIdx++) {
      let row: undefined | number[] = this.map[rowIdx];
      if (row === undefined) row = this.map[rowIdx] = [];
      for (let col: number = 0; col < row.length; col++)
        // we sometimes have stray undefined values floating around due to random array access
        if (row[col] === undefined) row[col] = 0;
      // pad row so we have a perfect rectangular array
      while (row.length < maxRowLen) row.push(0);
    }
    this.map[this.spawnPos.y][this.spawnPos.x] = CellType.AIR;
  }

  /** Downloads  */
  download(contents: object, fileName: string): void {
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(contents)], {
        type: "application/json",
      })
    );
    a.setAttribute("download", fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /** Downloads map and celldata as json files */
  save(): void {
    this.formatMap();
    this.download(
      { data: this.map, spawnPosition: this.spawnPos },
      TEST_MAP ? "test.json" : "map.json"
    );
    const celldata: Celldata[] = [];
    const vals = this.celldata.values();
    let val: IteratorResult<object, any>;
    while (!(val = vals.next()).done) {
      celldata.push(val.value as Celldata);
    }
    celldata.sort((a: Celldata, b: Celldata) =>
      a.cell.y !== b.cell.y ? a.cell.y - b.cell.y : a.cell.x - b.cell.x
    );
    this.download(
      { data: celldata },
      TEST_MAP ? "testCelldata.json" : "mapCelldata.json"
    );
  }
}
