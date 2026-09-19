import test from 'node:test';import assert from 'node:assert/strict';
import {findMazePath,makeTraceMaze} from '../src/maze-engine.js';
const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
test('trace mazes are connected with a valid route at every difficulty',()=>{for(const size of [9,11,13])for(let seed=1;seed<=50;seed++){const maze=makeTraceMaze(size,seeded(seed)),path=findMazePath(maze.open,maze.size,maze.start,maze.goal);assert.equal(maze.size,size);assert.ok(path.length>size);assert.deepEqual(path[0],maze.start);assert.deepEqual(path.at(-1),maze.goal);for(let i=1;i<path.length;i++)assert.equal(Math.abs(path[i][0]-path[i-1][0])+Math.abs(path[i][1]-path[i-1][1]),1);}});
