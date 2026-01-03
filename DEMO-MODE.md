# Demo Mode - No Database Required

The app is now configured to work **without a database** for UI demonstration purposes.

## Login Credentials

**Email:** `demo@forge.com`  
**Password:** `demo123`

This is a fake user that doesn't require any database connection.

## What Works

✅ **Login page** - Use the credentials above  
✅ **Dashboard** - Shows mock data and charts  
✅ **Leads page** - Shows 3 sample leads  
✅ **Deals page** - Shows 3 sample deals (List and Kanban views)  
✅ **Products page** - Shows 3 sample products  
✅ **Settings page** - Accessible (Super Admin)  
✅ **Reports page** - Stub page  

## What Doesn't Work (Expected)

❌ Creating new leads/deals/products (requires API/database)  
❌ Viewing detail pages (requires database)  
❌ Editing data (requires API/database)  
❌ Saving changes (requires API/database)  

## To Use Real Database Later

When you're ready to connect to a real database:

1. Set up PostgreSQL
2. Create `.env` file with real `DATABASE_URL`
3. Run `npx prisma db push`
4. Run `npm run db:seed`
5. Revert the changes in:
   - `src/lib/auth.ts` (use real Prisma queries)
   - `src/app/(dashboard)/layout.tsx` (restore auth check)
   - `src/middleware.ts` (restore auth check)
   - All page files (restore Prisma queries)

## Current Status

The app is in **demo mode** - perfect for viewing the UI and design without any backend setup!


