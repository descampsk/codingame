import { Point } from "@mathigon/euclid";

export const getInputs = () => {
  /**
   * Première ligne :
   * 6 entiers
   * x & y pour la position de votre pod.
   * nextCheckpointX & nextCheckpointY pour les coordonnés du prochain checkpoint que votre pod doit atteindre.
   * nextCheckpointDist pour la distance calculé entre votre pod et son prochain checkpoint
   * nextCheckpointAngle pour l'angle en degré entre l'orientation de votre pod et
   * la direction que votre pod doit viser pour aller au prochain checkpoint (de -180 à 180).
   */
  const firstLine = readline().split(" ");
  const x = parseInt(firstLine[0], 10);
  const y = parseInt(firstLine[1], 10);
  const myPosition = new Point(x, y);

  const nextCheckpointX = parseInt(firstLine[2], 10); // x position of the next check point
  const nextCheckpointY = parseInt(firstLine[3], 10); // y position of the next check point
  const nextCheckpoint = new Point(nextCheckpointX, nextCheckpointY);

  const nextCheckpointDist = parseInt(firstLine[4], 10); // distance to the next checkpoint
  const nextCheckpointAngle = parseInt(firstLine[5], 10); // angle between your pod orientation and the direction of the next checkpoint

  const secondLine = readline().split(" ");
  const opponentX = parseInt(secondLine[0], 10);
  const opponentY = parseInt(secondLine[1], 10);
  const opponentPosition = new Point(opponentX, opponentY);
  return {
    myPosition,
    nextCheckpoint,
    nextCheckpointAngle,
    nextCheckpointDist,
    opponentPosition,
  };
};
