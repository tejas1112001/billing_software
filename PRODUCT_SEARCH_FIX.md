# Product Search Fix

## Issue Identified

The product search was not working because of **improper Prisma query structure** when combining search with other filters.

### The Problem

**Before (Broken):**
```typescript
const where: Record<string, unknown> = {};

if (search) {
  where.OR = [...]; // OR at top level
}
if (brandId) where.brandId = brandId; // Direct property
if (categoryId) where.categoryId = categoryId; // Direct property
```

This created an **invalid Prisma query structure**:
```javascript
{
  OR: [...],        // Can't mix OR and direct properties
  brandId: "...",   // at the same level!
  categoryId: "..." 
}
```

### The Solution

**After (Fixed):**
```typescript
const where: Record<string, unknown> = {};
const andConditions: Array<Record<string, unknown>> = [];

// Add all filters as AND conditions
if (brandId) andConditions.push({ brandId });
if (categoryId) andConditions.push({ categoryId });
if (search) {
  andConditions.push({
    OR: [
      { modelName: { contains: search, mode: 'insensitive' } },
      { brand: { name: { contains: search, mode: 'insensitive' } } },
      { category: { name: { contains: search, mode: 'insensitive' } } },
    ],
  });
}

if (andConditions.length > 0) {
  where.AND = andConditions;
}
```

This creates a **proper Prisma query**:
```javascript
{
  AND: [
    { brandId: "..." },
    { categoryId: "..." },
    {
      OR: [
        { modelName: { contains: "search", mode: 'insensitive' } },
        { brand: { name: { contains: "search", mode: 'insensitive' } } },
        { category: { name: { contains: "search", mode: 'insensitive' } } }
      ]
    }
  ]
}
```

---

## How It Works Now

### Example Queries

#### 1. Search Only (No Filters)
**Input:** Search = "Samsung"

**Query:**
```sql
WHERE (
  modelName ILIKE '%Samsung%' OR 
  brand.name ILIKE '%Samsung%' OR 
  category.name ILIKE '%Samsung%'
)
```

**Results:** All products with "Samsung" in name, brand, or category

---

#### 2. Search + Brand Filter
**Input:** Search = "Galaxy", Brand = "Samsung"

**Query:**
```sql
WHERE 
  brandId = 'samsung-id'
  AND (
    modelName ILIKE '%Galaxy%' OR 
    brand.name ILIKE '%Galaxy%' OR 
    category.name ILIKE '%Galaxy%'
  )
```

**Results:** Only Samsung products with "Galaxy" in name/brand/category

---

#### 3. Search + Stock Filter
**Input:** Search = "Phone", In Stock = true

**Query:**
```sql
WHERE 
  availableQty > 0
  AND (
    modelName ILIKE '%Phone%' OR 
    brand.name ILIKE '%Phone%' OR 
    category.name ILIKE '%Phone%'
  )
```

**Results:** Only in-stock products with "Phone" in name/brand/category

---

## Testing the Fix

### Backend is Already Running
Your backend server is already running on port 4000. You just need to:

1. **Refresh your browser** (or the frontend will auto-reload)
2. **Try searching for products**

### Test Cases

#### Test 1: Search by Product Name
1. Go to billing page or products page
2. Type a product name (e.g., "Galaxy A51")
3. ✅ Should show matching products

#### Test 2: Search by Brand
1. Type a brand name (e.g., "Samsung")
2. ✅ Should show all Samsung products

#### Test 3: Search by Category
1. Type a category name (e.g., "Phone")
2. ✅ Should show all products in Phone category

#### Test 4: Search + Filter
1. Select a brand from dropdown (e.g., "Apple")
2. Type in search box (e.g., "Pro")
3. ✅ Should show only Apple products with "Pro"

#### Test 5: Case Insensitive
1. Type in lowercase (e.g., "samsung")
2. ✅ Should match "Samsung" products

---

## What Was Changed

**File:** `apps/backend/src/modules/products/products.service.ts`

**Changes:**
1. ✅ Proper query structure using `AND` array
2. ✅ Search `OR` conditions nested inside `AND`
3. ✅ All filters work together correctly
4. ✅ Maintains case-insensitive search
5. ✅ Maintains multi-field search (name, brand, category)

---

## Why It Failed Before

Prisma doesn't allow mixing:
- `OR` array at top level
- Direct property filters at top level

You must either:
- Use all direct properties, OR
- Wrap everything in `AND` array

We chose the `AND` array approach for flexibility.

---

## Query Examples (Generated SQL)

### Before (Broken)
```sql
-- This would fail or give unexpected results
SELECT * FROM products 
WHERE (
  modelName ILIKE '%search%' OR 
  brand.name ILIKE '%search%'
) 
brandId = 'xxx'  -- Invalid SQL!
```

### After (Fixed)
```sql
-- This works correctly
SELECT * FROM products 
WHERE 
  brandId = 'xxx' 
  AND (
    modelName ILIKE '%search%' OR 
    brand.name ILIKE '%search%' OR
    category.name ILIKE '%search%'
  )
```

---

## Status

✅ **Backend code fixed**  
✅ **Backend compiled successfully**  
✅ **Backend server running**  
✅ **Frontend should work now**

## Next Steps

1. **Refresh your browser**
2. **Try the search functionality**
3. If still not working, check:
   - Browser console for errors (F12)
   - Network tab for API call responses
   - Backend server logs

---

## Additional Notes

- The fix ensures search works with or without filters
- Multiple filters can be combined
- Search is still case-insensitive
- Search still checks product name, brand name, and category name
- Performance is maintained (database indexes still work)

---

**Fix Applied:** ✅ Complete  
**Backend Status:** ✅ Running  
**Ready to Test:** ✅ Yes
