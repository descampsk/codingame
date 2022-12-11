import { Arc, Circle, intersections, Line, Point } from "@mathigon/euclid";
import { BarrackBuilder } from "./BarrackBuilder";
import { computeSiteDistance } from "./helper";
import { GameState, Site } from "./State";
import { TowerBuilder } from "./TowerBuilder";

export class Defender {
  private state: GameState;

  private towerBuilder: TowerBuilder;

  private barrackBuilder: BarrackBuilder;

  constructor(
    state: GameState,
    towerBuilder: TowerBuilder,
    barrackBuilder: BarrackBuilder
  ) {
    this.state = state;
    this.towerBuilder = towerBuilder;
    this.barrackBuilder = barrackBuilder;
  }

  shouldDoAction(dangerRadius = 1000) {
    const { ennemyKnights, queen } = this.state;
    const nearestEnnemyKnight = ennemyKnights[0];
    return (
      nearestEnnemyKnight &&
      computeSiteDistance(nearestEnnemyKnight, queen) < dangerRadius
    );
  }

  blockKnight() {
    console.error("Blocking knight");
    const { ennemyKnights, myTowers, queen } = this.state;
    const knight = ennemyKnights[0];
    const myTower = myTowers[0];
    const line = new Line(knight.position, myTower.position);
    const circle = new Circle(myTower.position, myTower.radius + 30);
    const intersection = intersections(line, circle).sort(
      (a, b) =>
        Point.distance(b, knight.position) - Point.distance(a, knight.position)
    )[0];

    // Checking if the line Queen, destination go through the tower
    const segment = new Line(queen.position, intersection);
    const queenGoThroughTower =
      intersections(segment, new Circle(myTower.position, myTower.radius))
        .length > 0;

    if (!queenGoThroughTower) {
      console.error("Going directly to destination");
      console.log(
        `MOVE ${Math.round(intersection.x)} ${Math.round(intersection.y)}`
      );
    } else {
      const arc1 = new Arc(myTower.position, queen.position, Math.PI / 4);
      const arc2 = new Arc(
        myTower.position,
        queen.position,
        (-1 * Math.PI) / 4
      );
      const destination1 = arc1.end;
      const destination2 = arc2.end;
      const destination =
        Point.distance(destination1, knight.position) <
        Point.distance(destination2, knight.position)
          ? destination2
          : destination1;
      console.error("Turning around the tower");
      console.log(
        `MOVE ${Math.round(destination.x)} ${Math.round(destination.y)}`
      );
    }
  }

  action() {
    console.error("Defender action");
    const {
      myTowers,
      ennemyKnights,
      queen,
      ennemyKnightBarracks,
      myKnightBarracks,
    } = this.state;
    const nearestEnnemyKnight = ennemyKnights[0];
    if (ennemyKnightBarracks.length && !myKnightBarracks.length) {
      this.barrackBuilder.action();
    } else if (
      !nearestEnnemyKnight ||
      computeSiteDistance(nearestEnnemyKnight, queen) > 200 ||
      myTowers.length < 3
    ) {
      this.towerBuilder.action();
    } else {
      this.blockKnight();
    }
  }
}
