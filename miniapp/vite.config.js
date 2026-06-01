import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

export default defineConfig({
  plugins: [uni()],
  css: {
    preprocessorOptions: {
      scss: {
        // uni-app 内置 css 插件仍走 sass.render()，待上游迁移前静默 legacy-js-api
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
});
