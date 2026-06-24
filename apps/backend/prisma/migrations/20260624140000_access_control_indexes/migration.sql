-- Composite indexes for scoped list queries (userId + createdAt / date)
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt" DESC);
CREATE INDEX "Receipt_userId_date_idx" ON "Receipt"("userId", "date" DESC);
CREATE INDEX "Receipt_createdAt_idx" ON "Receipt"("createdAt");
CREATE INDEX "UserLog_userId_createdAt_idx" ON "UserLog"("userId", "createdAt" DESC);
