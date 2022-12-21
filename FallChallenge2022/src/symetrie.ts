import { Block } from "./Block";
import { debug } from "./helpers";

export function findSymmetryAxis(
  grid: Block[][],
  symmetryType: "vertical" | "horizontal" | "diagonal" | "central"
): number[][] {
  const n = grid.length;
  const m = grid[0].length;
  const axisPositions: number[][] = [];

  // Parcourir chaque ligne de la grille
  for (let i = 0; i < n; i++) {
    // Pour chaque ligne, parcourir chaque colonne
    for (let j = 0; j < m; j++) {
      let symmetricRow = 0;
      let symmetricColumn = 0;

      // Déterminer les indices de la case symétrique en fonction du type d'axe de symétrie
      if (symmetryType === "vertical") {
        symmetricRow = i;
        symmetricColumn = m - j - 1;
      } else if (symmetryType === "horizontal") {
        symmetricRow = n - i - 1;
        symmetricColumn = j;
      } else if (symmetryType === "diagonal") {
        // Si la grille est carrée, on utilise les indices habituels
        if (n === m) {
          symmetricRow = j;
          symmetricColumn = i;
        }
        // Si la grille est rectangulaire, on calcule les indices de la case symétrique en fonction de la longueur de la grille
        else {
          symmetricRow = i + j - Math.min(i, j);
          symmetricColumn = j + i - Math.min(i, j);
        }
      } else if (symmetryType === "central") {
        symmetricRow = n - i - 1;
        symmetricColumn = m - j - 1;
      }

      debug(i, j, symmetricRow, symmetricColumn);
      // Si la case (i, j) est égale à sa case symétrique (symmetricRow, symmetricColumn)
      if (grid[i][j].equals(grid[symmetricRow][symmetricColumn])) {
        // Ajouter la position (i, j) à la liste des positions sur l'axe de symétrie
        axisPositions.push([i, j]);
      }
    }
  }

  return axisPositions;
}

export function findSeparatorCells(grid: Block[][]): number[][] {
  const n = grid.length;
  const m = grid[0].length;
  const separatorCells: number[][] = [];

  // Parcourir chaque ligne de la grille
  for (let i = 0; i < n; i++) {
    // Pour chaque ligne, parcourir chaque colonne
    for (let j = 0; j < m; j++) {
      let count1 = 0;
      let count2 = 0;

      // Compter le nombre de cases non bloquées à gauche et à droite de la case (i, j)
      for (let k = 0; k < j; k++) {
        if (grid[i][k] !== "#") {
          count1++;
        }
      }
      for (let k = j + 1; k < m; k++) {
        if (grid[i][k] !== "#") {
          count2++;
        }
      }

      // Si le nombre de cases non bloquées à gauche et à droite de la case (i, j) est égal
      if (count1 === count2) {
        // Ajouter la case (i, j) à la liste des cases qui séparent la grille en deux parties de même taille
        separatorCells.push([i, j]);
      }
    }
  }

  return separatorCells;
}
