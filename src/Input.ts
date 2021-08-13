import { EditableCanvas } from "./Canvas";
import { Cell, CellType, CELL_DEFNS } from "./Cell";

/* User can press a key to select a particular CellType and then all subsequent left-clicks will place
 * cells of that type (until selected cell type is changed)
 *
 * Example: press w to select CellType.GRASS, and then left click at (10, 10) fills cell (10, 10) brown
 *
 * Keys are organized into rows:
 * - top row (numbers) is resources
 * - second row (qwerty) is environment
 * - third row (asdf) is enemies
 * - fourth row (zxcv) is special/miscellaneous
 */
const KEY_INPUTS: {
  [key: string]: CellType;
} = {
  q: CellType.DIRT,
  w: CellType.STONE,
  e: CellType.GRASS,
  r: CellType.ICE,
  t: CellType.FIRE,

  1: CellType.RESOURCE,
  2: CellType.RES_HEAL,
  3: CellType.RES_HEX,
  4: CellType.RES_OCT,

  a: CellType.ENEMY_PENT,
  s: CellType.ENEMY_SEPT,
  d: CellType.ENEMY_FLY,

  z: CellType.SPAWN_POS,
};

/**
 * @typedef Input simple interface for user input, pieced together by registering listeners on several
 * events.
 *
 * @property {CellType} selectedCell currently selected cell type (left click places cells of selected type)
 * @property {boolean} leftPressed is left-click currently held?
 * @property {boolean} rightPressed is right-click currently held?
 * @property {number} clientX offset of mouseX from left of viewport
 * @property {number} clientY offset of mouseY from top of viewport
 *
 */
export interface Input {
  selectedCell: CellType;
  leftPressed: boolean;
  rightPressed: boolean;
  clientX: number;
  clientY: number;
}

/**
 * Reacts to state of editableCanvas.input
 *
 * @param {EditableCanvas} editableCanvas
 * @returns {void}
 */
const processInput = (editableCanvas: EditableCanvas): void => {
  const is = editableCanvas.input; // input state
  var cell: undefined | Cell = undefined;

  if (is.leftPressed) {
    // main button (left click)
    // spawn pos is handled differently from other cells
    if (is.selectedCell === CellType.SPAWN_POS) {
      editableCanvas.setSpawnPos({
        x: Math.floor((is.clientX + window.scrollX) / editableCanvas.cellLen),
        y: Math.floor((is.clientY + window.scrollY) / editableCanvas.cellLen),
      });
    } else {
      cell = CELL_DEFNS[is.selectedCell];
    }
  } else if (is.rightPressed) {
    // secondary button (right click)
    cell = CELL_DEFNS[CellType.AIR];
  }

  if (cell) {
    editableCanvas.fillRegion(
      is.clientX + window.scrollX,
      is.clientY + window.scrollY,
      cell
    );
  }
};

/**
 * Registers mouse, keyboard input handlers which constantly update editableCanvas.input to reflect
 * the current state of the user's input, and starts input listener loop
 * - left-click + optional drag: place a cell of the currently selected type on current mouse position
 * - right-click + optional drag: delete cell (i.e. place air) at current mouse position
 * - space key: save/download edited map
 * - other keys are automatically handled based on the constant KEY_INPUTS
 * - scroll up zooms in (increases cell len)
 * - scroll down zooms out (decreases cell len)
 *
 * @param {EditableCanvas} editableCanvas
 * @returns {void}
 */
export const registerInputHandlers = (editableCanvas: EditableCanvas): void => {
  const is = editableCanvas.input; // input state

  // mouse stuff
  const processMouseEvent = (ev: MouseEvent, newValue: boolean): void => {
    switch (ev.button) {
      case 0: //** main button
        is.leftPressed = newValue;
        break;
      case 2: //** secondary button
        is.rightPressed = newValue;
        break;
    }
    editableCanvas.updateCursor(ev.clientX, ev.clientY);
  };

  window.addEventListener("mousedown", (ev: MouseEvent) =>
    processMouseEvent(ev, true)
  );
  window.addEventListener("mouseup", (ev: MouseEvent) =>
    processMouseEvent(ev, false)
  );
  window.addEventListener("mousemove", (ev: MouseEvent) =>
    editableCanvas.updateCursor(ev.clientX, ev.clientY)
  );

  // zoom (change cell len, with some clamping)
  window.addEventListener("wheel", (ev: WheelEvent) => {
    var cellLen = editableCanvas.cellLen;
    if (ev.deltaY > 0) {
      cellLen--;
      if (cellLen < 4) cellLen = 4;
    } else {
      cellLen++;
      if (cellLen > 80) cellLen = 80;
    }
    editableCanvas.setCellLen(cellLen);
    editableCanvas.updateCursor();
  });

  // key handling
  window.addEventListener("keydown", (ev: KeyboardEvent) => {
    if (ev.key === " ") {
      editableCanvas.save();
    } else if (ev.key === "+" || ev.key === "=") {
      editableCanvas.setCursorRadius(editableCanvas.cursorRadius + 1);
    } else if (ev.key === "-" || ev.key === "_") {
      editableCanvas.setCursorRadius(editableCanvas.cursorRadius - 1);
    } else {
      for (var key in KEY_INPUTS) {
        if (ev.key === key || ev.key === key.toUpperCase()) {
          is.selectedCell = KEY_INPUTS[key];
          return; // terminate search
        }
      }
    }
    editableCanvas.updateCursor();
  });

  /**
   * Input listener loop; constantly updates the canvas
   */
  const TPS = 60; // ticks per second
  const tickPeriod = 1000 / TPS; // time between update calls
  var prev: DOMHighResTimeStamp = window.performance.now(); // timestamp of prev processInput call
  const update = (now: DOMHighResTimeStamp) => {
    if (now - prev >= tickPeriod) {
      processInput(editableCanvas);
      prev = now;
    }
    window.requestAnimationFrame(update);
  };
  update(prev);
};
