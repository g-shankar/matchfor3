import {worlds,labels,skillInfo,availableSkills,practiceLevel} from "./curriculum.js";
import {generateExtended} from "./extended-generators.js";
import {rng} from "./math-utils.js";
export {worlds,labels,rng};
export function initialProgress() {
  return {
    version: 1,
    skills: {},
    seen: [],
    attempts: [],
    sessions: [],
    seeds: 0,
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const int = (r, a, b) => Math.floor(r() * (b - a + 1)) + a;
const shuffle = (r, arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = int(r, 0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export function generate(skill, level, seed) {
  const r = rng(seed),
    a = int(r, 2, level === 1 ? 5 : level === 2 ? 8 : 12),
    b = int(r, 2, level === 1 ? 5 : 9),
    context = pick(r, ["Milo", "Pip", "Luna", "Fern", "Nori", "Coco"]),
    mode = int(r, 0, 2);
  let q = { skill, level, context, mode, a, b, type: "choice", visual: "grid" };
  const make = (prompt, answer, hint, explain, choices) =>
    Object.assign(q, {
      prompt,
      answer: String(answer),
      hint,
      explain,
      choices: choices?.map(String),
    });
  switch (skill) {
    case "sides": {
      const shape = pick(r, ["triangle", "rectangle", "pentagon", "hexagon"]);
      q.shape = shape;
      q.visual = "shape";
      make(
        `How many sides does this ${shape} have?`,
        { triangle: 3, rectangle: 4, pentagon: 5, hexagon: 6 }[shape],
        "Trace the outline. Count each straight edge once.",
        "A side is one straight edge of a shape.",
        [3, 4, 5, 6],
      );
      break;
    }
    case "properties": {
      q.shape = pick(r, [
        "square",
        "rectangle",
        "rhombus",
        "parallelogram",
        "trapezoid",
      ]);
      q.visual = "shape";
      const right = ["square", "rectangle"].includes(q.shape);
      make(
        mode === 0
          ? "Does this shape have four right angles?"
          : "Are both pairs of opposite sides parallel?",
        mode === 0
          ? right
            ? "Yes"
            : "No"
          : q.shape === "trapezoid"
            ? "No"
            : "Yes",
        mode === 0
          ? "A right angle looks like the corner of a book."
          : "Parallel sides run in the same direction and never meet.",
        mode === 0
          ? right
            ? "Each corner is a right angle, even if the shape is turned."
            : "Its slanted corners are not right angles."
          : q.shape === "trapezoid"
            ? "This trapezoid has one pair of parallel sides. The other pair would meet if extended."
            : "Both pairs of opposite sides are parallel.",
        ["Yes", "No"],
      );
      break;
    }
    case "families": {
      q.shape=pick(r,['square','rectangle','rhombus','parallelogram','trapezoid']);q.visual='shape';
      const family=pick(r,['rectangle','rhombus','parallelogram','quadrilateral','triangle']);
      const families={square:['rectangle','rhombus','parallelogram','quadrilateral'],rectangle:['rectangle','parallelogram','quadrilateral'],rhombus:['rhombus','parallelogram','quadrilateral'],parallelogram:['parallelogram','quadrilateral'],trapezoid:['quadrilateral']};
      const belongs=families[q.shape].includes(family);
      make(`Is this ${q.shape} also a ${family}?`,belongs?'Yes':'No','Look at the properties, not just the name. A shape can belong to more than one family.',belongs?`Yes. This ${q.shape} has the properties needed to be a ${family}.`:`No. This ${q.shape} does not have all the properties of a ${family}.`,['Yes','No']);break;
    }
    case "area":
      make(
        mode === 0
          ? `How many square tiles cover ${context}’s garden?`
          : `A garden is ${a} tiles long and ${b} tiles wide. What is its area?`,
        a * b,
        `There are ${b} rows with ${a} tiles in each. Count inside the garden.`,
        `Area counts the squares inside: ${b} groups of ${a} = ${a * b} square tiles.`,
      );
      if (mode === 2) {
        q.type = "build";
        make(
          `Build a rectangular garden with an area of ${a * b} tiles.`,
          a * b,
          "Change the width and height. Multiply them to count the tiles inside.",
          `Every rectangle with width × height = ${a * b} has this area.`,
        );
      }
      break;
    case "perimeter":
      q.visual = "boundary";
      make(
        `A fence goes around this ${a}-by-${b} garden. How many units of fence are needed?`,
        2 * (a + b),
        `Walk around all four edges: ${a} + ${b} + ${a} + ${b}.`,
        `Perimeter counts the boundary: ${a} + ${b} + ${a} + ${b} = ${2 * (a + b)} units.`,
      );
      break;
    case "missingSide":
      q.visual = "missing";
      make(
        `This garden covers ${a * b} tiles. Its width is ${a}. How many rows does it have?`,
        b,
        `How many groups of ${a} make ${a * b}?`,
        `There are ${b} rows because ${a} × ${b} = ${a * b}.`,
      );
      break;
    case "parts":
      q.d = pick(r, [3, 4, 5, 6, 8]);
      q.n = int(r, 1, q.d - 1);
      q.visual = mode === 0 ? "fractionCircle" : "fractionBar";
      make(
        `What fraction of this ${mode === 0 ? "sun wheel" : "trail bar"} is colored?`,
        `${q.n}/${q.d}`,
        `There are ${q.d} equal parts altogether. ${q.n} are colored.`,
        `The denominator ${q.d} counts all equal parts. The numerator ${q.n} counts the colored parts.`,
        [
          `${q.n}/${q.d}`,
          `${q.d - q.n}/${q.d}`,
          `${q.n}/${q.d + 1}`,
          `${q.d}/${q.n}`,
        ],
      );
      break;
    case "numberLine":
      q.d = pick(r, [3, 4, 6, 8]);
      q.n = int(r, 1, q.d - 1);
      q.visual = "line";
      make(
        "What fraction is marked on the number line?",
        `${q.n}/${q.d}`,
        `Between 0 and 1 there are ${q.d} equal jumps. Count to the dot.`,
        `The dot is ${q.n} of ${q.d} equal jumps from 0.`,
        [`${q.n}/${q.d}`, `${q.n + 1}/${q.d}`, `${q.n}/${q.d + 1}`, "1"],
      );
      break;
    case "compare":
      q.d = pick(r, [4, 5, 6, 8, 10]);
      q.n = int(r, 1, q.d - 2);
      q.m = int(r, q.n + 1, q.d - 1);
      q.visual = "compare";
      make(
        `Which is greater: ${q.n}/${q.d} or ${q.m}/${q.d}?`,
        `${q.m}/${q.d}`,
        "The pieces are the same size. Which fraction has more pieces?",
        `${q.m} equal pieces are more than ${q.n} of the same pieces.`,
        [`${q.n}/${q.d}`, `${q.m}/${q.d}`, "They are equal"],
      );
      break;
    case "fractionSum":
      q.d = pick(r, [4, 5, 6, 8, 10]);
      q.n = int(r, 1, q.d - 2);
      q.m = int(r, 1, q.d - q.n);
      q.visual = "sum";
      make(
        `${context} colors ${q.n}/${q.d} of a trail bar, then ${q.m}/${q.d} more. How much is colored?`,
        `${q.n + q.m}/${q.d}`,
        "Add the number of pieces. Their size stays the same.",
        `${q.n} + ${q.m} = ${q.n + q.m} pieces. Each is still one ${q.d}th.`,
        [`${q.n + q.m}/${q.d}`, `${q.n + q.m}/${q.d * 2}`, `${q.n}/${q.d}`],
      );
      break;
    case "array":
      make(
        mode === 0
          ? `There are ${b} rows of ${a} crystals. How many crystals altogether?`
          : `What is ${b} × ${a}? Show it with this array.`,
        a * b,
        `Count ${b} groups of ${a}. You can also split the array.`,
        `${b} × ${a} = ${a * b}. Each row is one equal group.`,
      );
      break;
    case "split":
      q.visual = "split";
      q.cut = Math.floor(a / 2);
      make(
        `Break ${b} × ${a} into ${b} × ${q.cut} and ${b} × ${a - q.cut}. What is the total?`,
        a * b,
        `${b} × ${q.cut} = ${b * q.cut}. ${b} × ${a - q.cut} = ${b * (a - q.cut)}. Add the two parts.`,
        `${b * q.cut} + ${b * (a - q.cut)} = ${a * b}. Breaking apart changes the steps, not the total.`,
      );
      break;
    case "missingFactor":
      q.visual = "missing";
      make(
        `${context} has ${a * b} crystals in groups of ${a}. How many groups?`,
        b,
        `Try skip-counting by ${a} until you reach ${a * b}.`,
        `${b} groups of ${a} make ${a * b}: ${a} × ${b} = ${a * b}.`,
      );
      break;
    default:
      return generateExtended(skill,level,seed);
  }
  if(level>1&&mode===2&&['area','perimeter','missingSide','array','split','missingFactor'].includes(skill)&&q.type!=='build')q.type='input';
  if(level>1&&mode===1&&['array','split'].includes(skill)){q.visual='expression';q.model={a,b,operator:'×'};}
  if(level>1&&mode===2&&['compare','fractionSum'].includes(skill)){q.visual='expression';q.model={text:skill==='compare'?`${q.n}/${q.d} or ${q.m}/${q.d}`:`${q.n}/${q.d} + ${q.m}/${q.d}`};}
  if (!q.choices && q.type === "choice") {
    const ans = Number(q.answer);
    q.choices = shuffle(r, [
      ...new Set([
        ans,
        ans + int(r, 1, 3),
        Math.max(0, ans - int(r, 1, 3)),
        ans + int(r, 4, 7),
      ]),
    ]).map(String);
  } else if (q.choices) q.choices = shuffle(r, [...new Set(q.choices)]);
  q.rotation = pick(r, level===1?[0,0,15,-15,30]:[0,15,-15,30,45,60,90,120,150]);
  q.fingerprint = JSON.stringify([
    skill,
    q.prompt,
    q.visual,
    ...(q.visual === "shape"
      ? [q.shape, q.rotation]
      : ["parts","numberLine","compare","fractionSum"].includes(skill)
        ? [q.n, q.d, q.m]
        : [
            q.type === "build" ? null : q.a,
            q.type === "build" ? null : q.b,
            q.cut,
          ]),
  ]);
  return q;
}
export function nextQuestion(progress,worldId,sessionSkills=[],options={}) {
 const {skillId}=options;
 if(skillId&&!skillInfo[skillId])throw Error('Choose a skill from the learning trail.');
 if(worldId&&!worlds.some(w=>w.id===worldId))throw Error('Choose an island from the map.');
 let candidates=skillId?[skillId]:availableSkills(progress,worldId);
 const position=sessionSkills.length;
 const warmup=!worldId&&!skillId&&(position===0||position===6);
 if(warmup){const booster=position===0?'numbers':'measure';candidates=availableSkills(progress,booster);}else if(!worldId&&!skillId)candidates=candidates.filter(s=>worlds.find(w=>w.id===skillInfo[s].world).focus);
 const ranked=candidates.map(skill=>{const s=progress.skills[skill]||{independent:0,total:0,last:0},recent=progress.attempts.filter(a=>a.skill===skill).slice(-12),rate=recent.length?recent.filter(a=>a.independent).length/recent.length:s.total?s.independent/s.total:0;
 return {skill,priority:(1-rate)*3+(s.total?0:1)+(s.total&&Date.now()-s.last>3*86400000?.7:0)-(sessionSkills.slice(-2).includes(skill)?3:0)+(skillInfo[skill].world==='shapes'?.2:0)};}).sort((a,b)=>b.priority-a.priority);
 const seen=new Set(progress.seen);let seed=progress.seeds||0;
 for(let i=0;i<6000;i++){seed++;const skill=ranked[Math.floor(i/8)%ranked.length]?.skill;if(!skill)break;const level=practiceLevel(progress,skill),q=generate(skill,level,seed);if(seen.has(q.fingerprint))continue;
 const previous=progress.attempts.filter(a=>a.skill===skill).slice(-2);
 if(i%8<6&&previous.length&&previous.every(a=>a.representation===q.visual))continue;
 return {...q,seed,worldId:skillInfo[skill].world,isWarmup:warmup};}
 throw Error('You have explored the available variations here. Pick another skill or island for a fresh discovery.');
}
export function updateSkill(old,a){old=old||{total:0,independent:0,supported:0,last:0};const reps={...(old.representations||{})};const rep=reps[a.representation]||{total:0,independent:0,supported:0};reps[a.representation]={total:rep.total+1,independent:rep.independent+(a.independent?1:0),supported:rep.supported+(!a.skipped&&!a.independent?1:0)};return {...old,total:old.total+1,independent:old.independent+(a.independent?1:0),supported:old.supported+(!a.skipped&&!a.independent?1:0),last:Math.max(old.last||0,a.date),representations:reps};}
export function record(
  progress,
  q,
  { hinted = false, retries = 0, skipped = false, duration = 0 },
) {
  const independent=!hinted&&!retries&&!skipped;
  const attempt={skill:q.skill,worldId:skillInfo[q.skill]?.world,level:q.level,fingerprint:q.fingerprint,representation:q.visual,interaction:q.type,independent,hinted,retries,skipped,duration,date:Date.now()};
  return {...progress,seeds:Math.max(progress.seeds||0,q.seed||0),seen:[...new Set([...progress.seen,q.fingerprint])],skills:{...progress.skills,[q.skill]:updateSkill(progress.skills[q.skill],attempt)},attempts:[...progress.attempts,attempt].slice(-3000)};
}
export function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem("mathquest-v1"));
    if (
      p?.version === 1 &&
      p.skills &&
      Array.isArray(p.seen) &&
      Array.isArray(p.attempts) &&
      Array.isArray(p.sessions)
    )
      return p;
  } catch {}
  return initialProgress();
}
