# Debugging Internal Server Error

## Step 1: Check the Terminal

**Most Important:** Look at the terminal where `npm run dev` is running. The actual error message will be displayed there in red.

## Step 2: Test Database Connection

Visit: `http://localhost:3000/api/test`

This will show you:
- If DATABASE_URL is set
- If Prisma can connect to the database
- The actual error message

## Step 3: Common Issues & Fixes

### Issue: "Can't reach database server"
**Fix:** 
1. Make sure PostgreSQL is running
2. Check your `.env` file has `DATABASE_URL` set correctly
3. Verify the database exists

### Issue: "DATABASE_URL is not set"
**Fix:**
1. Create `.env` file in the `forge` directory
2. Add: `DATABASE_URL="postgresql://user:password@localhost:5432/forge?schema=public"`

### Issue: "Table does not exist"
**Fix:**
```bash
npx prisma db push
```

### Issue: "Prisma Client not initialized"
**Fix:**
```bash
npx prisma generate
# Then restart dev server
```

## Step 4: Check Which Page is Failing

- Is it the login page? → Check NextAuth setup
- Is it the dashboard? → Check database connection
- Is it an API route? → Check the terminal for the specific error

## Step 5: Share the Error

Copy the **exact error message** from the terminal and share it. This will help identify the specific issue.


