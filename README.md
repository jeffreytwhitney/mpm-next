This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Documentation

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick performance decision tree and cheat sheet
- **[PERFORMANCE_SUMMARY.md](PERFORMANCE_SUMMARY.md)** - Overview of Prisma vs SQL Server performance
- **[DATABASE_PERFORMANCE_GUIDE.md](DATABASE_PERFORMANCE_GUIDE.md)** - Deep dive into optimization strategies
- **[PERFORMANCE_OPTIMIZATION_CHECKLIST.md](PERFORMANCE_OPTIMIZATION_CHECKLIST.md)** - Step-by-step improvements
- **[PRISMA_SETUP.md](PRISMA_SETUP.md)** - Prisma configuration and setup guide
- **[TANSTACK_SETUP.md](TANSTACK_SETUP.md)** - TanStack Table setup guide

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Auth Foundation

The app currently keeps page viewing public. Authentication is only being added as groundwork for future create/update flows.

- JWT-backed session cookie utilities live in `src/lib/auth/session.ts`
- Login/logout handlers live in `src/server/data/auth.ts`
- Route-scoped Server Action entrypoints live under `src/app/**/_actions` and delegate to `src/server/data/*`
- User-type/permission helpers live in `src/lib/auth/permissions.ts`

Current permission mapping based on `tblUser.UserTypeID`:

- `1` Metrology Programmer: full programming-task rights, service-ticket rights, can create tickets, can add tasks to tickets
- `2` Metrology Calibration Technician: service-ticket rights only
- `3` Quality Engineer: can create tickets and add tasks to tickets
- `4` Manufacturing Engineer: no mutation rights currently
- `5` Cell Leader: no mutation rights currently

Admin override rule:

- `tblUser.IsAdmin` only grants admin override when `tblUser.UserTypeID` is `1` or `2`
- If `IsAdmin` is set for any other user type, it is ignored for permission elevation

Generate a bcrypt password hash from the terminal with:

```bash
npm run password:hash -- Aw3s0me5auc3
```

Run the focused auth tests with:

```bash
npx jest tests/lib/auth/permissions.test.ts tests/lib/auth/session.test.ts tests/app/data/auth.test.ts --runInBand
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
