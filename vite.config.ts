import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import checker from 'vite-plugin-checker';

export default defineConfig({
  build: {
    outDir: 'extensions/radmin/dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: true,
    cssCodeSplit: true,
    
    rollupOptions: {
      input: {
        tables: path.resolve(__dirname, 'src/ts/index.ts'),
        styles: path.resolve(__dirname, 'src/styles/styles.scss'),
      },
      output: {
        entryFileNames: '[name].min.js',
        chunkFileNames: '[name].min.js',
        assetFileNames: (assetInfo) => {
          // CSS files use .min.css extension
          if (assetInfo.name?.endsWith('.css')) {
            return '[name].min.css';
          }
          return '[name].[ext]';
        },
      },
    },
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['node_modules'],
      },
    },
  },
  
  resolve: {
    extensions: ['.ts', '.js', '.css', '.scss'],
  },
  
  plugins: [
    checker({
      typescript: true, // This enables TypeScript checking
    }),
    copyFilesPlugin([
      {
        src: path.resolve(__dirname, 'src/ts/configs/radmin-column-config.ts'),
        dest: path.resolve(__dirname, 'extensions/radmin/src/configs/radmin-column-config.ts'),
      },
      {
        src: path.resolve(__dirname, 'src/ts/configs/radmin-table-config.ts'),
        dest: path.resolve(__dirname, 'extensions/radmin/src/configs/radmin-table-config.ts'),
      },
      {
        src: path.resolve(__dirname, 'src/ts/customizers/table-customizer.ts'),
        dest: path.resolve(__dirname, 'extensions/radmin/src/customizers/table-customizer.ts'),
      },
    ]),
  ],
});



/**
 * Plugin to copy specific TypeScript files to the extension directory.
 * Works in both build and watch mode.
 */
function copyFilesPlugin(filesToCopy: { src: string; dest: string }[]) {
  const copyFile = (src: string, dest: string) => {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${path.basename(src)} -> ${path.relative(__dirname, dest)}`);
  };

  const copyAllFiles = () => {
    filesToCopy.forEach(({ src, dest }) => copyFile(src, dest));
  };

  return {
    name: 'copy-files-watch',
    
    buildStart() {
      // Copy all files at the start of the build
      copyAllFiles();
      
      // Register files for watch mode
      filesToCopy.forEach(({ src }) => this.addWatchFile(src));
    },
    
    watchChange(id: string) {
      // Handle file changes in watch mode
      const normalizedId = path.resolve(id);
      const fileConfig = filesToCopy.find(f => f.src === normalizedId);
      
      if (fileConfig) {
        copyFile(fileConfig.src, fileConfig.dest);
      }
    },
  };
}