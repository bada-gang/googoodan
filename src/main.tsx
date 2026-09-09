import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadArtManifest } from '@/config/artReady';
import { initRepositories } from '@/data';
import { App } from './App';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root 를 찾을 수 없습니다.');

// 아트 매니페스트와 저장소(서버 또는 이 기기)를 먼저 준비한다.
// 둘 다 실패해도 게임은 뜬다.
void Promise.all([loadArtManifest(), initRepositories()]).finally(() => {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
