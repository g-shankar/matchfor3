import test from 'node:test';import assert from 'node:assert/strict';
import {makeMathTrail,trailModes} from '../src/math-trails-engine.js';
const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
test('every math trail has an adjacent eight-step route with unique labels',()=>{for(const mode of Object.keys(trailModes))for(let seed=1;seed<=60;seed++){const game=makeMathTrail(mode,seeded(seed));assert.equal(game.sequence.length,8);assert.equal(game.path.length,8);assert.equal(new Set(game.cells.map(x=>x.label)).size,36);for(let i=1;i<game.path.length;i++)assert.equal(Math.abs(game.path[i][0]-game.path[i-1][0])+Math.abs(game.path[i][1]-game.path[i-1][1]),1);}});
