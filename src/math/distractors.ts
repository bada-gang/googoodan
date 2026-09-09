/**
 * 오답 선택지 생성. 무작위 숫자를 쓰지 않고 학생이 실제로 혼동할 만한
 * 인접 곱셈 결과를 우선한다. (명세 16)
 */

/** 배열을 제자리에서 섞는다. */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * left × right 의 곱에 대한 혼동 후보들.
 * 예) 6 × 7 = 42 -> 36(6×6), 48(6×8), 49(7×7), 35(5×7)
 */
export function productDistractorPool(left: number, right: number): number[] {
  const product = left * right;

  // 1순위: 실제 곱셈에서 나오는 값들. 학생이 옆 칸의 답과 헷갈리는 경우다.
  const multiplicationErrors = [
    left * (right - 1),
    left * (right + 1),
    (left - 1) * right,
    (left + 1) * right,
    right * right,
    left * left,
    (left + 1) * (right - 1),
    (left - 1) * (right + 1),
    left + right, // 곱셈 대신 덧셈을 한 경우
  ];

  // 2순위: 자릿수를 잘못 센 경우. 후보가 모자랄 때만 쓴다.
  const nearMisses = [product + 1, product - 1, product + 2, product - 2];

  const seen = new Set<number>([product]);
  const collect = (values: number[]): number[] => {
    const kept: number[] = [];
    for (const value of values) {
      if (value <= 0 || value > 100 || seen.has(value)) continue;
      seen.add(value);
      kept.push(value);
    }
    // 정답에 가까운 값일수록 헷갈리기 쉬우므로 앞쪽에 둔다.
    return kept.sort((a, b) => Math.abs(a - product) - Math.abs(b - product));
  };

  return [...collect(multiplicationErrors), ...collect(nearMisses)];
}

/**
 * 빈칸형("3 × ? = 12")의 오답 후보. 답은 1~9 범위의 곱하는 수이므로
 * 인접한 수를 후보로 쓴다.
 */
export function factorDistractorPool(answer: number): number[] {
  const pool: number[] = [];
  for (const delta of [1, -1, 2, -2, 3, -3]) {
    const value = answer + delta;
    if (value >= 1 && value <= 9 && !pool.includes(value)) pool.push(value);
  }
  return pool;
}

/**
 * 정답 1개 + 오답 3개를 만들어 무작위 순서로 돌려준다. (명세 15)
 */
export function buildChoices(correct: number, pool: number[], count = 4): number[] {
  const choices = new Set<number>([correct]);
  // 가까운 후보 중에서 고르되 매번 같은 3개만 나오지 않도록 상위 후보를 섞는다.
  const near = shuffle(pool.slice(0, Math.max(count + 1, 5)));
  const rest = pool.slice(Math.max(count + 1, 5));
  for (const value of [...near, ...rest]) {
    if (choices.size >= count) break;
    choices.add(value);
  }
  // 후보가 모자라면 정답 주변 값으로 채운다.
  let fill = 1;
  while (choices.size < count) {
    const candidate = correct + fill;
    if (candidate > 0) choices.add(candidate);
    fill += 1;
  }
  return shuffle([...choices]);
}
