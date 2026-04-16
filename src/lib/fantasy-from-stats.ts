/**
 * Dream11-inspired T20 fantasy points from raw stats.
 * Official Dream11 rules change by season; this is an approximation for live tracking.
 */

export function fantasyBattingT20(input: {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissed: boolean;
}): number {
  const { runs, balls, fours, sixes, dismissed } = input;
  let pts = runs;
  pts += fours * 1;
  pts += sixes * 2;
  if (runs >= 100) pts += 16;
  else if (runs >= 50) pts += 8;
  else if (runs >= 30) pts += 4;
  if (runs === 0 && balls > 0 && dismissed) pts -= 2;
  if (balls >= 10) {
    const sr = (runs / balls) * 100;
    if (runs >= 10) {
      if (sr <= 50) pts -= 6;
      else if (sr <= 60) pts -= 4;
      else if (sr <= 70) pts -= 2;
      else if (sr >= 170) pts += 6;
      else if (sr >= 150) pts += 4;
      else if (sr >= 130) pts += 2;
    }
  }
  return pts;
}

export function fantasyBowlingT20(input: {
  wickets: number;
  overs: number;
  runsConceded: number;
  maidens: number;
}): number {
  const { wickets, overs, runsConceded, maidens } = input;
  let pts = wickets * 25;
  if (wickets >= 5) pts += 16;
  else if (wickets >= 4) pts += 8;
  pts += maidens * 12;
  const econ = overs > 0 ? runsConceded / overs : 0;
  if (overs >= 2) {
    if (econ < 5) pts += 6;
    else if (econ < 6) pts += 4;
    else if (econ < 7) pts += 2;
    else if (econ <= 8) pts += 0;
    else if (econ <= 9) pts -= 2;
    else if (econ <= 10) pts -= 4;
    else pts -= 6;
  }
  return pts;
}

export function fantasyFieldingT20(input: { catches: number; stumpings: number; runOuts: number }): number {
  return input.catches * 8 + input.stumpings * 12 + input.runOuts * 12;
}
