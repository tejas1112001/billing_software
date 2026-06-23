# Admin Dashboard - Complete Analysis & Documentation

## Overview
The Admin Dashboard provides real-time insights into business operations, operator performance, sales trends, and system activity. It consists of 9 major sections with various KPIs, charts, tables, and metrics.

---

## 1. TODAY'S SNAPSHOT (6 KPI Cards)

### 1.1 Orders Today
- **Type**: KPI Card
- **Icon**: ShoppingCart (Blue)
- **Data Source**: `Order` table
- **Calculation**: `COUNT(*)` where `createdAt` is between start of today (00:00:00) and end of today (23:59:59)
- **Filter**: Today only
- **Purpose**: Shows the total number of bills/orders created today across all operators and stores
- **Display**: Integer count

### 1.2 Receipts Today
- **Type**: KPI Card
- **Icon**: Receipt (Green)
- **Data Source**: `Receipt` table
- **Calculation**: `COUNT(*)` where `createdAt` is between start of today and end of today
- **Filter**: Today only
- **Purpose**: Shows the total number of payment receipts generated today
- **Display**: Integer count

### 1.3 Sales Today
- **Type**: KPI Card
- **Icon**: TrendingUp (Indigo)
- **Data Source**: `Order` table
- **Calculation**: `SUM(totalAmount)` where `createdAt` is between start of today and end of today
- **Filter**: Today only
- **Purpose**: Shows the total revenue from all bills created today (includes both cash and credit sales)
- **Display**: Currency format (₹XX,XXX.XX)

### 1.4 Collected Today
- **Type**: KPI Card
- **Icon**: Wallet (Emerald Green)
- **Data Source**: `Receipt` table
- **Calculation**: `SUM(amount)` where `createdAt` is between start of today and end of today
- **Filter**: Today only
- **Purpose**: Shows the total actual cash/UPI collected today through receipts
- **Display**: Currency format (₹XX,XXX.XX)

### 1.5 Low Stock
- **Type**: KPI Card (Warning indicator)
- **Icon**: AlertTriangle (Yellow)
- **Data Source**: `Product` table
- **Calculation**: `COUNT(*)` where `availableQty < 5`
- **Filter**: Real-time (all-time)
- **Purpose**: Alerts admin about products with critically low inventory (less than 5 units)
- **Display**: Integer count with subtitle "< 5 units"

### 1.6 Active Stores
- **Type**: KPI Card
- **Icon**: Store (Purple)
- **Data Source**: `Store` table
- **Calculation**: `COUNT(*)` (all stores in the system)
- **Filter**: All-time
- **Purpose**: Shows the total number of stores/locations configured in the system
- **Display**: Integer count

---

## 2. MONTH & OUTSTANDING SUMMARY (3 KPI Cards)

### 2.1 Sales This Month
- **Type**: KPI Card
- **Icon**: IndianRupee (Blue)
- **Data Source**: `Order` table
- **Calculation**: `SUM(totalAmount)` where `createdAt` is between start of current month (1st day 00:00:00) and end of current month (last day 23:59:59)
- **Filter**: Current month only
- **Purpose**: Shows total revenue generated from all bills in the current calendar month
- **Display**: Currency format (₹XX,XXX.XX)

### 2.2 Collected This Month
- **Type**: KPI Card
- **Icon**: Wallet (Emerald Green)
- **Data Source**: `Receipt` table
- **Calculation**: `SUM(amount)` where `createdAt` is between start of current month and end of current month
- **Filter**: Current month only
- **Purpose**: Shows total payments received through receipts in the current calendar month
- **Display**: Currency format (₹XX,XXX.XX)

### 2.3 Total Outstanding
- **Type**: KPI Card (Highlighted in orange if > 0)
- **Icon**: TrendingDown (Red)
- **Data Source**: `Order` and `Receipt` tables
- **Calculation**: 
  - Total Sales All-Time: `SUM(Order.totalAmount)` (no date filter)
  - Total Collected All-Time: `SUM(Receipt.amount)` (no date filter)
  - Outstanding = Total Sales All-Time - Total Collected All-Time
- **Filter**: All-time cumulative
- **Purpose**: Shows the total unpaid/pending balance across all credit sales since the beginning
- **Display**: Currency format (₹XX,XXX.XX) with subtitle "All-time unpaid balance"
- **Visual Alert**: Card has orange border and background tint when value > 0
- **Business Meaning**: Represents total accounts receivable

---

## 3. 7-DAY SALES & COLLECTIONS (Area Chart)

### Chart Type: Area Chart with Gradients
- **Title**: "7-Day Sales & Collections"
- **Data Source**: `Order` and `Receipt` tables
- **Time Range**: Last 7 days (from 6 days ago to today)
- **Refresh Interval**: Every 60 seconds

### Data Calculation (for each day):
```
For each day (d) from (today - 6) to today:
  - Start: d at 00:00:00
  - End: d at 23:59:59
  - Sales: SUM(Order.totalAmount) where createdAt between start and end
  - Collected: SUM(Receipt.amount) where createdAt between start and end
  - Orders: COUNT(Order.*) where createdAt between start and end
```

### Chart Components:
- **X-Axis**: Day labels (e.g., "Mon 15", "Tue 16")
- **Y-Axis**: Currency amount (formatted as "₹XXk" - thousands)
- **Line 1 (Blue)**: Sales trend line with gradient fill
  - Color: #4F46E5 (Indigo)
  - Gradient: 20% opacity at top, fading to 0% at bottom
  - Data points: Circular dots (radius: 3px)
  - Stroke width: 2px
- **Line 2 (Green)**: Collections trend line with gradient fill
  - Color: #10B981 (Emerald Green)
  - Gradient: 20% opacity at top, fading to 0% at bottom
  - Data points: Circular dots (radius: 3px)
  - Stroke width: 2px
- **Grid**: Dashed lines (3-3 pattern) with 30% opacity
- **Tooltip**: Shows exact amounts on hover in currency format
- **Legend**: Shows "Sales" and "Collected" labels

### Purpose:
- Track daily sales and collection trends over the past week
- Identify patterns (weekday vs. weekend performance)
- Compare sales vs. collections to understand payment lag
- Spot anomalies or declining trends

---

## 4. OPERATOR PERFORMANCE SECTION

### Filter Controls
- **Location**: Top-right of section
- **Options**:
  1. **All** - Shows all operators regardless of type
  2. **Cash** (Banknote icon) - Filters to show only CASH operators
  3. **Credit** (CreditCard icon) - Filters to show only CREDIT operators
- **Behavior**: Clicking a filter updates both charts and table below
- **API Parameter**: `operatorType` query parameter

---

## 5. SALES DISTRIBUTION (Pie Chart)

### Chart Type: Donut Pie Chart
- **Title**: "Sales Distribution"
- **Data Source**: Aggregated from operator stats
- **Refresh Interval**: Every 30 seconds

### Data Calculation:
```
For each active operator (role = 'OPERATOR', isActive = true):
  - Filter by operatorType if filter is applied
  - Calculate: SUM(Order.totalAmount) where userId = operator.id AND createdAt = today
  
Cash Sales = SUM of sales where operator.operatorType = 'CASH'
Credit Sales = SUM of sales where operator.operatorType = 'CREDIT'
```

### Chart Components:
- **Inner Radius**: 50px (creates donut effect)
- **Outer Radius**: 80px
- **Segments**: 2 slices (Cash Ops, Credit Ops)
- **Colors**: 
  - Slice 1: #4F46E5 (Indigo)
  - Slice 2: #10B981 (Green)
- **Labels**: Display on chart showing "Name XX%" (e.g., "Cash Ops 65%")
- **Label Lines**: Connect labels to slices
- **Tooltip**: Shows segment name and currency amount on hover

### Purpose:
- Visualize the ratio of cash vs. credit sales
- Understand business mix between payment types
- Filter to see distribution for specific operator types

### Empty State:
- Shows "No sales today" message when no data exists

---

## 6. BILLS & RECEIPTS BY OPERATOR (Bar Chart)

### Chart Type: Grouped Bar Chart
- **Title**: "Bills & Receipts by Operator"
- **Data Source**: Operator stats aggregated by user
- **Refresh Interval**: Every 30 seconds

### Data Calculation (for each operator):
```
For each active operator matching filter:
  - Bills: COUNT(Order.*) where userId = operator.id AND createdAt = today
  - Receipts: COUNT(Receipt.*) where userId = operator.id AND createdAt = today
```

### Chart Components:
- **X-Axis**: Operator usernames
- **Y-Axis**: Count of bills/receipts (integer)
- **Bar 1 (Blue)**: Bills count
  - Color: #4F46E5 (Indigo)
  - Border radius: Top corners rounded (3px)
- **Bar 2 (Green)**: Receipts count
  - Color: #10B981 (Emerald Green)
  - Border radius: Top corners rounded (3px)
- **Grid**: Dashed lines (3-3 pattern) with 30% opacity
- **Tooltip**: Shows operator name and exact counts on hover
- **Legend**: Shows "Bills" and "Receipts" labels
- **Margin**: Left margin -20px to optimize space

### Purpose:
- Compare productivity between operators
- Identify high-performing and low-performing team members
- Track workload distribution
- See which operators are processing more bills vs. receipts

### Empty State:
- Shows "No data today" message when no operators have activity

---

## 7. OPERATOR ACTIVITY TABLE - TODAY

### Table Type: Detailed Data Table
- **Title**: "Operator Activity — Today" with Users icon
- **Data Source**: Aggregated operator statistics
- **Refresh Interval**: Every 30 seconds

### Columns:

#### 7.1 Operator (Column 1)
- **Data**: `User.username`
- **Style**: Font-medium (bold)
- **Alignment**: Left

#### 7.2 Type (Column 2)
- **Data**: `User.operatorType` (CASH or CREDIT)
- **Style**: Badge component
  - CASH: Green badge with "success" variant
  - CREDIT: Orange badge with "warning" variant
  - NULL: Shows "—" dash
- **Alignment**: Left

#### 7.3 Bills (Column 3)
- **Data Source**: `Order` table
- **Calculation**: `COUNT(*)` where `userId = operator.id` AND `createdAt = today`
- **Display**: Integer count
- **Alignment**: Right

#### 7.4 Receipts (Column 4)
- **Data Source**: `Receipt` table
- **Calculation**: `COUNT(*)` where `userId = operator.id` AND `createdAt = today`
- **Display**: Integer count
- **Alignment**: Right

#### 7.5 Sales (Column 5)
- **Data Source**: `Order` table
- **Calculation**: `SUM(totalAmount)` where `userId = operator.id` AND `createdAt = today`
- **Display**: Currency format (₹XX,XXX.XX)
- **Style**: Font-medium, primary color (blue)
- **Alignment**: Right

#### 7.6 Collected (Column 6)
- **Data Source**: `Receipt` table
- **Calculation**: `SUM(amount)` where `userId = operator.id` AND `createdAt = today`
- **Display**: Currency format (₹XX,XXX.XX)
- **Style**: Font-medium, emerald-600 color (green)
- **Alignment**: Right

#### 7.7 Pending (Column 7)
- **Data Source**: Calculated field
- **Calculation**: `Sales - Collected` for each operator
- **Display**: Currency format (₹XX,XXX.XX)
- **Style**: 
  - Font-medium
  - Red color (text-red-500) if pending > 0
  - Muted gray color if pending = 0
- **Purpose**: Shows each operator's uncollected amount for today
- **Alignment**: Right

### Table Features:
- **Header**: Sticky with muted background
- **Rows**: Hover effect (light gray background on hover)
- **Borders**: Bottom border on each row
- **Sorting**: Operators sorted alphabetically by username
- **Responsive**: Horizontal scroll on smaller screens

### Empty State:
- Shows "No operators found" centered message when no data

---

## 8. TOP PRODUCTS — THIS MONTH

### Component Type: Ranked List Card
- **Title**: "Top Products — This Month" with PackageSearch icon
- **Data Source**: `OrderItem` table joined with `Product` and `Brand` tables
- **Filter**: Current calendar month
- **Refresh Interval**: Every 60 seconds
- **Limit**: Top 8 products

### Data Calculation:
```sql
SELECT 
  productId,
  SUM(quantity) as totalQty,
  SUM(lineTotal) as totalRevenue
FROM OrderItem
JOIN Order ON OrderItem.orderId = Order.id
WHERE Order.createdAt >= start_of_month
GROUP BY productId
ORDER BY totalRevenue DESC
LIMIT 8
```

Then join with Product and Brand tables to get:
- `Product.modelName`
- `Brand.name`

### List Item Structure (for each product):

#### Rank Number (Left)
- **Position**: 1-8
- **Style**: Small bold text, muted gray
- **Width**: Fixed 16px

#### Product Details (Center)
- **Line 1**: Model name
  - Data: `Product.modelName`
  - Style: Medium font weight, truncated if too long
  - Size: Small (14px)
- **Line 2**: Brand name
  - Data: `Brand.name`
  - Style: Extra small (12px), muted foreground color

#### Revenue Details (Right)
- **Line 1**: Total revenue
  - Data: `SUM(OrderItem.lineTotal)`
  - Style: Semibold, primary color (blue)
  - Format: Currency (₹XX,XXX.XX)
  - Size: Small (14px)
- **Line 2**: Quantity sold
  - Data: `SUM(OrderItem.quantity)`
  - Style: Extra small (12px), muted foreground
  - Format: "XX units"

### List Features:
- **Hover Effect**: Light gray background on hover
- **Dividers**: Border between each item
- **Padding**: Consistent 12px vertical, 16px horizontal

### Purpose:
- Identify best-selling products by revenue
- Understand which products drive the most sales
- Plan inventory restocking priorities
- Analyze product performance trends

### Empty State:
- Shows "No sales this month" centered message when no products sold

---

## 9. RECENT ACTIVITY LOG

### Component Type: Activity Feed Card
- **Title**: "Recent Activity" with Clock icon
- **Data Source**: `UserLog` table joined with `User` table
- **Refresh Interval**: Every 30 seconds
- **Limit**: Last 20 log entries
- **Max Height**: 340px with vertical scroll

### Data Query:
```sql
SELECT 
  UserLog.id,
  UserLog.action,
  UserLog.meta,
  UserLog.createdAt,
  User.id,
  User.username,
  User.operatorType
FROM UserLog
JOIN User ON UserLog.userId = User.id
ORDER BY UserLog.createdAt DESC
LIMIT 20
```

### Tracked Actions:
1. **LOGIN** - "Logged in"
2. **LOGOUT** - "Logged out"
3. **BILL_CREATION** - "Created bill" (shows bill number from meta)
4. **RECEIPT_CREATION** - "Created receipt" (shows receipt number from meta)
5. **PRODUCT_CREATION** - "Added product"
6. **PRODUCT_UPDATE** - "Updated product"
7. **BRAND_CREATION** - "Added brand"
8. **CATEGORY_CREATION** - "Added category"
9. **STORE_CREATION** - "Added store"
10. **USER_CREATION** - "Created user"
11. **PAYMENT_METHOD_CREATION** - "Added payment method"
12. **PAYMENT_METHOD_UPDATE** - "Updated payment method"

### Activity Item Structure:

#### Main Content (Left)
- **Line 1**: Activity description
  - Format: "[Username] [Action]"
  - Username: Bold font
  - Action: Regular font, muted color
  - Size: Small (14px)
- **Bill/Receipt Number** (if applicable):
  - Shows after action text
  - Bills: Blue color with "#" prefix (from meta.billNumber)
  - Receipts: Green color with "#" prefix (from meta.receiptNumber)
  - Size: Extra small (12px)
- **Line 2**: Operator type badge (if operator)
  - CASH: Green badge (3.5px height)
  - CREDIT: Orange badge (3.5px height)
  - Font size: 10px
  - Padding: 1px horizontal

#### Timestamp (Right)
- **Data**: `UserLog.createdAt`
- **Format**: Relative time
  - "just now" - less than 1 minute ago
  - "Xm ago" - X minutes ago (< 60 minutes)
  - "Xh ago" - X hours ago (< 24 hours)
  - "Xd ago" - X days ago (≥ 24 hours)
- **Style**: Extra small (12px), muted foreground
- **Position**: Top-right, fixed width

### List Features:
- **Hover Effect**: Light gray background on hover
- **Dividers**: Border between each activity
- **Scroll**: Vertical scroll when content exceeds 340px
- **Padding**: 10px vertical, 16px horizontal

### Purpose:
- Real-time audit trail of system activities
- Monitor operator actions and system usage
- Track bill and receipt creation in real-time
- Identify who performed which action and when
- Security and accountability tracking

### Empty State:
- Shows "No recent activity" centered message when no logs exist

---

## DATA REFRESH INTERVALS

| Component | Refresh Rate | Query Key |
|-----------|--------------|-----------|
| Today's Snapshot (6 KPIs) | 30 seconds | `dashboard-stats` |
| Month & Outstanding (3 KPIs) | 30 seconds | `dashboard-stats` |
| 7-Day Trends Chart | 60 seconds | `weekly-trends` |
| Operator Performance Charts & Table | 30 seconds | `operator-stats` |
| Top Products List | 60 seconds | `top-products` |
| Recent Activity Log | 30 seconds | `recent-activity` |

---

## USER INTERACTIONS & BEHAVIORS

### 1. Filter Operator Type
- **Location**: Operator Performance section header
- **Buttons**: All / Cash / Credit
- **Effect**: 
  - Updates pie chart distribution
  - Updates bar chart data
  - Filters operator table rows
  - Changes API query parameter

### 2. Chart Hover (All Charts)
- **Tooltips**: Display exact values on hover
- **Formatting**: Currency amounts formatted with ₹ symbol

### 3. Table Row Hover
- **Operator Activity Table**: Rows highlight with subtle gray background

### 4. List Item Hover
- **Top Products List**: Items highlight with subtle gray background
- **Recent Activity**: Items highlight with subtle gray background

### 5. Auto-refresh
- **Behavior**: All data automatically refreshes at specified intervals
- **User Experience**: Seamless updates without page reload
- **Loading States**: Skeleton loaders shown during initial load

---

## LOADING STATES

All sections display skeleton loaders during initial data fetch:
- **KPI Cards**: Gray placeholder boxes matching card dimensions
- **Charts**: Gray placeholder rectangles (height: 48-52)
- **Tables**: Gray placeholder rectangles
- **Lists**: Gray placeholder rectangles

---

## NAVIGATION & DRILL-DOWN

**Note**: Current implementation does NOT include drill-down navigation. All metrics are display-only.

### Potential Future Enhancements:
- Click "Orders Today" → Navigate to orders list filtered by today
- Click "Low Stock" → Navigate to products page with low stock filter
- Click operator name → View detailed operator report
- Click product in Top Products → View product details page
- Click activity log item → View related bill/receipt

---

## TECHNICAL ARCHITECTURE

### Frontend:
- **Framework**: React with TypeScript
- **UI Library**: Shadcn/ui components
- **Charts**: Recharts library
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS

### Backend:
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **API Pattern**: RESTful

### API Endpoints:
1. `GET /dashboard/stats` - Today's snapshot + month + outstanding
2. `GET /dashboard/operator-stats?operatorType={type}` - Operator performance
3. `GET /dashboard/weekly-trends` - 7-day chart data
4. `GET /dashboard/top-products` - Top 8 products this month
5. `GET /dashboard/recent-activity` - Last 20 activity logs

---

## BUSINESS INSIGHTS DERIVED

### Cash Flow Analysis:
- **Sales vs. Collected**: Gap indicates credit sales pending collection
- **Outstanding Balance**: Tracks total accounts receivable
- **Daily Trends**: Identifies peak sales days and collection patterns

### Operator Performance:
- **Productivity**: Bills and receipts count per operator
- **Revenue Contribution**: Sales amount per operator
- **Collection Efficiency**: Pending amount shows operator-level collection gaps
- **Type Distribution**: Cash vs. Credit operator performance comparison

### Inventory Management:
- **Low Stock Alerts**: Prevents stockouts
- **Top Products**: Guides restocking priorities
- **Sales Velocity**: Monthly product performance trends

### Operational Monitoring:
- **Activity Logs**: Real-time visibility into system usage
- **User Actions**: Audit trail for accountability
- **System Health**: Monitor active operations and user engagement

---

## COLOR CODING SYSTEM

### Status Colors:
- **Blue (#4F46E5)**: Sales, Orders, Primary metrics
- **Green (#10B981)**: Collections, Receipts, Positive actions
- **Red (#EF4444)**: Outstanding, Pending, Alerts
- **Yellow (#F59E0B)**: Warnings, Low stock
- **Purple (#8B5CF6)**: Stores, Infrastructure
- **Orange**: Credit operators, Highlighted concerns

### Semantic Meaning:
- **Indigo (Blue)**: Money owed to business (Sales)
- **Emerald (Green)**: Money received by business (Collections)
- **Red**: Money pending/problems requiring attention

---

## PERFORMANCE CONSIDERATIONS

### Optimization Strategies:
1. **Database Indexing**: All filtered fields have indexes (createdAt, userId, storeId)
2. **Aggregate Queries**: Use database-level aggregation instead of fetching all records
3. **Parallel Queries**: Promise.all() for concurrent data fetching
4. **Caching**: React Query cache with configurable stale time
5. **Pagination**: Activity logs limited to 20, top products limited to 8
6. **Incremental Loading**: Skeleton states prevent layout shift

### Query Performance:
- Most queries are simple COUNT/SUM operations on indexed columns
- Date range filters use indexed timestamp columns
- JOIN operations limited to necessary relationships only

---

## SECURITY & PERMISSIONS

### Access Control:
- **Admin Only**: Entire dashboard visible only to users with `role = 'ADMIN'`
- **Authentication**: JWT token required for all API endpoints
- **Authorization Middleware**: Validates admin role before data access

### Data Privacy:
- **Operator View**: Operators see only their own stats (different dashboard)
- **Sensitive Data**: No customer phone numbers or addresses exposed
- **Audit Trail**: All actions logged with timestamps and user IDs

---

## SUMMARY

The Admin Dashboard provides a comprehensive, real-time view of business operations with:
- **9 major sections** covering sales, collections, operators, products, and activity
- **20+ metrics and KPIs** calculated from 6 database tables
- **4 interactive charts** (Area, Pie, Bar) for visual analysis
- **2 detailed tables/lists** for granular data exploration
- **Multiple time filters** (Today, This Month, 7-Day, All-Time)
- **Auto-refresh** functionality for real-time monitoring
- **Responsive design** with loading states and empty state handling

The dashboard serves as the central command center for business owners and administrators to monitor performance, track operators, manage inventory, and audit system activities.
