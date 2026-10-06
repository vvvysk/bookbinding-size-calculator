export const RULES = Object.freeze({
  hingeGap: 7.8,
  edgeWrapAllowance: 2.7,
  materials: {
    fabric: { label: "패브릭", turnIn: 20 },
    fauxLeather: { label: "인조가죽", turnIn: 30 },
    leather: { label: "천연가죽", turnIn: 20 },
  },

  flatFabric: {
    coverWidthDelta: 0,

    spineWidthDelta: 8.5,
    square: 3.5,
    status: "잠정",
  },

  rounded: {

    spineWidthDelta: 19.0,
    square: 5.0,
    curveCompensation: {
      shallow: 1.0,
      normal: 2.0,
      deep: 3.0,
    },
    status: "잠정(책등 폭은 강한 후보)",
  },
});

export function ceilToHalf(value) {
  return Math.ceil(value * 2) / 2;
}

export function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

export function calculateBinding(input) {
  const width = Number(input.textWidth);
  const height = Number(input.textHeight);
  const thickness = Number(input.textThickness);

  if (![width, height, thickness].every(Number.isFinite)) {
    throw new Error("속지 가로·세로·두께를 숫자로 입력하세요.");
  }
  if (width <= 0 || height <= 0 || thickness <= 0) {
    throw new Error("치수는 0보다 커야 합니다.");
  }

  const defaults = input.bindingType === "flatFabric" ? RULES.flatFabric : RULES.rounded;
  const square = input.square === undefined ? defaults.square : Number(input.square);
  const hingeGap = input.hingeGap === undefined ? RULES.hingeGap : Number(input.hingeGap);
  if (input.square === "" || !Number.isFinite(square) || square < 0) {
    throw new Error("상·하 돌출량은 0 이상의 숫자로 입력하세요.");
  }
  if (input.hingeGap === "" || !Number.isFinite(hingeGap) || hingeGap <= 0) {
    throw new Error("힌지 간격은 0보다 큰 숫자로 입력하세요.");
  }

  if (input.bindingType === "flatFabric") {
    const r = RULES.flatFabric;
    const coverWidth = width + r.coverWidthDelta;
    const coverHeight = height + square * 2;
    const spineWidth = ceilToHalf(thickness + r.spineWidthDelta);

    return {
      type: "패브릭 평등",
      coverWidth,
      coverHeight,
      spineWidth,
      spineHeight: coverHeight,
      hingeGap,
      square,
      ruleSummary: [
        `커버 가로 = 속지 가로 + ${r.coverWidthDelta}mm`,
        `커버 세로 = 속지 세로 + (${formatNumber(square)}mm × 2)`,
        `책등 폭 = 속지 두께 + ${r.spineWidthDelta}mm → 0.5mm 단위 올림`,
        `힌지 = ${formatNumber(hingeGap)}mm (입력값)`,
      ],
      notice: "패브릭 커버 가로·책등 폭은 표본이 2권이라 현재 잠정 규칙입니다.",
    };
  }

  const r = RULES.rounded;
  const curve = input.curve || "normal";
  const compensation = r.curveCompensation[curve] ?? r.curveCompensation.normal;
  const coverWidth = width - compensation;
  const coverHeight = height + square * 2;
  const spineWidth = ceilToHalf(thickness + r.spineWidthDelta);

  return {
    type: "라운드",
    coverWidth,
    coverHeight,
    spineWidth,
    spineHeight: coverHeight,
    hingeGap,
    square,
    ruleSummary: [
      `커버 가로 = 속지 가로 - ${compensation}mm`,
      `커버 세로 = 속지 세로 + (${formatNumber(square)}mm × 2)`,
      `책등 폭 = 속지 두께 + ${r.spineWidthDelta}mm → 0.5mm 단위 올림`,
      `힌지 = ${formatNumber(hingeGap)}mm (입력값)`,
    ],
    notice: "라운드 책등 폭 +19mm는 현재 4권 실측의 강한 후보 규칙입니다. 계산값보다 작게 재단하지 않습니다.",
  };
}


// 원래 소수 치수는 보존하고 재단 표시값만 1mm 단위로 올립니다.
export function calculateOuterMaterial(board, input = {}) {
  const materialKey = input.material || "fabric";
  const material = RULES.materials[materialKey];
  if (!material) throw new Error("겉재료를 선택하세요.");
  const turnIn = input.turnIn === undefined
    ? material.turnIn : Number(input.turnIn);
  if (input.turnIn === "" || !Number.isFinite(turnIn) || turnIn < 0) {
    throw new Error("안쪽 턴인 목표는 0 이상의 숫자로 입력하세요.");
  }
  const edgeWrapAllowance = input.edgeWrapAllowance === undefined
    ? RULES.edgeWrapAllowance : Number(input.edgeWrapAllowance);
  if (input.edgeWrapAllowance === "" || !Number.isFinite(edgeWrapAllowance) || edgeWrapAllowance < 0) {
    throw new Error("엣지 회전 여유는 0 이상의 숫자로 입력하세요.");
  }
  const totalSideAllowance = turnIn + edgeWrapAllowance;
  const caseWidth = board.coverWidth * 2 + board.spineWidth + board.hingeGap * 2;
  const cuttingWidth = caseWidth + totalSideAllowance * 2;
  const cuttingHeight = board.coverHeight + totalSideAllowance * 2;
  return {
    material: material.label, turnIn, edgeWrapAllowance, totalSideAllowance, caseWidth, cuttingWidth, cuttingHeight,
    displayWidth: Math.ceil(cuttingWidth),
    displayHeight: Math.ceil(cuttingHeight),
  };
}
