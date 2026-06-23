# Advanced Reports Documentation

## Overview
This document describes the three new comprehensive reports added to the admin dashboard: Cash vs Credit Report, Purchase Quantity Report, and Profit Report.

---

## 1. Cash vs Credit Report

### Purpose
Analyze and compare sales distribution between cash and credit operations with detailed breakdowns and visual representations.

### Access
- **Route**: `/admin/reports/cash-credit`
- **Link**: Available from Admin Dashboard → Advanced Reports section
- **Permission**: Admin only

### Features

#### Date Filters
- **Today**: Shows today's sales (00:00:00 to 23:59:59)
- **This Month**: Shows current calendar month's sales
- **Custom Range**: Allows selection of custom start and end dates

#### KPI Cards (4)
1. **Cash Sales**
   - Total sales amount from CASH operators
   - Number of orders
   - Percentage of total sales
   
2. **Credit Sales**
   - Total sales amount from CREDIT operators
   - Number of orders
   - Percentage of total sales
   
3. **Total Sales**
   - Combined sales from all operators
   - Total number of orders
   
4. **Avg Order Value**
   - Average transaction amount (Total Sales ÷ Total Orders)

#### Visualizations

**Pie Chart - Sales Distribution**
- Shows percentage split between Cash and Credit sales
- Interactive tooltips with exact amounts
- Color coded: Blue (Cash), Green (Credit)

**Bar Chart - Sales Comparison**
- Compares Cash, Credit, and Total sales side by side
- Shows both Sales amount and Order count
- Y-axis formatted in thousands (₹Xk)

### Backend API
- **Endpoint**: `GET /dashboard/cash-credit-report`
- **Query Parameters**:
  - `filter`: 'today' | 'month' | undefined (for custom)
  - `startDate`: ISO date string (for custom range)
  - `endDate`: ISO date string (for custom range)

### Data Calculation
- Cash operators identified by `operatorType = 'CASH'`
- Credit operators identified by `operatorType = 'CREDIT'`
- Sales aggregated from `Order` table grouped by operator type
- Date filtering applied on `Order.createdAt`

---

## 2. Purchase Quantity Report

### Purpose
Track total quantities of products purchased/sold with comprehensive filtering options by product attributes, store, and date range.

### Access
- **Route**: `/admin/reports/purchase-quantity`
- **Link**: Available from Admin Dashboard → Advanced Reports section
- **Permission**: Admin only

### Features

#### Filters
- **Date Range**: Start date and end date selection
- **Brand**: Filter by specific brand
- **Category**: Filter by category (dependent on selected brand)
- **Store**: Filter by specific store location
- **Reset**: Clear all filters to default state

#### Summary Cards (3)
1. **Total Quantity**
   - Sum of all units sold across selected filters
   - Displays in localized format with comma separators
   
2. **Products**
   - Count of unique products in the result set
   
3. **Avg Quantity**
   - Average quantity per product (Total Quantity ÷ Product Count)

#### Data Table
- **Columns**:
  - # (Row number with pagination offset)
  - Product (Model name)
  - Brand
  - Category
  - Total Quantity (highlighted in primary color)
  
- **Pagination**:
  - 20 items per page
  - Previous/Next navigation
  - Page indicator showing current/total pages

### Backend API
- **Endpoint**: `GET /dashboard/purchase-quantity-report`
- **Query Parameters**:
  - `startDate`: ISO date string
  - `endDate`: ISO date string
  - `productId`: Filter by specific product
  - `categoryId`: Filter by specific category
  - `brandId`: Filter by specific brand
  - `storeId`: Filter by specific store
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)

### Data Calculation
- Aggregates `OrderItem.quantity` grouped by `productId`
- Joins with `Order` table for date and store filtering
- Joins with `Product`, `Brand`, and `Category` for display names
- Results sorted by total quantity (descending)
- Default date range: Current month if not specified

---

## 3. Profit Report

### Purpose
Analyze profit margins, total profit, and profitability by product with detailed cost and revenue breakdowns.

### Access
- **Route**: `/admin/reports/profit`
- **Link**: Available from Admin Dashboard → Advanced Reports section
- **Permission**: Admin only

### Features

#### Filters
- **Date Range**: Start date and end date selection
- **Brand**: Filter by specific brand
- **Category**: Filter by category (dependent on selected brand)
- **Store**: Filter by specific store location
- **Reset**: Clear all filters to default state

#### Summary Cards (5)
1. **Total Sales**
   - Sum of all revenue (selling price × quantity)
   
2. **Total Cost**
   - Sum of all costs (NLC/purchase price × quantity)
   
3. **Total Profit**
   - Total Sales - Total Cost
   - Highlighted in green
   
4. **Profit Margin**
   - (Total Profit ÷ Total Sales) × 100
   - Displayed as percentage
   - Highlighted in indigo
   
5. **Products**
   - Count of unique products in the result set

#### Data Table
- **Columns**:
  - # (Row number with pagination offset)
  - Product (Model name)
  - Brand
  - Category
  - Qty (Quantity sold)
  - Sales (Revenue - blue)
  - Cost (Purchase cost - orange)
  - Profit (Calculated profit - green)
  - Margin % (Profit percentage with color coding)
  
- **Profit Margin Color Coding**:
  - Green: ≥ 20% (Good margin)
  - Yellow: 10-19% (Moderate margin)
  - Red: < 10% (Low margin)
  
- **Pagination**:
  - 20 items per page
  - Previous/Next navigation
  - Results sorted by profit (highest first)

### Backend API
- **Endpoint**: `GET /dashboard/profit-report`
- **Query Parameters**:
  - `startDate`: ISO date string
  - `endDate`: ISO date string
  - `productId`: Filter by specific product
  - `categoryId`: Filter by specific category
  - `brandId`: Filter by specific brand
  - `storeId`: Filter by specific store
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)

### Data Calculation

#### Per Product Profit Formula
```
Selling Price = OrderItem.unitPrice
Cost Price = Product.nlc (Net Landed Cost)
Line Sales = OrderItem.lineTotal
Line Cost = Cost Price × OrderItem.quantity
Line Profit = Line Sales - Line Cost
```

#### Aggregation
- Groups by `productId`
- Sums quantity, sales, cost, and profit for each product
- Calculates profit margin: `(Total Profit ÷ Total Sales) × 100`

#### Overall Summary
- Aggregates all product-level data
- Provides business-wide profit metrics
- Helps identify most and least profitable products

---

## Technical Implementation

### Frontend Architecture
- **Framework**: React + TypeScript
- **UI Components**: Shadcn/ui
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts library
- **Routing**: React Router v6
- **Styling**: Tailwind CSS

### Backend Architecture
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with role-based authorization
- **Middleware**: Admin-only route protection

### Key Database Tables Used
- `Order` - Sales transactions with dates and totals
- `OrderItem` - Line items with quantities and prices
- `Product` - Product details including NLC (cost price)
- `User` - Operator information with operator type
- `Brand`, `Category`, `Store` - Filtering dimensions

### Performance Optimizations
1. **Database Indexing**
   - Indexed on `Order.createdAt` for date filtering
   - Indexed on `Order.storeId`, `Order.userId` for joins
   - Indexed on `Product.brandId`, `Product.categoryId` for filtering

2. **Query Optimization**
   - Uses database aggregation (`SUM`, `COUNT`, `GROUP BY`)
   - Parallel queries with `Promise.all()` where independent
   - Pagination to limit result set size

3. **Frontend Optimization**
   - React Query caching with configurable stale time
   - Lazy loading of report components
   - Skeleton loaders for better UX during data fetch

### Mobile Responsiveness
- All reports fully responsive
- Tables scroll horizontally on small screens
- Grid layouts adapt to screen size (1/2/3/4/5 columns)
- Touch-friendly buttons and controls
- Optimized card layouts for mobile viewing

---

## Data Consistency & Accuracy

### Ensuring Totals Match
1. **Date Boundaries**
   - All date filters use consistent start (00:00:00) and end (23:59:59.999) times
   - Inclusive range filtering with `gte` and `lte` operators

2. **Single Source of Truth**
   - All reports query the same `Order` and `OrderItem` tables
   - No data duplication or derived tables

3. **Calculation Consistency**
   - Profit calculation: `(unitPrice - nlc) × quantity`
   - Sales calculation: `SUM(Order.totalAmount)` or `SUM(OrderItem.lineTotal)`
   - Quantity calculation: `SUM(OrderItem.quantity)`

4. **Validation**
   - Backend validates date ranges before querying
   - Frontend prevents invalid filter combinations
   - Empty states handled gracefully

### Known Considerations
- Historical data uses current product NLC for profit calculation
- If product NLC changes, historical profit calculations reflect current cost
- Consider adding historical cost tracking for improved accuracy

---

## Future Enhancements

### Potential Improvements
1. **Export Functionality**
   - Export to Excel/CSV
   - PDF report generation
   - Email scheduled reports

2. **Advanced Visualizations**
   - Trend lines over time
   - Comparison charts (YoY, MoM)
   - Heatmaps for product performance

3. **Additional Filters**
   - Date presets (Last 7 days, Last 30 days, Quarter, Year)
   - Operator-level filtering in quantity/profit reports
   - Customer-level analysis

4. **Saved Reports**
   - Save filter configurations
   - Quick access to frequent reports
   - Bookmark favorite views

5. **Real-time Updates**
   - WebSocket integration for live data
   - Auto-refresh options
   - Change notifications

6. **Historical Cost Tracking**
   - Store product cost at time of sale
   - More accurate historical profit analysis
   - Cost trend analysis

---

## Usage Guidelines

### Best Practices
1. **Regular Monitoring**
   - Review Cash vs Credit report daily to track payment types
   - Check Profit report weekly to identify underperforming products
   - Monitor Purchase Quantity monthly for inventory planning

2. **Filter Combinations**
   - Use Brand + Category filters together for focused analysis
   - Combine Store + Date Range for location-specific insights
   - Start broad, then narrow down with filters

3. **Interpretation**
   - Compare metrics across time periods for trends
   - Use profit margins to guide pricing decisions
   - Identify top performers and slow movers

4. **Performance**
   - Limit date ranges for large datasets
   - Use pagination efficiently
   - Apply filters to reduce result set size

### Common Use Cases
- **End of Day**: Check Cash vs Credit report to verify collections
- **Monthly Review**: Run all three reports for comprehensive business analysis
- **Inventory Planning**: Use Purchase Quantity report to forecast restocking
- **Pricing Strategy**: Use Profit report to optimize product margins
- **Store Performance**: Filter by store to compare location metrics

---

## Support & Troubleshooting

### Common Issues
1. **"No data found"**
   - Verify date range includes actual sales
   - Check if filters are too restrictive
   - Ensure selected brand/category/store has transactions

2. **Slow loading**
   - Reduce date range for large datasets
   - Clear browser cache and refresh
   - Check network connection

3. **Totals don't match expectations**
   - Verify date filter settings (timezone considerations)
   - Check operator type assignments for Cash vs Credit
   - Review product NLC values for profit calculations

### Contact
For technical issues or feature requests, contact the development team or create an issue in the project repository.
