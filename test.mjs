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

assert.equal(flat.coverWidth, 132.5);
assert.equal(flat.coverHeight, 203.5);
assert.equal(flat.spineWidth, 22.5);
assert.equal(flat.hingeGap, 7.8);

for (const bindingType of ["rounded", "flatFabric"]) {
  const result = calculateBinding({ bindingType, textWidth: 151, textHeight: 223, textThickness: 26.5, square: 4, hingeGap: 9 });
  assert.equal(result.coverHeight, 231);
  assert.equal(result.spineHeight, 231);
  assert.equal(result.square, 4);
  assert.equal(result.hingeGap, 9);
  assert.equal(result.coverWidth, bindingType === "rounded" ? 149 : 152);
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
// A: 소수 원본 보존 및 최종 표시만 올림
const sampleBoard = calculateBinding({ ...base, textHeight: 221, square: 5, hingeGap: 7.8 });
const sampleOuter = calculateOuterMaterial(sampleBoard, { material: "fauxLeather", cuttingAllowance: 30 });
assert.equal(sampleBoard.coverWidth, 149);
assert.equal(sampleBoard.coverHeight, 231);
assert.equal(sampleBoard.spineWidth, 45.5);
assert.ok(Math.abs(sampleOuter.caseWidth - 359.1) < 1e-9);
assert.ok(Math.abs(sampleOuter.cuttingWidth - 419.1) < 1e-9);
assert.equal(sampleOuter.cuttingHeight, 291);
assert.equal(sampleOuter.displayWidth, 420);
assert.equal(sampleOuter.displayHeight, 291);
// B: 재료별 기본값
for (const [material, expected] of [["fabric", 20], ["fauxLeather", 30], ["leather", 20]]) {
  assert.equal(RULES.materials[material].cuttingAllowance, expected);
  assert.equal(calculateOuterMaterial(sampleBoard, { material }).cuttingAllowance, expected);
}
// C: 사용자가 수정한 17mm를 그대로 적용
const customOuter = calculateOuterMaterial(sampleBoard, { material: "leather", cuttingAllowance: 17 });
assert.equal(customOuter.cuttingAllowance, 17);
assert.ok(Math.abs(customOuter.cuttingWidth - 393.1) < 1e-9);
assert.equal(customOuter.cuttingHeight, 265);
assert.equal(customOuter.displayWidth, 394);
assert.equal(customOuter.displayHeight, 265);
const flatOuter = calculateOuterMaterial(flat, { material: "fabric", cuttingAllowance: 17 });
assert.ok(Math.abs(flatOuter.caseWidth - 303.1) < 1e-9);
assert.ok(Math.abs(flatOuter.cuttingWidth - 337.1) < 1e-9);
assert.equal(flatOuter.cuttingHeight, 237.5);
assert.equal(flatOuter.displayWidth, 338);
assert.equal(flatOuter.displayHeight, 238);
for (const cuttingAllowance of ["", -1, "abc", Infinity]) {
  assert.throws(() => calculateOuterMaterial(sampleBoard, { cuttingAllowance }), /외곽 재단 여유/);
}
assert.equal(calculateOuterMaterial(sampleBoard, { cuttingAllowance: 0 }).cuttingHeight, 231);
console.log("PASS: v0.3 기존 보드 계산 및 겉재료 테스트 A/B/C·입력 검증 완료");

