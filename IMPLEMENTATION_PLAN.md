# Product Pricing Enhancement - Implementation Plan

## Overview
Complete restructure of product pricing to support cash/credit pricing differentiation, purchase price tracking, and new arrival features.

## Current vs Target State

### Current
- **Product fields**: MRP, NLC, availableQty
- **Pricing**: Single NLC price for all users
- **User types**: CASH and CREDIT operators (no price difference)
- **Profit**: Calculated using MRP-NLC spread

### Target
- **Product fields**: MRP, cashPrice, creditPrice, purchasePrice, availableQty (renamed to Qty), isNewArrival
- **Pricing**: Cash users see cashPrice, Credit users see creditPrice
- **User types**: CASH operators use cashPrice, CREDIT operators use creditPrice
- **Purchase price**: Admin-only, used for actual profit calculations
- **New Arrival**: Badge display for newly added products

## Implementation Phases

### Phase 1: Database Schema Migration ✓
**Files to modify:**
- `apps/backend/prisma/schema.prisma`
- Create migration script

**Changes:**
```prisma
model Product {
  // Remove: nlc Decimal
  // Add:
  cashPrice Decimal @db.Decimal(12, 2)
  creditPrice Decimal @db.Decimal(12, 2)
  purchasePrice Decimal? @db.Decimal(12, 2) // nullable, admin only
  isNewArrival Boolean @default(false)
  // Rename: availableQty → qty (keep column name for backward compatibility)
}
```

**Migration strategy:**
- Copy existing NLC → cashPrice
- Copy existing NLC → creditPrice
- Set purchasePrice = null initially
- Set isNewArrival = false for existing products

---

### Phase 2: Backend Service Updates

#### 2.1 Product Service
**File**: `apps/backend/src/modules/products/products.service.ts`
- Update `list()` - return new fields, filter isNewArrival
- Update `create()` - accept cashPrice, creditPrice, purchasePrice, isNewArrival
- Update `update()` - handle new fields
- Update sorting (currently by NLC → sort by cashPrice or creditPrice)

#### 2.2 Order Service  
**File**: `apps/backend/src/modules/orders/orders.service.ts`
- **CRITICAL**: Get user's operatorType
- Use `product.cashPrice` if operatorType === 'CASH'
- Use `product.creditPrice` if operatorType === 'CREDIT'
- Update OrderItem.unitPrice accordingly
- Update lineTotal calculation

#### 2.3 Ledger Service
**File**: `apps/backend/src/modules/ledger/ledger.service.ts`
- Already uses OrderItem.unitPrice (no change needed)
- Verify calculations still work correctly

#### 2.4 Dashboard Controller
**File**: `apps/backend/src/modules/dashboard/dashboard.controller.ts`
- Update profit calculations to use purchasePrice
- Ensure cash vs credit sales use correct prices from orderItems
- Update reports:
  - Cash/Credit Report: verify operator-based aggregation
  - Profit Report: `profit = unitPrice - purchasePrice` (not MRP-NLC)
  - Purchase Quantity Report: no price changes needed

#### 2.5 PDF Generator
**File**: `apps/backend/src/utils/pdfGenerator.ts`
- Update `generateBillPdf()`:
  - Add product image column in table
  - Use OrderItem.unitPrice (already correct)
  - Never show purchasePrice
  - Modernize layout (already modern, enhance if needed)
- Update `generateLedgerPdf()` - no changes
- Update `generateStockReportPdf()`:
  - Show cashPrice and creditPrice columns
  - Hide purchasePrice (or show only if admin report)

---

### Phase 3: Frontend Updates

#### 3.1 Product Forms
**Files**:
- `apps/frontend/src/pages/admin/ProductsPage.tsx`
- `apps/frontend/src/components/common/ProductForm.tsx` (if exists)

**Changes:**
- Replace NLC input with:
  - Cash Price input
  - Credit Price input
  - Purchase Price input (admin only, optional)
- Add "New Arrival" checkbox
- Update validation schema
- Update API calls

#### 3.2 Billing Page
**File**: `apps/frontend/src/pages/billing/GenerateBillPage.tsx`

**Changes:**
- Get current user's operatorType from authStore
- Filter products to show correct price:
  - CASH user: display cashPrice, hide creditPrice/purchasePrice
  - CREDIT user: display creditPrice, hide cashPrice/purchasePrice
  - ADMIN: show all prices (if admin can bill)
- Update product card display (MRP strikethrough, correct price)
- Update cart calculation
- Add NEW badge for isNewArrival products

#### 3.3 Product Cards & Listings
**Files**:
- `apps/frontend/src/components/common/ProductCard.tsx` (if exists)
- Any component displaying products

**Changes:**
- Show user-appropriate price based on operatorType
- Add NEW badge indicator for isNewArrival
- Style badge as visually appealing overlay

#### 3.4 Receipt Generation
**File**: `apps/frontend/src/pages/receipts/GenerateReceiptPage.tsx`
- No changes needed (already user-aware, uses stored order amounts)

#### 3.5 Ledger Page
**File**: `apps/frontend/src/pages/ledger/LedgerPage.tsx`
- Verify displays correct amounts from OrderItems
- No code changes expected (uses stored unitPrice)

#### 3.6 Dashboard
**File**: `apps/frontend/src/pages/dashboard/AdminDashboard.tsx`
- Update KPI displays if needed
- Verify cash vs credit segregation
- Update report displays for new profit calculations

---

### Phase 4: Bill & Receipt Redesign

#### 4.1 Bill PDF Enhancement
**Enhancements**:
- Add product thumbnail images in table
- Improve spacing and typography (already done)
- Ensure MRP shown as reference, selling price used
- Print-friendly design (already modern)

#### 4.2 Receipt Improvements
- Review receipt PDF structure
- Ensure clean, professional design
- Include payment method details

---

### Phase 5: API Type Definitions

**File**: `apps/frontend/src/types/index.ts` (or similar)
- Update Product interface:
```typescript
interface Product {
  id: string;
  modelName: string;
  imageUrl?: string;
  mrp: number;
  cashPrice: number;      // new
  creditPrice: number;    // new
  purchasePrice?: number; // new, optional
  availableQty: number;   // or rename to qty
  isNewArrival: boolean;  // new
  brandId: string;
  categoryId: string;
  brand?: Brand;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}
```

---

### Phase 6: Testing Checklist

#### Database & Backend
- [ ] Migration runs successfully
- [ ] Existing products migrated with NLC → cashPrice & creditPrice
- [ ] Product CRUD operations work with new fields
- [ ] Bills generated use correct price per user type
- [ ] Ledger calculations accurate
- [ ] Dashboard KPIs calculate correctly
- [ ] Reports show correct profit using purchasePrice
- [ ] PDFs generate without errors

#### Frontend
- [ ] Product add/edit forms work
- [ ] Cash user sees only cashPrice
- [ ] Credit user sees only creditPrice
- [ ] Admin sees all prices
- [ ] NEW badge displays correctly
- [ ] Bill generation uses correct prices
- [ ] Cart calculations accurate
- [ ] Ledger displays correctly
- [ ] Dashboard renders correctly

#### Edge Cases
- [ ] Backward compatibility with old orders
- [ ] Null purchasePrice handled gracefully
- [ ] Search and filters work
- [ ] Sorting by price works
- [ ] Excel exports work
- [ ] PDF downloads work

---

## Risk Mitigation

### Data Loss Prevention
- Backup database before migration
- Test migration on copy first
- Keep NLC column temporarily (comment out in schema but don't drop)

### Rollback Plan
- Document current state
- Keep migration reversible
- Have rollback SQL ready

### User Impact
- Schedule during low-traffic time
- Communicate changes to users
- Provide training on new fields
- Document price field meanings

---

## Deployment Steps

1. **Pre-deployment**
   - Backup production database
   - Test migration on staging
   - Prepare rollback scripts

2. **Deployment**
   - Put app in maintenance mode
   - Run Prisma migration
   - Deploy backend code
   - Deploy frontend code
   - Verify migration success
   - Remove maintenance mode

3. **Post-deployment**
   - Verify existing bills still accessible
   - Test new bill creation (both user types)
   - Monitor error logs
   - Check dashboard accuracy
   - Validate reports

4. **Cleanup** (after 1-2 weeks)
   - Remove old NLC column (if safe)
   - Archive old code
   - Update documentation

---

## Files Modified Summary

### Backend
- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/` (new migration)
- `apps/backend/src/modules/products/products.service.ts`
- `apps/backend/src/modules/products/products.controller.ts` (if validation changes)
- `apps/backend/src/modules/orders/orders.service.ts`
- `apps/backend/src/modules/dashboard/dashboard.controller.ts`
- `apps/backend/src/utils/pdfGenerator.ts`
- `apps/backend/src/utils/excelGenerator.ts` (if exists)

### Frontend
- `apps/frontend/src/types/index.ts`
- `apps/frontend/src/pages/admin/ProductsPage.tsx`
- `apps/frontend/src/pages/billing/GenerateBillPage.tsx`
- `apps/frontend/src/pages/dashboard/AdminDashboard.tsx`
- `apps/frontend/src/components/common/ProductCard.tsx` (if exists)
- `apps/frontend/src/components/common/ImageThumbnail.tsx` (for NEW badge)
- `apps/frontend/src/services/productService.ts`
- `apps/frontend/src/stores/authStore.ts` (verify operatorType accessible)

---

## Timeline Estimate
- Phase 1 (DB): 1 hour
- Phase 2 (Backend): 3-4 hours
- Phase 3 (Frontend): 4-5 hours
- Phase 4 (PDF): 2 hours
- Phase 5 (Types): 1 hour
- Phase 6 (Testing): 3-4 hours
- **Total**: 14-17 hours

---

## Success Criteria
✓ All existing functionality preserved
✓ Cash users see and use cash prices
✓ Credit users see and use credit prices
✓ Purchase price tracked (admin only)
✓ New Arrival badges display
✓ Bills generate correctly per user type
✓ Receipts work as before
✓ Ledger calculations accurate
✓ Dashboard shows correct KPIs
✓ Reports calculate real profit
✓ PDFs modern and professional
✓ No data loss
✓ All tests pass
