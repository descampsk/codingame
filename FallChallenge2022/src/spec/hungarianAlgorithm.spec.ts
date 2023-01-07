// @ts-expect-error NO types
import munkres from "munkres-js";
import { hungarianAlgorithm } from "../hungarianAlgorithm";

describe("hungarianAlgorithm", () => {
  it("should return the right value", () => {
    // Utilisation de l'algorithme hongrois
    const costs = [
      [4, 1, 3],
      [2, 0, 5],
      [3, 2, 2],
      [1, 1, 1],
      [6, 1, 0],
      [5, 2, 2],
    ];
    // const assignments = hungarianAlgorithm(costs);
    const result = munkres(costs);
    console.log(result);
    // console.log(assignments);
    // expect(assignments).toEqual([1, 0, 2]);
  });

  // it("should return the right value 2 ", () => {
  //   // Utilisation de l'algorithme hongrois
  //   const costs = [
  //     [400, 150, 400],
  //     [400, 450, 600],
  //     [300, 225, 300],
  //   ];
  //   const assignments = hungarianAlgorithm(costs);
  //   const result = munkres(costs);
  //   console.log(result);
  //   console.log(assignments);
  //   expect(assignments).toEqual([1, 0, 2]);
  // });
});
