import assert from "node:assert/strict";
import { calculateBinding, calculateOuterMaterial, RULES } from "./rules.js";

const round = calculateBinding({
  bindingType: "rounded",
  textWidth: 151,
  textHeight: 223,
  textThickness: 26.5,
  curve: "normal",
});

assert.equal(round.coverWidth, 149);
assert.equal(round.coverHeight, 233);
assert.equal(round.spineWidth, 45.5);
assert.equal(round.spineHeight, 233);
assert.equal(round.hingeGap, 7.8);

const flat = calculateBinding({
  bindingType: "flatFabric",
  textWidth: 131.5,
  textHeight: 196.5,
  textThickness: 14,
});

assert.equal(flat.coverWidth, 131.5);
assert.equal(flat.coverHeight, 203.5);
assert.equal(flat.spineWidth, 22.5);
assert.equal(flat.hingeGap, 7.8);

for (const bindingType of ["rounded", "flatFabric"]) {
  const result = calculateBinding({ bindingType, textWidth: 151, textHeight: 223, textThickness: 26.5, square: 4, hingeGap: 9 });
  assert.equal(result.coverHeight, 231);
  assert.equal(result.spineHeight, 231);
  assert.equal(result.square, 4);
  assert.equal(result.hingeGap, 9);
  assert.equal(result.coverWidth, bindingType === "rounded" ? 149 : 151);
  assert.equal(result.spineWidth, bindingType === "rounded" ? 45.5 : 35);
}
const base = { bindingType: "rounded", textWidth: 151, textHeight: 223, textThickness: 26.5 };
assert.equal(calculateBinding({ ...base, square: 0 }).coverHeight, 223);
for (const square of ["", -1, "abc"]) {
  assert.throws(() => calculateBinding({ ...base, square }), /상·하/);
}
for (const hingeGap of ["", 0, -1, "abc"]) {
  assert.throws(() => calculateBinding({ ...base, hingeGap }), /힌지/);
}

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9);
const workBoard = calculateBinding({ bindingType: "flatFabric", textWidth: 132, textHeight: 183, textThickness: 18, hingeGap: 7.8 });
assert.equal(workBoard.coverWidth, 132);
assert.equal(workBoard.coverHeight, 190);
assert.equal(workBoard.spineWidth, 26.5);
assert.equal(workBoard.spineHeight, 190);
const workOuter = calculateOuterMaterial(workBoard, { material: "fabric" });
near(workOuter.caseWidth, 306.1);
assert.equal(workOuter.turnIn, 20);
assert.equal(workOuter.edgeWrapAllowance, 2.7);
near(workOuter.totalSideAllowance, 22.7);
near(workOuter.cuttingWidth, 351.5);
near(workOuter.cuttingHeight, 235.4);
assert.equal(workOuter.displayWidth, 352);
assert.equal(workOuter.displayHeight, 236);
for (const [material, expected] of [["fabric",20],["fauxLeather",30],["leather",20]]) {
  assert.equal(RULES.materials[material].turnIn, expected);
  assert.equal(calculateOuterMaterial(workBoard, { material }).turnIn, expected);
}
assert.equal(RULES.edgeWrapAllowance, 2.7);
const custom = calculateOuterMaterial(workBoard, { material: "leather", turnIn: 17, edgeWrapAllowance: 3 });
assert.equal(custom.turnIn, 17);
assert.equal(custom.edgeWrapAllowance, 3);
assert.equal(custom.totalSideAllowance, 20);
near(custom.cuttingWidth, 346.1);
assert.equal(custom.cuttingHeight, 230);
assert.equal(custom.displayWidth, 347);
assert.equal(custom.displayHeight, 230);
for (const [field, message] of [["turnIn", /안쪽 턴인/], ["edgeWrapAllowance", /엣지 회전/]]) {
  for (const value of ["", -1, "abc", Infinity]) {
    assert.throws(() => calculateOuterMaterial(workBoard, { [field]: value }), message);
  }
}
const zero = calculateOuterMaterial(workBoard, { turnIn: 0, edgeWrapAllowance: 0 });
near(zero.cuttingWidth, 306.1);
assert.equal(zero.cuttingHeight, 190);
// 기존 라운드 보드와 전개 가로를 유지합니다.
const sampleBoard = calculateBinding({ ...base, textHeight: 221 });
const sampleOuter = calculateOuterMaterial(sampleBoard, { material: "fauxLeather" });
near(sampleOuter.caseWidth, 359.1);
near(sampleOuter.cuttingWidth, 424.5);
near(sampleOuter.cuttingHeight, 296.4);
assert.equal(sampleOuter.displayWidth, 425);
assert.equal(sampleOuter.displayHeight, 297);
console.log("PASS: v0.4 기존 보드·실제 사례 352 × 236mm·턴인/엣지 회전 테스트 완료");
