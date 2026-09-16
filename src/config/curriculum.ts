/**
 * 무엇을 가르치는가. (명세 11)
 *
 * 연습하는 단 목록이 세 곳에 따로 적혀 있던 것을 여기로 모았다 —
 * 학생 선택 화면, 교사 화면, 연습 필요 판단.
 * 1단과 10단은 넣지 않는다. 2학년 교육과정의 곱셈구구는 2~9단이다.
 */
export const TABLES = [2, 3, 4, 5, 6, 7, 8, 9] as const;

export type Table = (typeof TABLES)[number];
