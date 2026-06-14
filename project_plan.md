Build a production-ready Billing, Inventory, Receipt, and Ledger Management Web Application.

Tech Stack:

* Frontend: React + Vite + TypeScript
* UI: Tailwind CSS + Shadcn UI
* State Management: TanStack Query (React Query)
* Forms: React Hook Form + Zod Validation
* Backend: Node.js + Express + TypeScript
* Database: PostgreSQL
* ORM: Prisma
* Authentication: JWT with Refresh Tokens
* PDF Generation: PDFKit
* Excel Export: ExcelJS

Requirements:

1. Authentication

* Login system
* Persistent login (user should not be automatically logged out when browser closes)
* Role-based access:

  * Admin
  * Operator

2. Dashboard
   Menu:

* Home
* Generate Bill
* Generate Receipt
* Ledgers
* Stock Report

3. Generate Bill Module

Flow:

* Select Store
* Select Brand OR Select Category
* If Brand is selected, show all related Categories
* If Category is selected, show all related Brands
* Display Product Listing

Product Card should contain:

* Product Image
* Model Name
* MRP
* NLC (Selling Price)
* Available Quantity

Features:

* Product Search
* Filter Options
* Sort by Price High to Low
* Sort by Price Low to High
* Add to Cart
* Quantity Increment / Decrement
* Place Order
* Download PDF
* Share PDF

Order Logic:

* Generate unique Bill Number
* Store order and order items in database
* Automatically reduce product stock after order placement
* Create Ledger Debit Entry automatically after bill generation

4. Generate Receipt Module

Flow:

* Select Store
* Select Payment Mode (Cash / UPI)
* Date field with today's date as default
* Enter Amount Received
* Save Receipt

Receipt Logic:

* Generate Receipt Number
* Save receipt in database
* Create Ledger Credit Entry automatically after receipt generation

5. Ledger Module

Opening Balance:

* Select Store
* Enter Amount
* Save Opening Balance

Ledger Rules:

* Debit entries are automatically generated from Bills
* Credit entries are automatically generated from Receipts
* No manual debit/credit entry

Ledger Screen Columns:

* Customer Name
* Date
* Voucher Type (Order / Receipt)
* Bill Serial Number
* Opening Balance
* Current Total
* Closing Balance

Provide:

* Search
* Date Filters
* Export PDF
* Export Excel

6. Stock Report Module

Provide reports based on:

* Brand Wise
* Sub Category Wise
* Quantity Wise
* Date Wise
* Month Wise
* Year Wise

Report Features:

* Filters
* Pagination
* PDF Export
* Excel Export
* Print Option

7. Admin Panel

Brand Management:
Fields:

* Brand Name
* Brand Image

Category Management:
Fields:

* Category Name
* Brand
* Category Image

Store Management:
Fields:

* Store Name
* Address
* City
* Pincode
* Mobile Number
* Email

Product Management:
Fields:

* Brand
* Category
* Model Name
* Product Image
* MRP
* NLC Selling Price
* Available Quantity

8. User Logs Module

Track:

* User
* Action
* Date & Time

Log events:

* Login
* Bill Creation
* Receipt Creation
* Product Creation
* Product Update
* Brand Creation
* Category Creation
* Store Creation

9. Database Design

Create Prisma schema and migrations for:

* users
* stores
* brands
* categories
* products
* orders
* order_items
* receipts
* ledger_entries
* opening_balances
* user_logs

10. API Development

Create complete REST APIs with:

* Validation
* Error Handling
* Pagination
* Filtering
* Sorting

11. Frontend Requirements

* Mobile First Design
* Fully Responsive Layout
* Responsive Sidebar
* Responsive Tables
* Loading States
* Empty States
* Form Validation
* Toast Notifications
* Dark Code Structure
* Reusable Components

12. Project Structure

Use scalable folder structure:

Frontend:

* components
* pages
* layouts
* hooks
* services
* types
* utils

Backend:

* modules
* controllers
* services
* repositories
* middleware
* validators
* prisma

13. Deliverables

Generate:

* Complete Prisma Schema
* Database Relations
* Backend APIs
* React Pages
* Reusable Components
* Authentication Flow
* PDF Generation
* Excel Export
* Responsive UI
* Seed Data
* Environment Variable Examples

Important:
Do not implement the "Cash Link / Credit Link" feature yet. Keep architecture flexible so it can be added later without major refactoring.



***Performance, Scalability & UI/UX Requirements

Build the application with performance, scalability, maintainability, and modern UI/UX as top priorities.

* Fast page loads and optimized API responses
* Efficient Prisma queries with proper database indexing
* Server-side pagination, filtering, and sorting
* React Query caching and optimized state management
* Lazy loading, code splitting, and dynamic imports
* Minimize re-renders and optimize component performance
* Secure authentication, authorization, and audit logging
* Mobile-first, fully responsive design across all devices
* Modern, clean, professional, and user-friendly interface
* Attractive dashboard with excellent user experience
* Consistent design system using reusable components
* Responsive tables, forms, cards, modals, and navigation
* Production-ready folder structure and clean architecture
* Scalable database and application design for future expansion
* Follow industry best practices for enterprise-grade applications

The application should feel fast, intuitive, visually appealing, and professional while remaining easy to maintain and extend in the future.
