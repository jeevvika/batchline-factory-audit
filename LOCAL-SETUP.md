# Run Batchline locally in VS Code

Batchline is a React/Vite app with an Express backend. **Do not use the VS Code “Live Server” extension**; it serves files as static HTML and cannot compile the TSX app. Use the Vite development server instead.

## Quick start (demo mode)

1. Unzip the project and open the extracted `batchline` folder in VS Code.
2. Install Node.js 20 or newer. Enable pnpm 10.18 if needed: `corepack enable` then `corepack prepare pnpm@10.18.0 --activate`.
3. Open VS Code Terminal at the project root and run:

   ```bash
   pnpm install
   pnpm dev
   ```

4. Open `http://localhost:3000` in your browser. The benchmark UI runs without a database and keeps its demo state in that browser's local storage.

## Optional managed database

To persist the shared sample workspace, provide a MySQL-compatible `DATABASE_URL` in your local shell environment, then run:

```bash
pnpm db:migrate
pnpm seed:benchmark
pnpm dev
```

Do not put real customer or factory data in the public synthetic benchmark workspace. The starter Manus OAuth button also needs the Manus project environment/configuration; it is not required to explore the sample UI locally.

## Useful commands

```bash
pnpm check   # TypeScript
pnpm test    # Unit tests
pnpm build   # Production build
```
