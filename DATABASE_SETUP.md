# Database Setup Guide - phpMyAdmin Visibility Issue Fixed

## Problem Found ❌

The database schema was **incomplete**. The `schema.sql` file was missing the critical `users` and `projets` tables, which is why phpMyAdmin couldn't display any database structure.

### Missing Tables:
- ❌ `users` table (for authentication)
- ❌ `projets` table (for project management)
- ✅ `requests` table (print requests)
- ✅ `request_items` table (print items)

## Solution Applied ✅

### 1. **Updated `schema.sql`**
   - Added complete `users` table with fields: id, name, email, password, profile, created_at
   - Added complete `projets` table with fields: id, intitule, unite, created_at
   - Properly indexed all tables for performance

### 2. **Created `setup-db.js` Script**
   - Automated database initialization
   - Creates database if it doesn't exist
   - Creates all 4 tables from schema.sql
   - Verifies table creation
   - Provides helpful status messages

### 3. **Updated `package.json`**
   - Added `npm run setup-db` command to initialize database
   - Added `npm run migrate` command for data migration

## How to Use ✨

### First Time Setup:

```bash
# 1. Make sure MySQL is running on your machine
#    Default: localhost, user: root, password: root

# 2. Install dependencies
npm install

# 3. Initialize the database
npm run setup-db

# 4. (Optional) Migrate existing data from data.json
npm run migrate

# 5. Start the server
npm start
```

### Expected Output from `setup-db`:
```
🔄 Setting up database...

📌 Connecting to MySQL server at localhost...
✅ Connected to MySQL server

🏗️ Creating database and tables...
✅ Database and tables created/verified

🔍 Verifying tables...
  ✅ Table 'users' exists
  ✅ Table 'projets' exists
  ✅ Table 'requests' exists
  ✅ Table 'request_items' exists

✨ Database setup completed successfully!
```

## Viewing in phpMyAdmin 🔍

After running `npm run setup-db`:

1. **Open phpMyAdmin**: `http://localhost/phpmyadmin` (or your phpMyAdmin URL)
2. **Select Database**: Click on `print_request_db` in the left sidebar
3. **View Tables**: You should now see all 4 tables:
   - 📋 `users` - Contains user accounts
   - 🏗️ `projets` - Contains print projects
   - 📄 `requests` - Contains print requests
   - 📋 `request_items` - Contains print job items

## Environment Variables

Make sure your `.env` file has:

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=print_request_db
PORT=3000
```

## Troubleshooting 🔧

### MySQL Connection Error
- Ensure MySQL server is running
- Check credentials in `.env` file
- Verify MySQL port (usually 3306)

### Tables Still Not Showing in phpMyAdmin
- Refresh phpMyAdmin (Ctrl+F5 or Cmd+Shift+R)
- Restart MySQL service
- Run `npm run setup-db` again

### Migration Issues
- Ensure `data.json` exists in project root
- Check MySQL connection is active
- Verify database was created successfully first

## Changes Made to Repository

### Files Modified:
- ✏️ `schema.sql` - Added users and projets table definitions
- ✏️ `package.json` - Added setup-db and migrate scripts

### Files Created:
- ✨ `setup-db.js` - Database initialization script
- 📄 `DATABASE_SETUP.md` - This guide

### Commits:
- Merged to `master` branch
- All changes committed with clear messages

## Next Steps

1. Run database setup: `npm run setup-db`
2. Verify tables in phpMyAdmin
3. (Optional) Migrate existing data: `npm run migrate`
4. Start developing! `npm start`

---

**All database visibility issues are now resolved!** ✅
