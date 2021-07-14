export enum CellType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  RESOURCE = 3,
  ICE = 4,
  FIRE = 5,
  STONE = 6,
}

/**
 * @typedef Cell a cell on the map
 *
 * @property {CellType} type type of cell; the numeric value is what is used in JSON representation of the map
 * @property {number} color hex color used for cells of this type
 */
export interface Cell {
  type: CellType;
  color: number;
}

// ! The order of the CELL_DEFNS must be the same as the order in which they are declared in the enum;
// ! this allows us to use the notation CELL_DEFINS[CellType.DIRT].color. The function validateCellDefs
// ! is run at init to ensure this is the case (still a runtime check though)
export const CELL_DEFNS: Cell[] = [
  {
    type: CellType.AIR,
    color: 0xa0ced9,
  },
  {
    type: CellType.GRASS,

    color: 0xadf7b6,
  },
  {
    type: CellType.DIRT,
    color: 0x581f18,
  },
  {
    type: CellType.RESOURCE,
    color: 0x800080,
  },
  {
    type: CellType.ICE,
    color: 0xdbf7ff,
  },
  {
    type: CellType.FIRE,
    color: 0xff7d00,
  },
  {
    type: CellType.STONE,
    color: 0x9b9ea1,
  },
];

/**
 * Check that CELL_DEFNS has same order as the CellType enum
 *
 * @throws {Error} if there is an inconsistency
 * @returns {void}
 */
export const validateCellDefs = (): void => {
  CELL_DEFNS.forEach((value: Cell, index: number) => {
    if (value.type != index)
      throw Error("CELL_DEFNS is inconsistent with CellType enum");
  });
};
