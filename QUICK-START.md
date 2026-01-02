# Quick Start Guide

## If the server won't start or connection is refused:

### 1. Check if the server is running
Look at your terminal - is there a process running on port 3000?

### 2. Kill any existing processes
```bash
# Windows PowerShell
Get-Process -Name node | Stop-Process -Force
```

### 3. Make sure you have a `.env` file
Create `.env` in the `forge` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/forge?schema=public"
NEXTAUTH_SECRET="forge-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**Important:** Even if you don't have a database set up yet, you need the `.env` file with DATABASE_URL set (it can point to a non-existent database for now).

### 4. Start the server
```bash
npm run dev
```

### 5. If it still won't start, check for errors in the terminal

Common errors:
- **Port 3000 already in use**: Kill the process or use a different port
- **Missing dependencies**: Run `npm install --legacy-peer-deps`
- **Prisma not generated**: Run `npx prisma generate`

### 6. Minimal setup (without database)
If you just want to see the UI without database:
1. Create `.env` with DATABASE_URL pointing to any PostgreSQL URL (even if it doesn't exist)
2. The app will show errors but should at least load the login page
3. You won't be able to log in until the database is set up

