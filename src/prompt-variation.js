const openings = [
  (p) => p,
  (p) => `Take a close look. ${p}`,
  (p) => `Milo has a math clue for you: ${p}`,
  (p) => `Try this trail challenge. ${p}`,
  (p) => `What do you notice? ${p}`,
  (p) => `Use the picture if it helps. ${p}`,
  (p) => `Math detective time! ${p}`,
  (p) => `Here is a new puzzle. ${p}`,
  (p) => `Pause, picture it, then decide. ${p}`,
  (p) => `At the next trail marker: ${p}`,
  (p) => `Show what you know in a new way. ${p}`,
  (p) => `Fern found a question for you. ${p}`,
  (p) => `Ready for a tiny brain stretch? ${p}`,
  (p) => `Choose a strategy that makes sense. ${p}`,
  (p) => `Look for a pattern before you answer. ${p}`,
  (p) => `Coco wonders: ${p}`,
  (p) => `Make a quick sketch in your mind. ${p}`,
  (p) => `This one may have more than one path. ${p}`,
  (p) => `Use numbers, a picture, or both. ${p}`,
  (p) => `On today’s discovery trail: ${p}`,
  (p) => `Think first, then test your idea. ${p}`,
  (p) => `Luna brought the next challenge. ${p}`,
  (p) => `Find the important math in this story. ${p}`,
  (p) => `Your turn to be the expert. ${p}`,
];

export function varyPrompt(prompt, seed) {
  return openings[Math.abs(seed) % openings.length](prompt);
}

export const promptVariationCount = openings.length;
