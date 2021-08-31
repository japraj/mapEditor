import { EditableCanvas } from "./Canvas";
import { Cell, CellType, CELL_DEFNS } from "./Cell";

/* The user can press a key to select a particular CellType and then all
 * subsequent left-clicks will place cells of that type (until the selected
 * cell type is changed)
 *
 * Example: press w to select CellType.STONE, and then left click at (10, 10)
 * to fill the cell at (10, 10) with grey
 *
 * Keys are organized into rows:
 * - top row (numbers) is resources
 * - second row (qwerty) is environment
 * - third row (asdf) is enemies
 * - fourth row (zxcv) is special
 */
const KEY_INPUTS: {
  [key: string]: CellType;
} = {
  // resources
  1: CellType.RESOURCE,
  2: CellType.RES_HEAL,
  3: CellType.RES_HEX,
  4: CellType.RES_OCT,
  // environment
  q: CellType.DIRT,
  w: CellType.STONE,
  e: CellType.GRASS,
  r: CellType.ICE,
  t: CellType.FIRE,
  // enemies
  a: CellType.ENEMY_PENT,
  s: CellType.ENEMY_SEPT,
  d: CellType.ENEMY_FLY,
  // special
  z: CellType.SPAWN_POS,
  x: CellType.PLATFORM,
  c: CellType.CRUSHER,
  v: CellType.YEETER,
  b: CellType.LAVA,
};

/**
 * Simple abstraction on user input, pieced together by registering listeners
 * on several events
 */
export interface Input {
  /** Currently selected cell type; left-clicks place cells of this type */
  selectedCell: CellType;
  /** Is left-click currently held? */
  leftPressed: boolean;
  /** Is right-click currently held? */
  rightPressed: boolean;
  /** Offset of mouseX from left bound of viewport */
  clientX: number;
  /** Offset of mouseY from upper bound of viewport */
  clientY: number;
}

/** Reacts to the state of ec.input */
const processInput = (ec: EditableCanvas): void => {
  const is = ec.input; // input state
  let cell: undefined | Cell = undefined;

  if (is.leftPressed) {
    // main button (left click)
    // spawn pos is handled differently from other cells
    if (is.selectedCell === CellType.SPAWN_POS) {
      ec.setSpawnPos({
        x: Math.floor((is.clientX + window.scrollX) / ec.cellLen),
        y: Math.floor((is.clientY + window.scrollY) / ec.cellLen),
      });
    } else {
      cell = CELL_DEFNS[is.selectedCell];
    }
  } else if (is.rightPressed) {
    // secondary button (right click)
    cell = CELL_DEFNS[CellType.AIR];
  }

  if (cell) {
    ec.fillRegion(
      is.clientX + window.scrollX,
      is.clientY + window.scrollY,
      cell
    );
  }
};

/**
 * Registers mouse, keyboard input handlers which constantly update ec.input
 * to reflect the current state of the user's input, and starts input-listener
 * loop
 *
 * - left-click + optional drag: place a cell of the currently selected type on
 *   current mouse position
 * - right-click + optional drag: delete cell (i.e. place air) at current
 *   mouse position
 * - space key: save/download edited map
 * - other keys are automatically handled based on the constant KEY_INPUTS
 * - scroll up zooms in (increases cell len)
 * - scroll down zooms out (decreases cell len)
 */
export const registerInputHandlers = (ec: EditableCanvas): void => {
  const is = ec.input; // input state

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
    ec.updateCursorPos(ev.clientX, ev.clientY);
  };

  window.addEventListener("mousedown", (ev: MouseEvent) =>
    processMouseEvent(ev, true)
  );
  window.addEventListener("mouseup", (ev: MouseEvent) =>
    processMouseEvent(ev, false)
  );
  window.addEventListener("mousemove", (ev: MouseEvent) =>
    ec.updateCursorPos(ev.clientX, ev.clientY)
  );

  // zoom (change cell len, with some clamping)
  window.addEventListener("wheel", (ev: WheelEvent) => {
    let cellLen = ec.cellLen;
    if (ev.deltaY > 0) {
      cellLen--;
      if (cellLen < 4) cellLen = 4;
    } else {
      cellLen++;
      if (cellLen > 80) cellLen = 80;
    }
    ec.setCellLen(cellLen);
    ec.updateCursorPos();
  });

  // key handling
  window.addEventListener("keydown", (ev: KeyboardEvent) => {
    if (ev.key === " ") {
      ec.save();
    } else if (ev.key === "+" || ev.key === "=") {
      ec.setCursorRadius(ec.cursorRadius + 1);
    } else if (ev.key === "-" || ev.key === "_") {
      ec.setCursorRadius(ec.cursorRadius - 1);
    } else {
      for (let key in KEY_INPUTS) {
        if (ev.key === key || ev.key === key.toUpperCase()) {
          is.selectedCell = KEY_INPUTS[key];
          return; // terminate search
        }
      }
    }
    ec.updateCursorPos();
  });

  /**
   * Input-listener loop; constantly updates the canvas
   */
  const TPS = 60; // ticks per second
  const tickPeriod = 1000 / TPS; // time between update calls
  let prev: DOMHighResTimeStamp = window.performance.now(); // timestamp of prev processInput call
  const update = (now: DOMHighResTimeStamp) => {
    if (now - prev >= tickPeriod) {
      processInput(ec);
      prev = now;
    }
    window.requestAnimationFrame(update);
  };
  update(prev);
};
