import { debug } from "./helpers";

/* eslint-disable class-methods-use-this */
export const SHOULD_DEBUG: Record<string, boolean> = {
  DefenseManager: true,
  RecyclerBuilder: false,
  Island: false,
  RobotBuilder: true,
  ExpansionManager: true,
};

export abstract class ClassLogger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected debug(...data: any[]) {
    const className = this.constructor.name;
    if (SHOULD_DEBUG[className]) debug(`[${className}]`, ...data);
  }
}
