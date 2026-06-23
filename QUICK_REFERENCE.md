# Quick Reference Guide - Admin Panel

## 🚀 Quick Start

### Access Admin Panel
1. Login as admin user
2. Navigate to `/admin`
3. Click on any module card

### Navigate Back
Click "← Back to Admin Panel" button at top of any admin page

---

## 📋 Module Quick Reference

### 1. Brands (`/admin/brands`)
```
Actions: CREATE | READ | UPDATE | DELETE
Features: Image upload, Search, Pagination
```

### 2. Categories (`/admin/categories`)
```
Actions: CREATE | READ | UPDATE | DELETE
Features: Image upload, Brand filter, Pagination
```

### 3. Stores (`/admin/stores`)
```
Actions: CREATE | READ | UPDATE | DELETE
Features: Full contact info, Pagination
```

### 4. Products (`/admin/products`)
```
Actions: CREATE | READ | UPDATE | DELETE ← NEW
Features: Image upload, Search, Pagination
```

### 5. Users (`/admin/users`)
```
Actions: CREATE | READ | UPDATE | DELETE ← NEW
Features: Role management, Password reset, Status toggle
```

### 6. Payment Methods (`/admin/payment-methods`)
```
Actions: CREATE | READ | UPDATE | SOFT DELETE
Features: Active/Inactive toggle
```

### 7. Audit Logs (`/admin/user-logs`)
```
Actions: READ ONLY
Features: Action filter, Date range filter, Pagination
```

### 8. Ledgers (`/ledger`)
```
Actions: READ | UPDATE (opening balance)
Features: Store filter, Export PDF/Excel
```

---

## 🎯 Common Actions

### Create New Item
1. Click "+ Add [Item]" button
2. Fill required fields
3. Upload image (if applicable)
4. Click "Save"

### Edit Existing Item
1. Click ✏️ (Edit icon) in actions column
2. Modify fields
3. Click "Save"

### Delete Item
1. Click 🗑️ (Delete icon) in actions column
2. Confirm deletion in dialog
3. Item removed (or error shown if blocked)

### Search/Filter
1. Type in search box (Products, Brands)
2. Use filter dropdowns (Audit Logs)
3. Results update automatically

---

## ⚠️ Delete Safety Rules

### Products
```
✅ Can delete: Unused products
❌ Cannot delete: Products in orders
💡 Error: "Cannot delete product that has been used in orders"
```

### Users
```
✅ Can delete: Users without transaction history
❌ Cannot delete: 
   - Your own account
   - Users who created orders
   - Users who created receipts
💡 Alternative: Deactivate user instead
```

### Other Modules
```
❌ Cannot delete: Items with foreign key dependencies
💡 Error messages indicate specific constraints
```

---

## 🎨 Icon Legend

| Icon | Action | Found In |
|------|--------|----------|
| ✏️ | Edit | All modules |
| 🗑️ | Delete | All modules |
| 🔑 | Reset Password | Users only |
| 🔄 | Activate | Payment Methods |
| ➕ | Add New | All modules |
| 🔍 | Search | Products, Brands |
| 📄 | Export | Ledgers |

---

## 📱 Mobile Tips

### Navigation
- Tap ☰ (hamburger) to open menu
- Swipe tables horizontally to scroll
- Tap "← Back to Admin Panel" to return

### Forms
- Forms stack vertically on mobile
- Dialogs are full-screen
- Submit button always at bottom

### Filters
- Mobile: Tap "Filters" button → Sheet opens
- Desktop: Inline filter cards

---

## 🔐 Permissions

### ADMIN Role
```
✅ Full access to all modules
✅ Create, Read, Update, Delete
✅ Manage users
✅ View audit logs
✅ Edit opening balances
```

### OPERATOR Role
```
✅ Create bills/receipts
✅ View products
✅ View stores
❌ No admin panel access
❌ Cannot manage users
❌ Cannot view audit logs
```

---

## 🆘 Troubleshooting

### "Cannot delete" errors
**Cause:** Item has dependencies  
**Solution:** Check relationships or use deactivate

### Delete button missing
**Cause:** Not logged in as admin  
**Solution:** Verify admin role

### Back button not working
**Cause:** Browser navigation issue  
**Solution:** Hard refresh (Ctrl+Shift+R)

### Image upload fails
**Cause:** File size or format issue  
**Solution:** Use JPG/PNG under 5MB

### Form validation errors
**Cause:** Required fields missing  
**Solution:** Fill all red-marked fields

---

## 💡 Pro Tips

1. **Use Search**: Products and Brands have search - save time!
2. **Page Size**: Adjust items per page (10, 20, 50, 100)
3. **Deactivate vs Delete**: Deactivate users instead of deleting
4. **Audit Trail**: Check logs for user activity
5. **Export Ledgers**: Use PDF/Excel for records
6. **Mobile Layout**: Rotate device for better table view
7. **Keyboard**: Press ESC to close dialogs

---

## 📊 Status Badges

### Users
- 🟢 Active - User can login
- 🔴 Inactive - User cannot login

### Roles
- 🔵 ADMIN - Full access
- 🟡 OPERATOR - Limited access

### Operator Types
- 💵 CASH - Cash transactions
- 💳 CREDIT - Credit transactions

### Product Stock
- 🟢 High stock (≥5 items)
- 🟠 Low stock (<5 items)

### Payment Methods
- ✅ Active - Available for use
- ❌ Inactive - Not available

---

## 🔄 Workflow Examples

### Add a New Product
```
1. Admin Panel → Products
2. Click "+ Add Product"
3. Enter model name
4. Select brand
5. Select category (filtered by brand)
6. Upload image
7. Enter MRP, NLC, Quantity
8. Click "Save"
9. Success! Product appears in list
```

### Create an Operator
```
1. Admin Panel → Users
2. Click "+ Add User"
3. Enter username
4. Enter password
5. Select "Operator" role
6. Select operator type (CASH/CREDIT)
7. Click "Create"
8. Success! User can now login
```

### Delete Unused Category
```
1. Admin Panel → Categories
2. Find category with no products
3. Click 🗑️ (Delete icon)
4. Confirm deletion
5. Success! Category removed
```

---

## 📈 Performance Tips

### Load Times
- First load: ~2 seconds
- Subsequent: <500ms (cached)

### Best Practices
- Use pagination (don't load all items)
- Use search to find specific items
- Close dialogs when done
- Refresh only when needed

---

## 🗝️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ESC | Close dialog/drawer |
| Enter | Submit form (when focused) |
| Tab | Navigate form fields |
| Space | Toggle checkboxes/switches |

---

## 📞 Getting Help

### Documentation Files
1. `ADMIN_PANEL_IMPROVEMENTS.md` - Technical details
2. `TESTING_GUIDE.md` - Test scenarios
3. `IMPLEMENTATION_SUMMARY.md` - Overview
4. `ADMIN_PANEL_STRUCTURE.md` - Architecture
5. `CHANGELOG.md` - Version history
6. `QUICK_REFERENCE.md` - This file

### Check First
- Browser console for errors
- Network tab for failed requests
- User role and permissions
- Database connectivity

---

## ✅ Daily Admin Checklist

### Morning Routine
- [ ] Check audit logs for overnight activity
- [ ] Review low stock products
- [ ] Verify active users
- [ ] Check ledger balances

### Regular Maintenance
- [ ] Update product quantities
- [ ] Add new products as needed
- [ ] Create operator accounts for new staff
- [ ] Deactivate departed staff accounts
- [ ] Review payment methods

### End of Day
- [ ] Export ledgers for records
- [ ] Review audit logs for unusual activity
- [ ] Check for low stock alerts

---

## 🎯 Common Scenarios

### Scenario 1: New Product Launch
```
1. Create brand (if new)
2. Create category (if new)
3. Add product with details
4. Upload product image
5. Set pricing and stock
6. Verify in products list
```

### Scenario 2: Staff Onboarding
```
1. Create user account
2. Set role (OPERATOR)
3. Set operator type
4. Provide username/password
5. Verify user can login
```

### Scenario 3: Product Discontinuation
```
Option A (Has orders):
1. Set quantity to 0
2. Or hide from active listing

Option B (No orders):
1. Click delete
2. Confirm removal
3. Product permanently deleted
```

### Scenario 4: Staff Departure
```
Do NOT delete user (preserves history)

Instead:
1. Edit user
2. Toggle "Active" to OFF
3. User cannot login
4. History preserved
```

---

## 📊 Data Entry Tips

### Products
- Model name: Clear, searchable
- Images: High quality, well-lit
- Pricing: Double-check before saving
- Quantity: Accurate stock counts

### Users
- Usernames: Lowercase, no spaces
- Passwords: Minimum 6 characters
- Types: Match role (CASH/CREDIT)

### Stores
- Complete all contact fields
- Verify mobile/email format
- Use consistent city names

---

## 🎉 Quick Wins

### Time Savers
1. Use search instead of scrolling
2. Increase page size for bulk review
3. Keep dialogs open for multiple edits
4. Use back button instead of browser back
5. Bookmark `/admin` for quick access

### Efficiency
- Batch create similar items
- Use consistent naming conventions
- Take advantage of filters
- Export data for reports
- Review audit logs weekly

---

## 🔮 Advanced Features

### Audit Logs
- Filter by action type
- Date range selection
- User activity tracking
- Detailed metadata

### Ledgers
- Per-store tracking
- Opening balance control
- Running balance calculation
- Export to PDF/Excel

### User Management
- Role-based access
- Operator type assignment
- Password reset capability
- Active status control

---

## 📝 Quick Commands

### Navigation
```
/admin                  → Admin dashboard
/admin/brands          → Brands management
/admin/categories      → Categories management
/admin/stores          → Stores management
/admin/products        → Products management
/admin/users           → Users management
/admin/payment-methods → Payment methods
/admin/user-logs       → Audit logs
/ledger                → Ledger view
```

---

## 🎓 Training Resources

### For New Admins
1. Read IMPLEMENTATION_SUMMARY.md
2. Review this quick reference
3. Practice in test environment
4. Follow workflow examples

### For Operators
- Focus on bill/receipt creation
- No admin access needed
- Limited product viewing

---

## ⭐ Remember

✅ **Deactivate users** instead of deleting  
✅ **Check audit logs** regularly  
✅ **Use back buttons** for navigation  
✅ **Verify before deleting** - action is permanent  
✅ **Keep stock updated** for accuracy  
✅ **Review mobile view** for on-the-go access  

---

_Version: 1.1.0 | Last Updated: 2024-01-15_

**Quick Links:**
- [Technical Docs](./ADMIN_PANEL_IMPROVEMENTS.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Architecture](./ADMIN_PANEL_STRUCTURE.md)
- [Changelog](./CHANGELOG.md)
