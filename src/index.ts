import { EditableCanvas } from "./Canvas";
import { validateCellDefs } from "./Cell";
import { registerInputHandlers } from "./Input";

/**
 * Initializes the app (immediately-invoked function expression)
 */
(function (): void {
  validateCellDefs();
  window.onload = () => {
    const canvas = new EditableCanvas();
    registerInputHandlers(canvas);
  };
})();
