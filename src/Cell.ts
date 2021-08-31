export enum CellType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  RESOURCE = 3,
  ICE = 4,
  FIRE = 5,
  STONE = 6,
  RES_HEAL = 7,
  RES_HEX = 8,
  RES_OCT = 9,
  ENEMY_PENT = 10,
  ENEMY_SEPT = 11,
  ENEMY_FLY = 12,
  PLATFORM = 13,
  CRUSHER = 14,
  YEETER = 15,
  LAVA = 16,
  SPAWN_POS = 999, // does not get written to map data; the Canvas handles this specially!
}

/** A cell on the map/canvas */
export interface Cell {
  /**
   * Type of the cell; the numeric value is what is used in JSON representation
   * of the map
   */
  type: CellType;
  /** Color in hex that is used for cells of this type on the canvas */
  color: number;
}

// ! The order of the CELL_DEFNS must be the same as the order in which they
// ! are declared in the enum; this allows us to use the notation
// ! CELL_DEFINS[CellType.DIRT].color. The function validateCellDefs is run at
// ! init to ensure this is the case (still a runtime check though)
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
    color: 0xfcf5c7,
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
  {
    type: CellType.RES_HEAL,
    color: 0xddff9e,
  },
  {
    type: CellType.RES_HEX,
    color: 0x6ea4f4,
  },
  {
    type: CellType.RES_OCT,
    color: 0xe004b4,
  },
  {
    type: CellType.ENEMY_PENT,
    color: 0xff9eac,
  },
  {
    type: CellType.ENEMY_SEPT,
    color: 0xff6b6b,
  },
  {
    type: CellType.ENEMY_FLY,
    color: 0x800080,
  },
  {
    type: CellType.PLATFORM,
    color: 0x000000,
  },
  {
    type: CellType.CRUSHER,
    color: 0xff0000,
  },
  {
    type: CellType.YEETER,
    color: 0x13344c,
  },
  {
    type: CellType.LAVA,
    color: 0xbf5c00,
  },
];

/**
 * Check that CELL_DEFNS has same order as the CellType enum (basic runtime check)
 *
 * @throws {Error} if there is an inconsistency
 */
export const validateCellDefs = (): void => {
  CELL_DEFNS.forEach((value: Cell, index: number) => {
    if (value.type != index)
      throw Error("CELL_DEFNS is inconsistent with CellType enum");
  });
};
