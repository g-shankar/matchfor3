import test from 'node:test';import assert from 'node:assert/strict';import {validBirthDate,ageOn,mergeChildProfile} from '../src/child-profile.js';
const today=new Date(2026,8,19);
test('birth dates must be real, non-future child dates',()=>{assert.equal(validBirthDate('2017-11-10',today),true);assert.equal(validBirthDate('2017-02-30',today),false);assert.equal(validBirthDate('2027-01-01',today),false);assert.equal(validBirthDate('1990-01-01',today),false);assert.equal(validBirthDate('11/10/2017',today),false);});
test('age respects whether the birthday occurred this year',()=>{assert.equal(ageOn('2017-11-10',today),8);assert.equal(ageOn('2017-08-10',today),9);});
test('newer profile settings win cloud merges',()=>{assert.deepEqual(mergeChildProfile({birthDate:'2017-01-01',updatedAt:1},{birthDate:'2017-11-10',updatedAt:2}),{birthDate:'2017-11-10',updatedAt:2});});
