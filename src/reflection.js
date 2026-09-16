export function reflectionSchedule(random = Math.random) {
  return [Math.floor(random() * 4), 4 + Math.floor(random() * 4)];
}
export function reflectionPrompt(skill) {
  const prompts = {
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
      a.fingerprint === q.fingerprint
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
