### Prerequisites

- Node.js (v14 or above)
- pnpm (Fast, disk space efficient package manager)

To run the project:

```
pnpm i
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm dev
```

Open your browser and navigate to http://localhost:4000/graphql
