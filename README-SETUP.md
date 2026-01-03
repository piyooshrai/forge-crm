# Forge CRM - Setup Instructions

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

   Required packages:
   - `prisma` (dev dependency)
   - `@prisma/client`
   - `@auth/prisma-adapter`
   - `next-auth@beta`
   - `bcryptjs`
   - `@types/bcryptjs`
   - `tsx` (for seed script)

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/forge?schema=public"
   NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Set up the database:**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed the database with initial users
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Default Users

After seeding, you can log in with:

- **Super Admin:** `admin@forge.com` / `password123`
- **Sales Rep 1:** `sales1@forge.com` / `password123`
- **Sales Rep 2:** `sales2@forge.com` / `password123`
- **Marketing Rep:** `marketing@forge.com` / `password123`

## Role Permissions

### SUPER_ADMIN
- Full access to all features
- Can access Settings page
- Can create/edit/delete everything

### SALES_REP
- Can create/edit Deals
- Can manage pipeline stages
- Can mark deals as Closed Won/Lost
- Can add line items, activities, tasks to deals
- Can view all leads (read-only)

### MARKETING_REP
- Can create/edit Leads
- Can add notes/activities/tasks on leads
- Can convert leads to deals
- **Cannot** mark deals as Closed Won/Lost
- **Cannot** create/edit deals directly (except via lead conversion)

## Features

- **Dashboard:** Overview with KPIs, charts, and recent activity
- **Leads:** List, create, detail view with activities and tasks
- **Deals:** List view, Kanban view, detail with line items
- **Products:** Full CRUD for product catalog
- **Settings:** Super Admin only (stub)

## Database Schema

The Prisma schema includes:
- User (with roles)
- Lead
- Deal/Opportunity
- Product
- DealLineItem
- Activity (notes, calls, meetings)
- Task

## Next Steps

1. Set up your PostgreSQL database
2. Install dependencies
3. Run database migrations and seed
4. Start the dev server
5. Log in and start using Forge CRM!


