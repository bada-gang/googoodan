/**
 * 선생님 화면 진입점. 학생 게임(main.tsx)과 별도 페이지다. (명세 73)
 * Phaser 도 게임 스토어도 여기서는 불러오지 않는다.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initRepositories } from '@/data';
import { TeacherApp } from './TeacherApp';
import '@/styles/teacher.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root 를 찾을 수 없습니다.');

// 저장소가 준비된 뒤에 그린다 — 서버 저장인지 이 기기 저장인지 화면에 표시해야 한다.
void initRepositories().finally(() => {
  createRoot(container).render(
    <StrictMode>
      <TeacherApp />
    </StrictMode>,
  );
});
