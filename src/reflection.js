export function reflectionSchedule(random = Math.random,length=8) {const half=Math.floor(length/2);return [Math.floor(random()*half),half+Math.floor(random()*(length-half))];}
export function reflectionPrompt(skill) {
  const prompts = {
    shadeFraction:'How did you decide how many pieces to color?',
    equivalent:'Why do the two fractions show the same amount?',
    compareNumerator:'How did the size of each piece help you compare?',
    fractionPoint:'How did you count the jumps on the line?',
    fractionWhole:'How did you find the pieces needed to make a whole?',
    fractionDifference:'What stayed the same when you took pieces away?',
    divideShare:'How did you share everything fairly?',
    divideGroup:'How did you find the number of equal groups?',
    strategy:'Why do your chosen expressions have the same total?',
    sameArea:'How did you change the garden and keep its area the same?',
    compositeArea:'How did you split the garden into parts you could measure?',
    missingPerimeter:'How did you find the two missing fence lengths?',
    areaVsPerimeter:'What told you to think about the inside or the boundary?',
    symmetry:'Where could you fold the shape so the halves match?',
    shapeClues:'Which properties did you check against each clue?',
    rounding:'How did the midpoint help you choose a nearby number?',
    elapsed:'Which time jumps did you use?',
    length:'Why did you subtract the starting mark?',
    dataCompare:'How did you compare the two counts?',
    add:'Which parts did you add first?',
    subtract:'Did you subtract in steps, or count up?',
    money:'Which coins did you count first?',
    area: "How did you count the tiles inside your garden?",
    perimeter: "How did you count all the way around the boundary?",
    missingSide: "How did you find the missing side?",
    parts: "How did the equal parts help you name the fraction?",
    numberLine: "How did you find the fraction on the line?",
    compare: "Why is that fraction greater?",
    fractionSum: "Why does the size of each piece stay the same?",
    array: "How did you find the total without counting every crystal?",
    split: "How did breaking the array into two parts help?",
    missingFactor: "How did you find the number of groups?",
    sides: "How did you count the sides?",
    properties: "Which sides or corners helped you decide?",
    families:
      "Which properties helped you decide which family this shape belongs to?",
  };
  return prompts[skill] || "How did you figure it out?";
}
export function hasThought(text) {
  return text.trim().length >= 5 && /[\p{L}\p{N}]/u.test(text);
}
export function saveReflection(progress, q, text) {
  if (!hasThought(text)) return progress;
  return {
    ...progress,
    attempts: progress.attempts.map((a) =>
      fingerprintId(a.fingerprint) === fingerprintId(q.fingerprint)
        ? {
            ...a,
            reflection: {
              question: q.prompt,
              prompt: reflectionPrompt(q.skill),
              text: text.trim().slice(0, 500),
              date: Date.now(),
            },
          }
        : a,
    ),
  };
}
import {fingerprintId} from './engine.js';
