const {test}=require('node:test');const assert=require('node:assert/strict');const {score,factor}=require('../dist/scoring.js');
const entries=r=>r.map((rank,player)=>({player,rank}));
test('joint runners-up occupy second and third',()=>assert.deepEqual(score(entries([1,2,2,4])).map(e=>e.base),[3,1.5,1.5,0]));
test('seven tied runners-up share three points',()=>{const result=score(entries([1,2,2,2,2,2,2,2]));assert.equal(result[1].base,3/7);assert.ok(Math.abs(result.reduce((s,e)=>s+e.base,0)-6)<1e-12);});
test('tied winners share first and second',()=>assert.deepEqual(score(entries([1,1,3])).map(e=>e.base),[2.5,2.5,1]));
test('invalid rankings, duplicate participants and too few players rejected',()=>{for(const ranks of [[1,2,2,3],[2,3,4],[1,2],[1,2,0]])assert.throws(()=>score(entries(ranks)));assert.throws(()=>score([{player:0,rank:1},{player:0,rank:2},{player:1,rank:3}]));});
test('fractional handicap boundaries and first half',()=>{const r={start:7,low:3,high:6,normal:1,midFactor:1.5,highFactor:2};assert.deepEqual([2.99,3,5.5,6].map(g=>factor(g,7,r)),[1,1.5,1.5,2]);assert.equal(factor(99,6,r),1);});
