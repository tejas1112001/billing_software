# Mobile Features Guide - Advanced Reports

## 📱 How to Use Reports on Mobile

### Navigation

#### 🔙 Back Button
**Location:** Top-left corner of every report page

**Mobile View:**
```
[←]  Report Title
     Description text
```

**Desktop View:**
```
[← Back]  Report Title
          Description text
```

**Action:** Tap to return to Admin Dashboard

---

### Filters

#### 📂 Collapsible Filter Panel

**How to Use:**
1. **Tap the "Filters" header** to expand/collapse on mobile
2. Chevron icon (▼) rotates to indicate state
3. Filters are always expanded on desktop

**Mobile - Collapsed:**
```
┌─────────────────────────┐
│ 🔽 Filters          ▼  │
└─────────────────────────┘
```

**Mobile - Expanded:**
```
┌─────────────────────────┐
│ 🔽 Filters          ▲  │
├─────────────────────────┤
│ Start Date              │
│ [dd/mm/yyyy]           │
│                         │
│ End Date                │
│ [dd/mm/yyyy]           │
│                         │
│ Brand                   │
│ [All Brands        ▼]  │
│                         │
│ Category                │
│ [All Categories    ▼]  │
│                         │
│ Store                   │
│ [All Stores        ▼]  │
│                         │
│ [Reset Filters]         │
└─────────────────────────┘
```

---

### Summary Cards

#### 💳 Responsive Card Grid

**Mobile (Portrait):**
```
┌─────────┐ ┌─────────┐
│ Card 1  │ │ Card 2  │
└─────────┘ └─────────┘
┌─────────┐ ┌─────────┐
│ Card 3  │ │ Card 4  │
└─────────┘ └─────────┘
```

**Tablet (Landscape):**
```
┌─────┐ ┌─────┐ ┌─────┐
│ Cd1 │ │ Cd2 │ │ Cd3 │
└─────┘ └─────┘ └─────┘
```

**Desktop:**
```
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│C1 │ │C2 │ │C3 │ │C4 │ │C5 │
└───┘ └───┘ └───┘ └───┘ └───┘
```

---

### Data Tables

#### 📊 Progressive Disclosure

Tables show different columns based on screen size:

##### Purchase Quantity Report

**Mobile (< 640px):**
```
┌──┬────────────────┬────────┐
│# │ Product        │ Qty    │
│  │ Brand          │        │
├──┼────────────────┼────────┤
│1 │ iPhone 15 Pro  │ 25     │
│  │ Apple          │        │
└──┴────────────────┴────────┘
       ← Swipe to scroll →
```
*Note: Brand shown as sub-text*

**Tablet (≥ 640px):**
```
┌──┬────────────────┬─────────┬────────┐
│# │ Product        │ Brand   │ Qty    │
├──┼────────────────┼─────────┼────────┤
│1 │ iPhone 15 Pro  │ Apple   │ 25     │
└──┴────────────────┴─────────┴────────┘
```

**Desktop (≥ 768px):**
```
┌──┬────────────────┬─────────┬──────────┬────────┐
│# │ Product        │ Brand   │ Category │ Qty    │
├──┼────────────────┼─────────┼──────────┼────────┤
│1 │ iPhone 15 Pro  │ Apple   │ Phone    │ 25     │
└──┴────────────────┴─────────┴──────────┴────────┘
```

##### Profit Report

**Mobile (< 640px):**
```
┌──┬───────────────┬──────────┬──────────┐
│# │ Product       │ Sales    │ Profit   │
│  │ Brand         │          │          │
├──┼───────────────┼──────────┼──────────┤
│1 │ iPhone 15 Pro │ ₹50,000  │ ₹5,000   │
│  │ Apple         │          │          │
└──┴───────────────┴──────────┴──────────┘
```
*Note: Brand shown as sub-text, swipe for more*

**Tablet (≥ 640px):**
```
┌──┬───────────┬────────┬────────┬────────┐
│# │ Product   │ Sales  │ Cost   │ Profit │
├──┼───────────┼────────┼────────┼────────┤
│1 │ iPhone... │₹50,000 │₹45,000 │₹5,000  │
└──┴───────────┴────────┴────────┴────────┘
```

**Desktop (≥ 1024px):**
```
┌──┬──────────┬───────┬──────┬────┬──────┬──────┬───────┬────────┐
│# │ Product  │ Brand │ Cat  │Qty │Sales │ Cost │Profit │Margin% │
├──┼──────────┼───────┼──────┼────┼──────┼──────┼───────┼────────┤
│1 │ iPhone.. │ Apple │Phone │ 5  │50000 │45000 │ 5000  │ 10.0%  │
└──┴──────────┴───────┴──────┴────┴──────┴──────┴───────┴────────┘
```

---

### Pagination

#### ◀️ ▶️ Navigation Controls

**Mobile:**
```
Page 1 of 5 (100 items)
    [◀]        [▶]
```
*Note: "Previous" and "Next" text hidden*

**Desktop:**
```
Page 1 of 5 (100 items)
  [◀ Previous]  [Next ▶]
```

---

## 🎯 Touch Targets

All interactive elements meet minimum touch target size:

✅ **Buttons:** 44x44px minimum  
✅ **Links:** Adequate padding  
✅ **Inputs:** Easy to tap  
✅ **Dropdowns:** Full-width on mobile  

---

## 💡 Mobile Tips

### 1. **Landscape Mode**
Rotate your device to landscape mode to see more table columns

### 2. **Horizontal Scroll**
Tables scroll horizontally - swipe left/right to see hidden columns

### 3. **Collapsible Filters**
Tap the filter header to hide filters and see more data

### 4. **Pinch to Zoom**
If text is too small, use pinch-to-zoom gesture

### 5. **Back Button**
Always visible at the top-left for easy navigation

---

## 📐 Responsive Breakpoints

| Device | Width | Columns Shown |
|--------|-------|---------------|
| Small Phone | < 640px | Essential only |
| Large Phone / Small Tablet | 640px - 767px | + Some details |
| Tablet | 768px - 1023px | + More details |
| Laptop | 1024px - 1279px | + Extended info |
| Desktop | ≥ 1280px | All columns |

---

## 🎨 Visual Indicators

### Filter State
- **▼ Chevron Down:** Filters collapsed (tap to expand)
- **▲ Chevron Up:** Filters expanded (tap to collapse)

### Button States
- **Enabled:** Full color, clickable
- **Disabled:** Grayed out, not clickable
- **Loading:** Shows spinner

### Color Coding
- **Blue:** Sales, Cash, Primary metrics
- **Green:** Profit, Collected, Positive values
- **Orange/Yellow:** Cost, Warnings
- **Red:** Loss, Errors, Low margins
- **Indigo/Purple:** Margins, Secondary metrics

---

## 📱 Screen Size Examples

### iPhone SE (375px)
- 1 card per row (Summary cards)
- 2 cards per row (Profit report - optimized)
- Essential table columns only
- Collapsible filters

### iPhone Pro (390px - 430px)
- Same as iPhone SE
- Slightly more comfortable spacing

### iPad Mini (768px)
- 2-3 cards per row
- More table columns visible
- Filters always expanded

### iPad Pro (1024px)
- 3-5 cards per row (depending on report)
- Most/all table columns visible
- Desktop-like experience

---

## ⌨️ Keyboard Navigation (Tablet with keyboard)

- **Tab:** Move between fields
- **Shift + Tab:** Move backwards
- **Enter:** Submit/Apply filters
- **Space:** Toggle checkboxes
- **Arrow Keys:** Navigate select dropdowns

---

## ✨ Performance on Mobile

### Optimizations:
- ✅ Lazy loading of components
- ✅ Efficient re-renders
- ✅ Optimized bundle sizes (~10KB per report)
- ✅ Cached API responses (React Query)
- ✅ Skeleton loaders for perceived performance

### Expected Load Times:
- **First Load:** 1-2 seconds
- **Cached Load:** < 500ms
- **Filter Change:** < 300ms

---

## 🔍 Troubleshooting Mobile Issues

### Table text too small?
1. Try landscape mode
2. Use pinch-to-zoom
3. Check device accessibility settings

### Filters not showing?
1. Tap the "Filters" header to expand
2. Look for the chevron icon (▼)
3. Scroll to top of page

### Can't see all columns?
1. Swipe table left/right
2. Rotate to landscape mode
3. This is intentional - essential columns shown first

### Back button not working?
1. Ensure you're on a report page
2. Check internet connection
3. Refresh the page

---

## 🎉 Enjoy Using Reports on Mobile!

All reports are optimized for mobile use with:
- ✅ Touch-friendly controls
- ✅ Responsive layouts
- ✅ Easy navigation
- ✅ Fast performance
- ✅ Clear data presentation

**Happy Reporting! 📊📱**
