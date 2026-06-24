# Login Troubleshooting Guide

## Issue: "Login failed. Please try again." with Correct Credentials

### Possible Causes & Solutions

---

## 1. ✅ Backend Server Not Running

**Symptom:** Generic "Login failed" error or "Cannot connect to server" message

**Solution:**
```bash
# Navigate to backend directory
cd apps/backend

# Start the backend development server
npm run dev
```

The backend should start on `http://localhost:4000`

**Verification:**
- Check terminal for "Server running on port 4000" message
- Open browser to `http://localhost:4000/api` - you should see an error or response (not "connection refused")

---

## 2. ✅ Database Not Connected

**Symptom:** Backend starts but crashes when trying to login

**Solution:**
```bash
cd apps/backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database with initial data
npm run prisma:seed
```

---

## 3. ✅ Frontend Not Running

**Solution:**
```bash
# Navigate to frontend directory
cd apps/frontend

# Start the frontend development server
npm run dev
```

The frontend should start on `http://localhost:5173` (or the port shown in terminal)

---

## 4. ✅ Validation Error (Enhanced Validators)

**Symptom:** Getting validation errors even with valid credentials

**Check These Requirements:**
- Username: minimum 3 characters, maximum 50 characters
- Password: minimum 6 characters

**Default Admin Credentials:**
- Username: `admin`
- Password: `Admin@123`

Both meet the validation requirements ✓

---

## 5. ✅ Browser Network/CORS Issues

**Check:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for error messages when clicking "Sign in"

**Common Errors:**
- `Network Error` → Backend not running
- `CORS error` → Backend CORS not configured properly
- `401 Unauthorized` → Wrong credentials or user doesn't exist
- `422 Unprocessable Entity` → Validation failed

---

## 6. ✅ Check Actual Error Message

With the updated error handling, you should now see more specific error messages:

- **"Cannot connect to server..."** → Backend not running (Solution #1)
- **"Invalid username or password"** → Wrong credentials or user not in database
- **"Account is disabled"** → User account is inactive
- **"Username must be at least 3 characters"** → Validation failed
- **"Password must be at least 6 characters"** → Validation failed

---

## Quick Start Checklist

Run these commands in order:

### Terminal 1 - Backend
```bash
cd apps/backend
npm run dev
```

Wait for: `"Server running on port 4000"` or similar message

### Terminal 2 - Frontend  
```bash
cd apps/frontend
npm run dev
```

Wait for: `"Local: http://localhost:5173"` or similar message

### Test Login
1. Open browser to frontend URL (e.g., http://localhost:5173)
2. Go to login page
3. Enter credentials:
   - Username: `admin`
   - Password: `Admin@123`
4. Click "Sign in"

---

## Verifying Database Has Admin User

```bash
cd apps/backend

# Open Prisma Studio to view database
npx prisma studio
```

This opens a browser interface where you can:
1. Click on "User" table
2. Verify "admin" user exists
3. Check `isActive` is `true`

---

## Emergency Fix: Reset Everything

If nothing works, try resetting:

```bash
cd apps/backend

# Reset database and reseed
npm run prisma:reset

# Regenerate Prisma client
npm run prisma:generate

# Start server
npm run dev
```

---

## Still Not Working?

Check these files for configuration issues:

1. **Backend .env file** (`apps/backend/.env`):
   ```env
   DATABASE_URL="postgresql://..."
   JWT_SECRET="your-secret-key"
   JWT_REFRESH_SECRET="your-refresh-secret"
   PORT=4000
   NODE_ENV=development
   ```

2. **Frontend .env file** (if exists):
   ```env
   VITE_API_BASE_URL=http://localhost:4000/api
   ```

3. **Check browser console** (F12) for actual error messages

---

## Updated Error Handling

The login page now shows more helpful error messages:
- Network errors specifically mention backend connection
- Validation errors show which field is invalid
- Server errors pass through the actual message

Open browser DevTools → Console tab to see detailed error logs when signing in.
