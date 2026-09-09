import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // tsconfig 의 paths 와 같은 별칭. '/src' 는 프로젝트 루트 기준으로 해석된다.
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      // 학생 게임과 선생님 화면은 별도 페이지다. (명세 73)
      // 이렇게 나눠야 학생 번들에 교사 화면이 섞이지 않고, 교사 화면에 Phaser 가 안 실린다.
      input: {
        main: 'index.html',
        teacher: 'teacher.html',
      },
      output: {
        // Phaser 는 큰 라이브러리라 별도 청크로 분리해 첫 화면을 빠르게 띄운다.
        manualChunks(id: string) {
          if (id.includes('node_modules/phaser')) return 'phaser';
          return undefined;
        },
      },
    },
  },
});
