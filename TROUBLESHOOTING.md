# Troubleshooting Internal Server Error

## Common Causes

### 1. Missing DATABASE_URL

If you see an internal server error, the most likely cause is that the `DATABASE_URL` environment variable is not set.

**Solution:**
1. Create a `.env` file in the `forge` directory
2. Add the following:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/forge?schema=public"
   NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Replace the connection string with your actual PostgreSQL credentials

### 2. Database Not Created

Even if `DATABASE_URL` is set, the database might not exist yet.

**Solution:**
1. Create a PostgreSQL database named `forge` (or whatever name you used in DATABASE_URL)
2. Run: `npx prisma db push` to create the tables

### 3. Database Connection Failed

If the database exists but connection fails, check:
- PostgreSQL is running
- Credentials in DATABASE_URL are correct
- Database name exists
- Port (default 5432) is correct

### 4. Prisma Client Not Generated

If you see Prisma-related errors:
```bash
npx prisma generate
```

Then restart the dev server.

### 5. Check Server Logs

Look at the terminal where `npm run dev` is running. The actual error message will be shown there, which will help identify the specific issue.

## Quick Setup Checklist

- [ ] `.env` file exists with `DATABASE_URL`
- [ ] PostgreSQL is installed and running
- [ ] Database `forge` (or your chosen name) exists
- [ ] `npx prisma generate` has been run
- [ ] `npx prisma db push` has been run (to create tables)
- [ ] `npm run db:seed` has been run (optional, for initial users)
- [ ] Dev server has been restarted after Prisma generate

## Testing Database Connection

You can test if Prisma can connect by running:
```bash
npx prisma db pull
```

If this works, your connection is fine.


