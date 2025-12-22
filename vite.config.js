import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts'; // 生成类型声明文件

export default defineConfig({
  // 根目录
  root: process.cwd(),

  // 构建配置
  build: {
    target: 'esnext', // 构建目标
    minify: false, // 是否压缩
    sourcemap: false, // 输出 sourcemap
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // 库入口文件
      name: 'TimerTrigger', // UMD 模式下的全局变量名
      fileName: (format) => `timer-trigger.${format}.js`, // 输出文件名
      formats: ['es', 'umd'], // 输出格式
    },
    rollupOptions: {
      // 外部依赖，不打包进库
      external: ['vue', 'lodash'],
      output: {
        // 全局变量名映射，用于 UMD 构建
        globals: {
          vue: 'Vue',
          lodash: '_',
        },
        // 让 cjs 构建也能生成命名导出
        exports: 'named',
      },
    },
  },

  plugins: [
    dts({
      insertTypesEntry: true, // 在 package.json 中添加 types 字段
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
