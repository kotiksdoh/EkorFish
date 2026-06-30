export const CATALOG_GRID_COLUMNS = 3;
export const CATALOG_GRID_GAP = 8;
export const CATALOG_GRID_HORIZONTAL_PADDING = 16;

export function getCatalogGridCardWidth(screenWidth: number): number {
  return (
    (screenWidth -
      CATALOG_GRID_HORIZONTAL_PADDING * 2 -
      CATALOG_GRID_GAP * (CATALOG_GRID_COLUMNS - 1)) /
    CATALOG_GRID_COLUMNS
  );
}
