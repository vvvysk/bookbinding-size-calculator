export const RULES = Object.freeze({
  hingeGap: 7.8,
  edgeWrapAllowance: 2.7,
  materials: {
    fabric: { label: "패브릭", turnIn: 20 },
    fauxLeather: { label: "인조가죽", turnIn: 30 },
    leather: { label: "천연가죽", turnIn: 20 },
  },
  flatFabric: { label: "패브릭 평등", coverWidthDelta: 0, spineWidthDelta: 5, square: 3 },
  roundFabric: { label: "패브릭 라운드", coverWidthDelta: -6, spineWidthDelta: 10, square: 3 },
  roundLeather: { label: "가죽 라운드", coverWidthDelta: -6, spineWidthDelta: 10, square: 3 },
});

const BINDING_TYPES = ["flatFabric", "roundFabric", "roundLeather"];

export function ceilToHalf(value) {
  return Math.ceil(value * 2 - 1e-9) / 2;
}

export function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function positiveNumber(value, label) {
  if (value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) <= 0) {
    throw new Error(`${label}은(는) 0보다 큰 숫자로 입력하세요.`);
  }
  return Number(value);
}

function nonnegativeNumber(value, label) {
  if (value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0) {
    throw new Error(`${label}은(는) 0 이상의 숫자로 입력하세요.`);
  }
  return Number(value);
}

export function calculateBinding(input) {
  if (!BINDING_TYPES.includes(input.bindingType)) {
    throw new Error("제본 유형을 선택하세요.");
  }
  const rule = RULES[input.bindingType];
  const width = positiveNumber(input.textWidth, "속지 가로");
  const height = positiveNumber(input.textHeight, "속지 세로");
  const thickness = positiveNumber(input.textThickness, "속지 두께");
  const square = input.square === undefined ? rule.square : nonnegativeNumber(input.square, "상·하 돌출량");
  const hingeGap = input.hingeGap === undefined ? RULES.hingeGap : positiveNumber(input.hingeGap, "힌지 간격");
  const coverWidth = width + rule.coverWidthDelta;
  const coverHeight = height + square * 2;
  const spineWidth = ceilToHalf(thickness + rule.spineWidthDelta);
  if (coverWidth <= 0) throw new Error("계산된 커버 보드 폭이 0 이하입니다. 속지 가로를 확인하세요.");

  return {
    type: rule.label,
    bindingType: input.bindingType,
    coverWidth,
    coverHeight,
    spineWidth,
    spineHeight: coverHeight,
    hingeGap,
    square,
    ruleSummary: [
      `커버 가로 = 속지 가로 ${rule.coverWidthDelta < 0 ? "−" : "+"} ${Math.abs(rule.coverWidthDelta)}mm`,
      `커버·책등 세로 = 속지 세로 + (${formatNumber(square)}mm × 2)`,
      `책등 폭 = 속지 두께 + ${rule.spineWidthDelta}mm → 0.5mm 단위 올림`,
      `힌지 = ${formatNumber(hingeGap)}mm (입력값)`,
    ],
    notice: "실제 제작 경험을 반영한 존재공작소 잠정 권장값입니다. 라운드는 얕은 곡률 기준이며 곡률 반경 자체를 계산하지 않습니다.",
  };
}

// 최종 보드 치수는 자동 권장값과 별도로 직접 수정할 수 있습니다.
export function applyBoardDimensions(recommended, input = {}) {
  return {
    ...recommended,
    coverWidth: input.coverWidth === undefined ? recommended.coverWidth : positiveNumber(input.coverWidth, "커버 보드 가로"),
    coverHeight: input.coverHeight === undefined ? recommended.coverHeight : positiveNumber(input.coverHeight, "커버 보드 세로"),
    spineWidth: input.spineWidth === undefined ? recommended.spineWidth : positiveNumber(input.spineWidth, "책등 보드 가로"),
    spineHeight: input.spineHeight === undefined ? recommended.spineHeight : positiveNumber(input.spineHeight, "책등 보드 세로"),
  };
}

// 계산에는 소수값을 보존하고 겉재료 최종 표시 치수만 1mm 단위로 올립니다.
export function calculateOuterMaterial(board, input = {}) {
  const materialKey = input.material || "fabric";
  const material = RULES.materials[materialKey];
  if (!material) throw new Error("겉재료를 선택하세요.");
  if ((board.bindingType === "roundLeather" && materialKey === "fabric") ||
      (board.bindingType !== "roundLeather" && materialKey !== "fabric")) {
    throw new Error("제본 유형과 겉재료가 일치하지 않습니다.");
  }
  const turnIn = input.turnIn === undefined ? material.turnIn : nonnegativeNumber(input.turnIn, "안쪽 턴인 목표");
  const edgeWrapAllowance = input.edgeWrapAllowance === undefined ? RULES.edgeWrapAllowance : nonnegativeNumber(input.edgeWrapAllowance, "엣지 회전 여유");
  const totalSideAllowance = turnIn + edgeWrapAllowance;
  const caseWidth = board.coverWidth * 2 + board.spineWidth + board.hingeGap * 2;
  const cuttingWidth = caseWidth + totalSideAllowance * 2;
  // 두 보드의 세로가 수동 편집으로 다르면 긴 쪽을 기준으로 안전하게 재단합니다.
  const cuttingHeight = Math.max(board.coverHeight, board.spineHeight) + totalSideAllowance * 2;
  return {
    material: material.label, turnIn, edgeWrapAllowance, totalSideAllowance, caseWidth, cuttingWidth, cuttingHeight,
    displayWidth: Math.ceil(cuttingWidth - 1e-9),
    displayHeight: Math.ceil(cuttingHeight - 1e-9),
  };
}
