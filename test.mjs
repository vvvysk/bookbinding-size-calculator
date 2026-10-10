import assert from "node:assert/strict";
import { calculateBinding, applyBoardDimensions, calculateOuterMaterial, RULES } from "./rules.js";
const base={textWidth:132,textHeight:183,textThickness:18};
for(const [type,c,s] of [["flatFabric",132,23],["roundFabric",126,28],["roundLeather",126,28]]){
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
assert.equal(calculateOuterMaterial(leather,{material:"leather"}).displayWidth,341);
assert.equal(calculateOuterMaterial(leather,{material:"fauxLeather"}).displayWidth,361);
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
console.log("PASS v0.5 board geometry, overrides, materials and input validation");
