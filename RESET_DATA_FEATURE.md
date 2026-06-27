# Reset All Data Feature

## Overview
Added a "Reset All Data" feature accessible only to Admin users in the Admin Panel. This feature allows admins to reset/truncate all database tables except the User table.

## Implementation Details

### Backend Changes

#### New Files Created:
1. **`apps/backend/src/modules/admin/admin.routes.ts`**
   - Defines POST endpoint `/api/admin/reset-data`
   - Protected by `authenticate` and `authorize(['ADMIN'])` middleware
   - Only accessible to users with ADMIN role

2. **`apps/backend/src/modules/admin/admin.controller.ts`**
   - Controller handling the reset data request
   - Returns success/error messages

3. **`apps/backend/src/modules/admin/admin.service.ts`**
   - Contains `resetAllData()` function
   - Deletes data in correct order to respect foreign key constraints
   - Preserves User table data
   - Reuses the same logic as the existing `prisma/reset.ts` script

#### Modified Files:
- **`apps/backend/src/app.ts`**
  - Added import for `adminRouter`
  - Registered `/api/admin` route

### Frontend Changes

#### New Files Created:
1. **`apps/frontend/src/pages/admin/ResetDataPage.tsx`**
   - Complete UI for resetting data
   - Features:
     - Warning alerts showing what will be deleted
     - Two-step confirmation process
     - Requires typing "RESET" to confirm
     - Loading state during reset operation
     - Success/error toast notifications
     - Cancel option

#### Modified Files:
1. **`apps/frontend/src/App.tsx`**
   - Added lazy import for `ResetDataPage`
   - Added route `/admin/reset-data` (protected by AdminRoute)

2. **`apps/frontend/src/pages/admin/AdminIndexPage.tsx`**
   - Added "Reset Data" card with Trash2 icon
   - Links to `/admin/reset-data`
   - Styled with red color to indicate danger

## Security Features

1. **Backend Protection:**
   - Requires authentication (valid JWT token)
   - Requires ADMIN role authorization
   - Only accessible via `/api/admin/reset-data` endpoint

2. **Frontend Protection:**
   - Route wrapped in `<AdminRoute />` component
   - Only visible in Admin Panel (not accessible to operators)
   - Two-step confirmation process
   - Requires exact text match ("RESET") to proceed

3. **User Data Preservation:**
   - User table is never touched
   - All user accounts, credentials, and roles remain intact
   - Users can log back in immediately after reset

## Data Deletion Order
The following tables are cleared in this order (respecting foreign key constraints):

1. UserLog
2. LedgerEntry
3. OpeningBalance
4. OrderItem
5. Order
6. Receipt
7. PaymentMethod
8. Product
9. Category
10. Brand
11. Store

## Usage

### For Admins:
1. Log in with an ADMIN account
2. Navigate to Admin Panel
3. Click on "Reset Data" card
4. Review the warning about what will be deleted
5. Click "Reset All Data" button
6. Type "RESET" in the confirmation field
7. Click "Confirm Reset"
8. Wait for success confirmation

### API Endpoint:
```bash
POST /api/admin/reset-data
Authorization: Bearer <admin-jwt-token>

Response (Success):
{
  "success": true,
  "message": "All data reset successfully (User table preserved)"
}
```

## Testing Checklist

- [ ] Only ADMIN users can see the "Reset Data" option
- [ ] OPERATOR users cannot access `/admin/reset-data` route
- [ ] Confirmation text must match "RESET" exactly
- [ ] Loading state shows during reset operation
- [ ] Success toast appears after successful reset
- [ ] Error toast appears if reset fails
- [ ] User table data remains intact after reset
- [ ] All other tables are empty after reset
- [ ] Users can still log in after reset
- [ ] Cancel button works correctly
- [ ] API returns 401 for unauthenticated requests
- [ ] API returns 403 for non-admin users

## Notes

- This feature reuses the existing reset logic from `prisma/reset.ts`
- No changes were made to other functionality
- The reset is permanent and cannot be undone
- Consider creating a database backup before using this feature in production
