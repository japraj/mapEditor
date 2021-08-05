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
};

interface Input {
  selectedCell: CellType;
  leftPressed: boolean;
  rightPressed: boolean;
}

/**
 * Registers mouse, keyboard input handlers:
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
  editableCanvas.input = {
    selectedCell: CellType.GRASS,
    leftPressed: false,
    rightPressed: false,
  } as Input;

  // mouse stuff
  const processMouseEvent = (ev: MouseEvent, newValue: boolean): void => {
    switch (ev.button) {
      case 0: //** main button
        editableCanvas.input.leftPressed = newValue;
        break;
      case 2: //** secondary button
        editableCanvas.input.rightPressed = newValue;
        break;
    }
    mouseHandler(ev);
  };

  const mouseHandler = (ev: MouseEvent) => {
    var cell: undefined | Cell = undefined;

    if (editableCanvas.input.leftPressed) {
      // main button (left click)
      cell = CELL_DEFNS[editableCanvas.input.selectedCell];
    } else if (editableCanvas.input.rightPressed) {
      // secondary button (right click)
      cell = CELL_DEFNS[CellType.AIR];
    }

    if (cell) {
      editableCanvas.fillCell(ev.pageX, ev.pageY, cell);
    }
  };
  window.addEventListener("mousedown", (ev: MouseEvent) =>
    processMouseEvent(ev, true)
  );
  window.addEventListener("mouseup", (ev: MouseEvent) =>
    processMouseEvent(ev, false)
  );
  window.addEventListener("mousemove", mouseHandler);

  // zoom (change cell len, with some clamping)
  window.addEventListener("wheel", (ev: WheelEvent) => {
    var cellLen = editableCanvas.cellLen;
    if (ev.deltaY > 0) {
      cellLen--;
      if (cellLen < 4) cellLen = 4;
    } else {
      cellLen++;
    }
    editableCanvas.setCellLen(cellLen);
  });

  // key handling
  window.addEventListener("keydown", (ev: KeyboardEvent) => {
    if (ev.key === " ") {
      editableCanvas.save();
    } else {
      for (var key in KEY_INPUTS) {
        if (ev.key === key || ev.key === key.toUpperCase()) {
          console.log(
            (editableCanvas.input.selectedCell = KEY_INPUTS[key]).toString()
          );
          return; // terminate search
        }
      }
    }
  });
};
