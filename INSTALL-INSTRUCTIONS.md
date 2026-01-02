# Installation Instructions

## Current Issue
The build is failing because `next-auth` and other dependencies haven't been installed yet due to disk space constraints.

## Steps to Fix

1. **Free up disk space** on your system (the error shows `ENOSPC: no space left on device`)

2. **Install dependencies:**
   ```bash
   cd forge
   npm install --legacy-peer-deps
   ```

3. **After installation, update Providers.tsx:**
   - Open `src/components/Providers.tsx`
   - Uncomment the `import { SessionProvider } from 'next-auth/react';` line
   - Replace `return <>{children}</>;` with `return <SessionProvider>{children}</SessionProvider>;`

4. **Set up environment variables:**
   Create a `.env` file in the `forge` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/forge?schema=public"
   NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
   NEXTAUTH_URL="http://localhost:3000"
   ```

5. **Set up the database:**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

6. **Start the dev server:**
   ```bash
   npm run dev
   ```

## Alternative: Install packages individually

If you continue to have disk space issues, you can try installing packages in smaller batches:

```bash
# First, install Prisma
npm install prisma @prisma/client --save-dev --save

# Then NextAuth
npm install next-auth@beta --legacy-peer-deps

# Then the rest
npm install @auth/prisma-adapter bcryptjs @types/bcryptjs tsx --legacy-peer-deps
```

## Note
The app will compile with the temporary workaround, but authentication won't work until `next-auth` is properly installed and the Providers component is updated.

