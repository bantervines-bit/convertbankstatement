import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
})
```

4. Click **Commit changes** → **Commit changes**

### 3.3 Create .gitignore

1. Click **Add file** → **Create new file**
2. File name: `.gitignore`
3. Paste this:
```
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
