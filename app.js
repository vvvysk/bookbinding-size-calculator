import { calculateBinding, calculateOuterMaterial, formatNumber, RULES } from "./rules.js";

const $ = (id) => document.getElementById(id);

const els = {
  bindingType: $("bindingType"),
  textWidth: $("textWidth"),
  textHeight: $("textHeight"),
  textThickness: $("textThickness"),
  curve: $("curve"),
  curveField: $("curveField"),
  square: $("square"),
  hingeGap: $("hingeGap"),
  coverResult: $("coverResult"),
  spineResult: $("spineResult"),
  hingeResult: $("hingeResult"),
  squareResult: $("squareResult"),
  ruleText: $("ruleText"),
  notice: $("notice"),
  material: $("material"),
  turnIn: $("turnIn"),
  edgeWrapAllowance: $("edgeWrapAllowance"),
  edgeWrapResult: $("edgeWrapResult"),
  totalSideResult: $("totalSideResult"),
  materialResult: $("materialResult"),
  turnInResult: $("turnInResult"),
  caseWidthResult: $("caseWidthResult"),
  materialSizeResult: $("materialSizeResult"),
};

function render() {
  const isFlat = els.bindingType.value === "flatFabric";
  els.curveField.classList.toggle("hidden", isFlat);

  try {
    const result = calculateBinding({
      bindingType: els.bindingType.value,
      textWidth: els.textWidth.value,
      textHeight: els.textHeight.value,
      textThickness: els.textThickness.value,
      curve: els.curve.value,
      square: els.square.value,
      hingeGap: els.hingeGap.value,
    });

    els.coverResult.textContent =
      `${formatNumber(result.coverWidth)} × ${formatNumber(result.coverHeight)} mm`;
    els.spineResult.textContent =
      `${formatNumber(result.spineWidth)} × ${formatNumber(result.spineHeight)} mm`;
    els.hingeResult.textContent = `${formatNumber(result.hingeGap)} mm`;
    els.squareResult.textContent = `${formatNumber(result.square)} mm`;

    const outer = calculateOuterMaterial(result, {
      material: els.material.value,
      turnIn: els.turnIn.value,
      edgeWrapAllowance: els.edgeWrapAllowance.value,
    });
    els.materialResult.textContent = outer.material;
    els.turnInResult.textContent = formatNumber(outer.turnIn) + " mm";
    els.edgeWrapResult.textContent = formatNumber(outer.edgeWrapAllowance) + " mm";
    els.totalSideResult.textContent = formatNumber(outer.totalSideAllowance) + " mm";
    els.caseWidthResult.textContent = formatNumber(outer.caseWidth) + " mm";
    els.materialSizeResult.textContent = outer.displayWidth + " × " + outer.displayHeight + " mm";

    els.ruleText.innerHTML = result.ruleSummary
      .map((line) => `<p>• ${line}</p>`)
      .join("");
    els.notice.textContent = result.notice;
  } catch (error) {
    els.coverResult.textContent = "-";
    els.spineResult.textContent = "-";
    els.hingeResult.textContent = "-";
    els.squareResult.textContent = "-";
    [els.materialResult, els.turnInResult, els.edgeWrapResult, els.totalSideResult, els.caseWidthResult, els.materialSizeResult]
      .forEach(el => { el.textContent = "-"; });
    els.ruleText.innerHTML = "";
    els.notice.textContent = error.message;
  }
}

["input", "change"].forEach((eventName) => {
  Object.values(els).forEach((el) => {
    if (el?.addEventListener && ["INPUT", "SELECT"].includes(el.tagName)) {
      el.addEventListener(eventName, render);
    }
  });
});

els.bindingType.addEventListener("change", () => {
  els.square.value = (els.bindingType.value === "flatFabric" ? RULES.flatFabric : RULES.rounded).square;
  render();
});
Object.entries(RULES.materials).forEach(([value, material]) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = material.label;
  els.material.append(option);
});
els.material.addEventListener("change", () => {
  els.turnIn.value = RULES.materials[els.material.value].turnIn;
  render();
});
els.turnIn.value = RULES.materials[els.material.value].turnIn;
els.edgeWrapAllowance.value = RULES.edgeWrapAllowance;
els.square.value = RULES.rounded.square;
els.hingeGap.value = RULES.hingeGap;
render();
