## Project structure

- `apps/frontend`: Next.js App Router customer and staff interfaces
- `apps/backend`: Express, MongoDB, JWT, and Socket.IO API
- `docs`: project report and supporting diagrams
- `.github/workflows/ci.yml`: checks for every push and pull request
- `render.yaml`: two-service Render deployment blueprint

## Local setup

Requirements: Node.js 20+, pnpm 9+, and MongoDB.

1. Copy `apps/backend/.env.example` to `apps/backend/.env`.
2. Copy `apps/frontend/.env.example` to `apps/frontend/.env.local`.
3. Run `pnpm install`.
4. Run `pnpm dev`.
5. Open `http://localhost:3000`.

Optional: run `pnpm --filter backend seed` to create five sample restaurants, five categories, at least five menu items per restaurant, and these repeatable demo accounts:

- Customer: `user@gmail.com` / `123456`
- Staff: `admin@foodflow.com` / `admin`
