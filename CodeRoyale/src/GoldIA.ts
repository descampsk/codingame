import { BarrackBuilder } from "./BarrackBuilder";
import { Defender } from "./Defenser";
import { MineBuilder } from "./MineBuilder";
import { GameState } from "./State";
import { TowerBuilder } from "./TowerBuilder";

export class GoldIA {
  private state: GameState;

  private mineBuilder: MineBuilder;

  private barrackBuilder: BarrackBuilder;

  private towerBuilder: TowerBuilder;

  private defender: Defender;

  constructor(state: GameState) {
    this.state = state;
    this.mineBuilder = new MineBuilder(state);
    this.barrackBuilder = new BarrackBuilder(state);
    this.towerBuilder = new TowerBuilder(state);
    this.defender = new Defender(state, this.towerBuilder, this.barrackBuilder);
  }

  train() {
    const { myKnightBarracks } = this.state;
    const myKnightBarrackIds = myKnightBarracks.map(({ id }) => id);
    console.error("train", myKnightBarrackIds);
    if (myKnightBarrackIds.length) {
      console.log(`TRAIN ${myKnightBarrackIds.join(" ")}`);
    } else {
      console.log(`TRAIN`);
    }
  }

  chooseAction() {
    const { mineBuilder, barrackBuilder, towerBuilder, defender } = this;
    if (defender.shouldDoAction()) {
      defender.action();
    } else if (mineBuilder.shouldDoAction()) {
      mineBuilder.action();
    } else if (barrackBuilder.shouldDoAction()) {
      barrackBuilder.action();
    } else if (towerBuilder.shouldDoAction(500)) {
      towerBuilder.action();
    } else {
      mineBuilder.action();
    }

    this.train();
  }
}
