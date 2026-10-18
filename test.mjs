import assert from "node:assert/strict";
import { calculateBinding, applyBoardDimensions, calculateOuterMaterial, calculateSplitBinding, RULES } from "./rules.js";
const base={textWidth:132,textHeight:183,textThickness:18};
for(const [type,c,s] of [["flatFabric",132,23],["roundFabric",126,28],["roundLeather",128,26]]){
  const x=calculateBinding({...base,bindingType:type});
  assert.equal(x.coverWidth,c);assert.equal(x.spineWidth,s);
  assert.equal(x.coverHeight,189);assert.equal(x.spineHeight,189);
  assert.equal(x.square,3);assert.equal(x.hingeGap,7.8);
}
const flat=calculateBinding({...base,bindingType:"flatFabric"});
const round=calculateBinding({...base,bindingType:"roundFabric"});
const leather=calculateBinding({...base,bindingType:"roundLeather"});
assert.equal(calculateOuterMaterial(flat,{material:"fabric"}).displayWidth,348);
assert.equal(calculateOuterMaterial(round,{material:"fabric"}).displayWidth,341);
assert.equal(calculateOuterMaterial(leather,{material:"leather"}).displayWidth,343);
assert.equal(calculateOuterMaterial(leather,{material:"fauxLeather"}).displayWidth,363);
// 2026-10-18 실측 조정: 가죽 라운드만 커버 +2mm, 책등 -2mm.
const currentExample = { textWidth: 133, textHeight: 193, textThickness: 23 };
const leatherExample = calculateBinding({ ...currentExample, bindingType: "roundLeather" });
const fabricExample = calculateBinding({ ...currentExample, bindingType: "roundFabric" });
assert.deepEqual([leatherExample.coverWidth, leatherExample.coverHeight, leatherExample.spineWidth, leatherExample.spineHeight], [129, 199, 31, 199]);
assert.deepEqual([fabricExample.coverWidth, fabricExample.spineWidth], [127, 33]);
assert.equal(calculateOuterMaterial(leatherExample, { material: "leather" }).displayWidth, 350);
assert.equal(calculateOuterMaterial(leatherExample, { material: "fauxLeather" }).displayWidth, 370);
assert.equal(calculateBinding({ ...currentExample, bindingType: "roundLeather", textThickness: 23.1 }).spineWidth, 31.5);
// 분할 기준은 책등 제외, 앞·뒤 최종 커버보드 폭에만 비율을 적용합니다.
const splitLeather = calculateSplitBinding(leatherExample);
assert.equal(splitLeather.percentage, 20);
assert.ok(Math.abs(splitLeather.perCover - 25.8) < 1e-9);
assert.ok(Math.abs(splitLeather.acrossCase - 98.2) < 1e-9);
const splitFabric = calculateSplitBinding(fabricExample);
assert.ok(Math.abs(splitFabric.perCover - 25.4) < 1e-9);
assert.ok(Math.abs(splitFabric.acrossCase - 99.4) < 1e-9);
// 수동 편집/비율 변경/힌지 변경이 분할 결과에 연동돼야 합니다.
const editedLeather = applyBoardDimensions(leatherExample, { coverWidth: 130, spineWidth: 30 });
const splitEdited = calculateSplitBinding(editedLeather, { percentage: 25 });
assert.ok(Math.abs(splitEdited.perCover - 32.5) < 1e-9);
assert.ok(Math.abs(splitEdited.acrossCase - 110.6) < 1e-9);
const alteredHinge = { ...leatherExample, hingeGap: 9 };
assert.ok(Math.abs(calculateSplitBinding(alteredHinge).acrossCase - 100.6) < 1e-9);
for (const percentage of ["", 0, -3, 100.1, "abc", Infinity]) {
  assert.throws(() => calculateSplitBinding(leatherExample, { percentage }));
}
assert.equal(RULES.materials.fauxLeather.turnIn,30);
assert.equal(RULES.materials.leather.turnIn,20);
const edited=applyBoardDimensions(round,{coverWidth:127,coverHeight:190,spineWidth:30,spineHeight:192});
const material=calculateOuterMaterial(edited,{material:"fabric"});
assert.equal(material.displayWidth,345); assert.equal(material.displayHeight,238);
assert.equal(calculateBinding({...base,bindingType:"roundFabric",textThickness:18.1}).spineWidth,28.5);
for(const v of ["",0,-1,"abc",Infinity]) {
  assert.throws(()=>calculateBinding({...base,bindingType:"roundFabric",textWidth:v}));
  assert.throws(()=>applyBoardDimensions(round,{spineWidth:v}));
}
assert.throws(()=>calculateOuterMaterial(round,{material:"leather"}));
console.log("PASS v0.6 round-leather geometry, split width calculations, overrides and input validation");
