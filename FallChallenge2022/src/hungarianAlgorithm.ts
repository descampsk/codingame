/* eslint-disable no-constant-condition */
/* eslint-disable no-param-reassign */

function findPath(
  costMatrix: number[][],
  i: number,
  visited: boolean[],
  assignments: number[]
): boolean {
  for (let j = 0; j < costMatrix[i].length; j++) {
    if (visited[j]) {
      continue;
    }
    visited[j] = true;
    if (
      assignments[j] === -1 ||
      findPath(costMatrix, assignments[j], visited, assignments)
    ) {
      assignments[j] = i;
      return true;
    }
  }
  return false;
}

export function hungarianAlgorithm(costs: number[][]): number[] {
  // Étape 1 : créer un tableau de coûts
  const costMatrix = costs.map((row) => row.slice());

  while (true) {
    // Étape 2 : chercher la valeur la plus petite dans chaque colonne et ligne et soustrayez-la
    for (let i = 0; i < costMatrix.length; i++) {
      let min = Number.POSITIVE_INFINITY;
      for (let j = 0; j < costMatrix[i].length; j++) {
        if (costMatrix[i][j] < min) {
          min = costMatrix[i][j];
        }
      }
      for (let j = 0; j < costMatrix[i].length; j++) {
        costMatrix[i][j] -= min;
      }
    }
    for (let j = 0; j < costMatrix[0].length; j++) {
      let min = Number.POSITIVE_INFINITY;
      for (let i = 0; i < costMatrix.length; i++) {
        if (costMatrix[i][j] < min) {
          min = costMatrix[i][j];
        }
      }
      for (let i = 0; i < costMatrix.length; i++) {
        costMatrix[i][j] -= min;
      }
    }

    console.log(costMatrix);

    // Étape 3 : tracez un chemin à travers le tableau de coûts en utilisant le plus grand nombre de zéros
    const assignments: number[] = Array(costMatrix.length).fill(-1);
    let finished = true;
    for (let i = 0; i < costMatrix.length; i++) {
      const visited: boolean[] = Array(costMatrix.length).fill(false);
      if (findPath(costMatrix, i, visited, assignments)) {
        continue;
      }
      finished = false;
      const min = Number.POSITIVE_INFINITY;
      const a = -1;
      const b = -1;
      for (let j = 0; j < costMatrix[a].length; j++) {
        if (!visited[j]) {
          costMatrix[a][j] -= min;
        }
      }
    }
    if (finished) {
      return assignments;
    }
  }
}
