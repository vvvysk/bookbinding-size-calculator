import { calculateBinding, applyBoardDimensions, calculateOuterMaterial, calculateSplitBinding, calculateSpineBands, SIZE_PRESETS, formatNumber, RULES } from "./rules.js?v=0.8";

const $ = (id) => document.getElementById(id);
const ids = [
  "sizePreset", "bandCount", "bandPositions", "bandSpacingResult", "bandEdgeResult", "bandPreview",
  "bindingType", "textWidth", "textHeight", "textThickness", "square", "hingeGap", "hingePreset", "hingeCustomWrap", "material", "turnIn", "edgeWrapAllowance",
  "coverWidth", "coverHeight", "spineWidth", "spineHeight", "coverResult", "spineResult", "coverRecommended", "spineRecommended",
  "restoreBoards", "boardStatus", "hingeResult", "squareResult", "ruleText", "notice", "materialResult", "turnInResult",
  "edgeWrapResult", "totalSideResult", "caseWidthResult", "materialSizeResult",
  "splitEnabled", "splitPercent", "splitDetails", "splitPerCover", "splitAcrossCase", "splitFabricResult",
];
const els = Object.fromEntries(ids.map(id => [id, $(id)]));
const boardFields = ["coverWidth", "coverHeight", "spineWidth", "spineHeight"];
const resultFields = ["coverResult", "spineResult", "hingeResult", "squareResult", "materialResult", "turnInResult",
  "edgeWrapResult", "totalSideResult", "caseWidthResult", "materialSizeResult", "splitPerCover", "splitAcrossCase", "splitFabricResult", "bandPositions", "bandSpacingResult", "bandEdgeResult"];

function readRecommended() {
  return calculateBinding({
    bindingType: els.bindingType.value,
    textWidth: els.textWidth.value,
    textHeight: els.textHeight.value,
    textThickness: els.textThickness.value,
    square: els.square.value,
    hingeGap: els.hingeGap.value,
  });
}

function showSize(width, height) {
  return `${formatNumber(width)} × ${formatNumber(height)} mm`;
}

function render() {
  try {
    const recommended = readRecommended();
    els.coverRecommended.textContent = showSize(recommended.coverWidth, recommended.coverHeight);
    els.spineRecommended.textContent = showSize(recommended.spineWidth, recommended.spineHeight);
    const board = applyBoardDimensions(recommended, Object.fromEntries(boardFields.map(key => [key, els[key].value])));
    const changed = boardFields.some(key => Math.abs(board[key] - recommended[key]) > 1e-9);
    els.coverResult.textContent = showSize(board.coverWidth, board.coverHeight);
    els.spineResult.textContent = showSize(board.spineWidth, board.spineHeight);
    els.hingeResult.textContent = `${formatNumber(board.hingeGap)} mm`;
    els.squareResult.textContent = `${formatNumber(board.square)} mm`;
    els.boardStatus.textContent = changed ? "수동 조정한 최종 보드 치수가 겉재료 재단과 분할 계산에 반영되었습니다." : "현재 최종 재단 치수는 자동 권장값과 같습니다.";
    const bands = calculateSpineBands(board.spineHeight, els.bandCount.value);
    els.bandPositions.replaceChildren(...bands.positions.map((mm, i) => {
      const row = document.createElement("div");
      row.className = "band-position-line";
      const label = document.createElement("span");
      label.textContent = `${i + 1}번`;
      const value = document.createElement("span");
      value.textContent = `${Math.round(mm)} mm`;
      row.append(label, value);
      return row;
    }));
    els.bandSpacingResult.textContent = `${Math.round(bands.centerSpacing)} mm`;
    els.bandEdgeResult.textContent = `${Math.round(bands.edgeMargin)} mm`;
    els.bandPreview.replaceChildren(...bands.positions.map(mm => {
      const marker = document.createElement("span");
      marker.className = "band-marker";
      marker.style.top = `${mm / bands.height * 100}%`;
      return marker;
    }));
    els.splitDetails.hidden = !els.splitEnabled.checked;
    if (els.splitEnabled.checked) {
      const split = calculateSplitBinding(board, {
        percentage: els.splitPercent.value,
        edgeWrapAllowance: els.edgeWrapAllowance.value,
      });
      els.splitPerCover.textContent = `${formatNumber(split.perCover)} mm`;
      els.splitAcrossCase.textContent = `${formatNumber(split.acrossCase)} mm`;
      els.splitFabricResult.textContent = split.fabricPieces
        ? `${split.fabricDisplayWidth} × ${split.fabricDisplayHeight} mm`
        : "해당 없음 (패브릭 0장)";
    } else {
      els.splitPerCover.textContent = "-";
      els.splitAcrossCase.textContent = "-";
      els.splitFabricResult.textContent = "-";
    }
    const outer = calculateOuterMaterial(board, {
      material: els.material.value,
      turnIn: els.turnIn.value,
      edgeWrapAllowance: els.edgeWrapAllowance.value,
    });
    els.materialResult.textContent = outer.material;
    els.turnInResult.textContent = `${formatNumber(outer.turnIn)} mm`;
    els.edgeWrapResult.textContent = `${formatNumber(outer.edgeWrapAllowance)} mm`;
    els.totalSideResult.textContent = `${formatNumber(outer.totalSideAllowance)} mm`;
    els.caseWidthResult.textContent = `${formatNumber(outer.caseWidth)} mm`;
    els.materialSizeResult.textContent = `${outer.displayWidth} × ${outer.displayHeight} mm`;
    els.ruleText.replaceChildren(...recommended.ruleSummary.map(line => {
      const p = document.createElement("p");
      p.textContent = `• ${line}`;
      return p;
    }));
    els.notice.textContent = recommended.notice;
  } catch (error) {
    resultFields.forEach(key => { els[key].textContent = "-"; });
    els.coverRecommended.textContent = "-";
    els.spineRecommended.textContent = "-";
    els.boardStatus.textContent = "";
    els.bandPreview.replaceChildren();
    els.ruleText.replaceChildren();
    els.notice.textContent = error.message;
  }
}

function restoreBoards() {
  try {
    const recommended = readRecommended();
    boardFields.forEach(key => { els[key].value = formatNumber(recommended[key]); });
  } catch (_) {
    // 입력 중인 속지 치수가 유효하지 않으면 수동 입력값을 보존합니다.
  }
  render();
}

function selectMaterialForType() {
  if (els.bindingType.value !== "roundLeather") {
    els.material.value = "fabric";
  } else if (els.material.value === "fabric") {
    els.material.value = "leather";
  }
  els.turnIn.value = RULES.materials[els.material.value].turnIn;
}

Object.entries(RULES.materials).forEach(([value, material]) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = material.label;
  els.material.append(option);
});
// 힌지 간격은 여러 선택지 중 고르되, 임의의 폭도 직접 입력 가능.
RULES.hingePresets.forEach(value => {
  const option = document.createElement("option");
  option.value = String(value);
  option.textContent = `${value} mm${value === RULES.hingeGap ? " · 기본" : ""}`;
  els.hingePreset.append(option);
});
const customHinge = document.createElement("option");
customHinge.value = "custom";
customHinge.textContent = "직접 입력";
els.hingePreset.append(customHinge);
els.hingePreset.value = String(RULES.hingeGap);
els.hingeCustomWrap.hidden = true;
els.sizePreset.value = "custom";
els.bandCount.value = "5";
els.square.value = RULES[els.bindingType.value].square;
els.hingeGap.value = RULES.hingeGap;
els.edgeWrapAllowance.value = RULES.edgeWrapAllowance;
selectMaterialForType();
restoreBoards();

els.bindingType.addEventListener("change", () => {
  els.square.value = RULES[els.bindingType.value].square;
  selectMaterialForType();
  restoreBoards();
});
els.material.addEventListener("change", () => {
  const priorType = els.bindingType.value;
  if (els.material.value === "fabric" && els.bindingType.value === "roundLeather") {
    els.bindingType.value = "roundFabric";
  } else if (els.material.value !== "fabric" && els.bindingType.value !== "roundLeather") {
    els.bindingType.value = "roundLeather";
  }
  els.turnIn.value = RULES.materials[els.material.value].turnIn;
  if (els.bindingType.value !== priorType) {
    els.square.value = RULES[els.bindingType.value].square;
    restoreBoards();
  } else {
    render(); // 천연↔인조 전환 시 수동 보드 치수는 유지합니다.
  }
});
els.sizePreset.addEventListener("change", () => {
  const preset = SIZE_PRESETS[els.sizePreset.value];
  if (preset) {
    els.textWidth.value = preset.textWidth;
    els.textHeight.value = preset.textHeight;
    els.bandCount.value = "5";
  }
  restoreBoards();
});
["textWidth", "textHeight"].forEach(id => {
  els[id].addEventListener("input", () => {
    els.sizePreset.value = "custom";
    restoreBoards();
  });
});
["textThickness", "square"].forEach(id => {
  els[id].addEventListener("input", restoreBoards);
});
els.bandCount.addEventListener("change", render);
els.hingePreset.addEventListener("change", () => {
  const isCustom = els.hingePreset.value === "custom";
  els.hingeCustomWrap.hidden = !isCustom;
  if (isCustom) {
    els.hingeGap.focus();
  } else {
    els.hingeGap.value = els.hingePreset.value;
    render();
  }
});
["hingeGap", "turnIn", "edgeWrapAllowance", "splitPercent", ...boardFields].forEach(id => {
  els[id].addEventListener("input", render);
});
els.splitEnabled.addEventListener("change", render);
els.restoreBoards.addEventListener("click", restoreBoards);
