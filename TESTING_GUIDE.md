# Admin Panel Testing Guide

## 🧪 How to Test the New Features

This guide helps you verify all the improvements made to the admin panel.

---

## Prerequisites

1. **Start the Backend Server**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Start the Frontend Server**
   ```bash
   cd apps/frontend
   npm run dev
   ```

3. **Login as Admin**
   - Navigate to `http://localhost:5173` (or your frontend URL)
   - Login with an admin account

---

## 🧪 Test Scenarios

### 1. Test "Back to Admin Panel" Buttons

**Steps:**
1. Navigate to `/admin` (Admin Panel dashboard)
2. Click on each module card (Brands, Categories, Stores, etc.)
3. Verify a "Back to Admin Panel" button appears at the top
4. Click the back button
5. Verify you're redirected to `/admin`

**Expected Result:**
✅ All 7 admin pages show the back button  
✅ Button navigates back to admin dashboard  
✅ Button has ArrowLeft icon and proper styling

---

### 2. Test Products DELETE Operation

#### Test Case 2.1: Delete Unused Product

**Steps:**
1. Navigate to `/admin/products`
2. Create a new test product (if needed)
3. Click the delete icon (trash) on a product that has NOT been used in any orders
4. Confirm deletion in the dialog
5. Verify success toast appears
6. Verify product is removed from the list

**Expected Result:**
✅ Product is deleted successfully  
✅ Success toast: "Product deleted"  
✅ Table refreshes automatically

#### Test Case 2.2: Try to Delete Product Used in Orders

**Steps:**
1. Navigate to `/admin/products`
2. Click the delete icon on a product that HAS been used in orders
3. Confirm deletion in the dialog
4. Verify error toast appears

**Expected Result:**
✅ Deletion fails  
✅ Error toast: "Cannot delete product that has been used in orders"  
✅ Product remains in the list

---

### 3. Test Users DELETE Operation

#### Test Case 3.1: Delete User Without Transaction History

**Steps:**
1. Navigate to `/admin/users`
2. Create a new test user (if needed)
3. Click the delete icon (trash) on a user that has NOT created any orders/receipts
4. Confirm deletion in the dialog
5. Verify success toast appears
6. Verify user is removed from the list

**Expected Result:**
✅ User is deleted successfully  
✅ Success toast: "User deleted"  
✅ Table refreshes automatically

#### Test Case 3.2: Try to Delete User With Transaction History

**Steps:**
1. Navigate to `/admin/users`
2. Click the delete icon on a user that HAS created orders or receipts
3. Confirm deletion in the dialog
4. Verify error toast appears

**Expected Result:**
✅ Deletion fails  
✅ Error toast: "Cannot delete user who has created orders/receipts. Consider deactivating instead."  
✅ User remains in the list

#### Test Case 3.3: Try to Delete Your Own Account

**Steps:**
1. Navigate to `/admin/users`
2. Find your own user account in the list
3. Click the delete icon on your account
4. Confirm deletion in the dialog
5. Verify error toast appears

**Expected Result:**
✅ Deletion fails  
✅ Error toast: "Cannot delete your own account"  
✅ User remains in the list

---

### 4. Test Existing DELETE Operations

#### Test Brands DELETE

**Steps:**
1. Navigate to `/admin/brands`
2. Verify delete icon appears in actions column
3. Click delete on an unused brand
4. Confirm deletion
5. Verify success

**Expected Result:**
✅ Brand deleted successfully  
✅ Error if brand has categories

#### Test Categories DELETE

**Steps:**
1. Navigate to `/admin/categories`
2. Verify delete icon appears in actions column
3. Click delete on an unused category
4. Confirm deletion
5. Verify success

**Expected Result:**
✅ Category deleted successfully  
✅ Error if category has products

#### Test Stores DELETE

**Steps:**
1. Navigate to `/admin/stores`
2. Verify delete icon appears in actions column
3. Click delete on an unused store
4. Confirm deletion
5. Verify success

**Expected Result:**
✅ Store deleted successfully  
✅ Error if store has orders

#### Test Payment Methods "DELETE" (Deactivate)

**Steps:**
1. Navigate to `/admin/payment-methods`
2. Verify trash icon appears for active methods
3. Click trash icon to deactivate
4. Verify badge changes to "Inactive"
5. Click power icon to reactivate
6. Verify badge changes to "Active"

**Expected Result:**
✅ Payment method toggles between active/inactive  
✅ Badges update accordingly

---

### 5. Test Mobile Responsiveness

#### Test Case 5.1: Responsive Navigation

**Steps:**
1. Resize browser to mobile width (< 768px)
2. Navigate to admin dashboard
3. Verify sidebar collapses to hamburger menu
4. Click hamburger to open drawer
5. Navigate to different modules

**Expected Result:**
✅ Sidebar hidden on mobile  
✅ Hamburger menu works  
✅ Drawer overlay displays properly

#### Test Case 5.2: Responsive Tables

**Steps:**
1. Resize browser to mobile width
2. Navigate to any admin list page
3. Verify table scrolls horizontally
4. Verify action buttons are touch-friendly
5. Test pagination controls

**Expected Result:**
✅ Table scrolls without breaking layout  
✅ Buttons have adequate touch targets  
✅ Pagination remains functional

#### Test Case 5.3: Responsive Forms

**Steps:**
1. Resize browser to mobile width
2. Open any create/edit dialog
3. Verify form fits within screen
4. Verify form scrolls if needed
5. Test form submission

**Expected Result:**
✅ Dialog fits mobile screen  
✅ Form fields stack vertically  
✅ Submit button remains accessible  
✅ Scroll works inside dialog

#### Test Case 5.4: Responsive Filters (User Logs)

**Steps:**
1. Resize browser to mobile width
2. Navigate to `/admin/user-logs`
3. Verify filter button appears (Sheet/Drawer)
4. Click to open filters
5. Apply filters
6. Resize to desktop width
7. Verify inline filter cards appear

**Expected Result:**
✅ Mobile: Sheet/Drawer for filters  
✅ Desktop: Inline filter cards  
✅ Filters work in both modes

---

### 6. Test Pagination

#### Test Case 6.1: Page Navigation

**Steps:**
1. Navigate to any paginated list (e.g., `/admin/products`)
2. Verify "Showing X–Y of Z results" appears
3. Click "Next" button
4. Verify page increments and data changes
5. Click "Previous" button
6. Verify page decrements

**Expected Result:**
✅ Page numbers update correctly  
✅ Data refreshes on page change  
✅ Previous/Next buttons disable at boundaries

#### Test Case 6.2: Page Size Change

**Steps:**
1. Navigate to any paginated list
2. Click page size dropdown
3. Select different size (e.g., 20)
4. Verify page resets to 1
5. Verify correct number of items display

**Expected Result:**
✅ Page size changes  
✅ Resets to page 1  
✅ Displays correct number of items

---

### 7. Test Search Functionality

#### Test Brands Search

**Steps:**
1. Navigate to `/admin/brands`
2. Type in search box
3. Wait for debounce (500ms)
4. Verify results filter
5. Clear search
6. Verify full list returns

**Expected Result:**
✅ Results filter as you type  
✅ Debounce prevents excessive requests  
✅ Clearing search shows all results

#### Test Products Search

**Steps:**
1. Navigate to `/admin/products`
2. Type product name in search box
3. Verify results filter
4. Test with partial matches

**Expected Result:**
✅ Products filter by model name  
✅ Case-insensitive search works

---

### 8. Test Form Validation

#### Test Required Fields

**Steps:**
1. Open any create/edit dialog
2. Leave required fields empty
3. Click "Save"
4. Verify inline error messages appear
5. Fill required fields
6. Verify errors clear

**Expected Result:**
✅ Validation prevents submission  
✅ Error messages display inline  
✅ Errors clear when fixed

#### Test Field Constraints

**Steps:**
1. Open product form
2. Enter negative MRP
3. Try to submit
4. Verify validation error
5. Enter positive MRP
6. Verify error clears

**Expected Result:**
✅ Validation rules enforce constraints  
✅ Custom error messages display

---

### 9. Test Image Upload

#### Test Image Upload (Brands/Categories/Products)

**Steps:**
1. Open create/edit dialog for Brand, Category, or Product
2. Click image upload area
3. Select an image file (JPG/PNG)
4. Verify preview appears
5. Submit form
6. Verify image saved and displays in table

**Expected Result:**
✅ Image preview shows before upload  
✅ Image uploads successfully  
✅ Thumbnail displays in table

#### Test Image Removal

**Steps:**
1. Edit item with existing image
2. Click X to remove image
3. Submit form
4. Verify image removed

**Expected Result:**
✅ Image can be removed  
✅ Falls back to icon placeholder

---

### 10. Test Authorization

#### Test Admin-Only Operations

**Steps:**
1. Logout admin account
2. Login as OPERATOR account
3. Try to access `/admin` routes
4. Verify redirect or unauthorized message

**Expected Result:**
✅ Operators cannot access admin routes  
✅ DELETE operations blocked for non-admins

---

## 🐛 Common Issues & Solutions

### Issue: Delete button not appearing

**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Verify you're logged in as ADMIN

### Issue: "Cannot delete" errors

**Solution:**
- This is expected behavior for items with dependencies
- Check if product has orders
- Check if user has created transactions
- Consider using "deactivate" instead

### Issue: Back button not working

**Solution:**
- Verify you're using React Router's `Link` component
- Check browser console for routing errors
- Ensure routes are properly configured

### Issue: Mobile layout broken

**Solution:**
- Check Tailwind breakpoints (sm:, md:, lg:)
- Verify responsive classes are applied
- Test with browser dev tools mobile view

---

## ✅ Final Verification Checklist

- [ ] All 7 admin pages have back buttons
- [ ] Products DELETE works (with validation)
- [ ] Users DELETE works (with safety checks)
- [ ] Brands DELETE works
- [ ] Categories DELETE works
- [ ] Stores DELETE works
- [ ] Payment Methods toggle works
- [ ] Mobile responsive on all pages
- [ ] Pagination works on all list pages
- [ ] Search works on Brands and Products
- [ ] Forms validate properly
- [ ] Image upload works
- [ ] Authorization blocks non-admins
- [ ] Error messages are clear and helpful
- [ ] Success toasts appear after actions
- [ ] Loading states display during async operations

---

## 🎯 Performance Testing

### Test Page Load Times

1. Open browser DevTools Network tab
2. Navigate to each admin page
3. Verify initial load < 2 seconds
4. Verify subsequent loads < 500ms (cached)

### Test Table Performance

1. Navigate to products page with 100+ items
2. Verify smooth scrolling
3. Test pagination responsiveness
4. Verify no UI lag during interactions

---

## 📊 Test Results Template

Use this template to document your testing:

```
Date: [YYYY-MM-DD]
Tester: [Your Name]
Environment: [Development/Staging/Production]

| Feature | Status | Notes |
|---------|--------|-------|
| Back Buttons | ✅ / ❌ | |
| Products DELETE | ✅ / ❌ | |
| Users DELETE | ✅ / ❌ | |
| Mobile Responsive | ✅ / ❌ | |
| Pagination | ✅ / ❌ | |
| Search | ✅ / ❌ | |
| Image Upload | ✅ / ❌ | |
| Authorization | ✅ / ❌ | |

Issues Found:
1. [Issue description]
2. [Issue description]

Overall Status: ✅ PASS / ❌ FAIL
```

---

## 🚀 Automated Testing

For future CI/CD integration, consider:

1. **Unit Tests**
   - Test service methods
   - Test validation schemas
   - Test utility functions

2. **Integration Tests**
   - Test API endpoints
   - Test database operations
   - Test authorization middleware

3. **E2E Tests**
   - Use Playwright or Cypress
   - Test complete user flows
   - Test mobile responsive breakpoints

---

## 📞 Support

If you encounter any issues during testing:

1. Check the browser console for errors
2. Review the `ADMIN_PANEL_IMPROVEMENTS.md` documentation
3. Verify all backend and frontend servers are running
4. Check database connections
5. Review the code changes in the relevant module

Happy Testing! 🎉
