# Performance Optimization Checklist for MPM-Next

## Current Performance Status: ✅ GOOD

Your implementation is already following best practices:
- ✅ Using SQL Server views (`qryTaskList`) for complex joins
- ✅ Database-level filtering with Prisma
- ✅ Server Actions for data fetching
- ✅ Debounced input to prevent excessive queries
- ✅ Proper loading states

## Quick Wins (Easy Improvements)

### 1. Add Column Selection (Reduce Data Transfer)
**Impact:** 30-50% faster for large datasets  
**Effort:** 5 minutes

```typescript
// src/app/actions/taskListActions.ts
// Only select columns actually used in the table
export async function getTaskList(filters?: {...}) {
  return await prisma.qryTaskList.findMany({
    select: {
      ID: true,
      TicketNumber: true,
      TaskName: true,
      ProjectName: true,
      CurrentlyRunning: true,
      ManufacturingRev: true,
      Status: true,
      DrawingNumber: true,
      Operation: true,
      DueDate: true,
      // Don't fetch fields not displayed in table
    },
    where: {...},
    orderBy: { ID: 'asc' },
  })
}
```

### 2. Add Pagination
**Impact:** 10x faster for large result sets  
**Effort:** 15 minutes

```typescript
export async function getTaskList(
  filters?: {...},
  pagination?: { page: number; pageSize: number }
) {
  const pageSize = pagination?.pageSize ?? 100
  const page = pagination?.page ?? 0
  
  const [tasks, totalCount] = await Promise.all([
    prisma.qryTaskList.findMany({
      where: {...},
      take: pageSize,
      skip: page * pageSize,
      orderBy: { ID: 'asc' },
    }),
    prisma.qryTaskList.count({
      where: {...}
    })
  ])
  
  return { tasks, totalCount, page, pageSize }
}
```

### 3. Add Database Indexes
**Impact:** 5-10x faster filtering  
**Effort:** 10 minutes

Run these in SQL Server Management Studio:

```sql
-- Index for status filtering (most common filter)
CREATE NONCLUSTERED INDEX IX_tblTask_StatusID_ID
ON dbo.tblTask (StatusID, ID)
INCLUDE (TaskName, ProjectID, DrawingNumber, DueDate)

-- Index for task name search
CREATE NONCLUSTERED INDEX IX_tblTask_TaskName
ON dbo.tblTask (TaskName)
WHERE TaskName IS NOT NULL

-- Index for project name search
CREATE NONCLUSTERED INDEX IX_tblProject_ProjectName
ON dbo.tblProject (ProjectName)
WHERE ProjectName IS NOT NULL
```

## Medium Effort Optimizations

### 4. Add Query Result Caching (Next.js)
**Impact:** Instant for repeated queries  
**Effort:** 20 minutes

```typescript
// src/app/actions/taskListActions.ts
import { unstable_cache } from 'next/cache'

export const getTaskList = unstable_cache(
  async (filters) => {
    // ... your existing query
  },
  ['task-list'], // cache key
  { 
    revalidate: 30, // revalidate every 30 seconds
    tags: ['tasks'] // for manual revalidation
  }
)

// Invalidate cache when tasks change
export async function updateTask(id: number, data: any) {
  // ... update logic
  revalidateTag('tasks')
}
```

### 5. Add Request Deduplication
**Impact:** Prevents duplicate queries  
**Effort:** 10 minutes

```typescript
// src/app/actions/taskListActions.ts
import { cache } from 'react'

// Deduplicates requests during a single render
export const getTaskList = cache(async (filters) => {
  // ... your existing query
})
```

### 6. Consider Indexed Views (SQL Server)
**Impact:** 2-5x faster for complex views  
**Effort:** 30 minutes  
**Tradeoff:** Uses more storage, slower writes

```sql
-- Make qryTaskList an indexed view
CREATE VIEW dbo.qryTaskList
WITH SCHEMABINDING  -- Required for indexed views
AS
SELECT 
  t.ID,
  t.TaskName,
  -- ... other fields
FROM dbo.tblTask t  -- Must use schema prefix with SCHEMABINDING
INNER JOIN dbo.tblProject p ON t.ProjectID = p.ID
-- ... other joins

GO

-- Create clustered index to materialize the view
CREATE UNIQUE CLUSTERED INDEX IX_qryTaskList_ID
ON dbo.qryTaskList (ID)

GO

-- Add non-clustered indexes for common filters
CREATE NONCLUSTERED INDEX IX_qryTaskList_StatusID
ON dbo.qryTaskList (StatusID)
INCLUDE (TaskName, ProjectName, DrawingNumber)
```

## Advanced Optimizations (Only If Needed)

### 7. Use Stored Procedures for Complex Reports

If you need heavy aggregations or complex business logic:

```sql
-- SQL Server
CREATE PROCEDURE dbo.sp_GetTaskListOptimized
  @StatusID INT = NULL,
  @TaskName NVARCHAR(255) = NULL,
  @ProjectName NVARCHAR(255) = NULL,
  @PageNumber INT = 1,
  @PageSize INT = 100
AS
BEGIN
  SET NOCOUNT ON;
  
  DECLARE @Offset INT = (@PageNumber - 1) * @PageSize
  
  SELECT 
    ID, TaskName, ProjectName, Status, DrawingNumber, DueDate
  FROM qryTaskList
  WHERE 
    (@StatusID IS NULL OR StatusID = @StatusID)
    AND (@TaskName IS NULL OR TaskName LIKE '%' + @TaskName + '%')
    AND (@ProjectName IS NULL OR ProjectName LIKE '%' + @ProjectName + '%')
  ORDER BY ID
  OFFSET @Offset ROWS
  FETCH NEXT @PageSize ROWS ONLY
  
  -- Also return total count
  SELECT COUNT(*) AS TotalCount
  FROM qryTaskList
  WHERE 
    (@StatusID IS NULL OR StatusID = @StatusID)
    AND (@TaskName IS NULL OR TaskName LIKE '%' + @TaskName + '%')
    AND (@ProjectName IS NULL OR ProjectName LIKE '%' + @ProjectName + '%')
END
```

Call from Prisma:
```typescript
import { Prisma } from '@prisma/client'

export async function getTaskListSP(filters) {
  const result = await prisma.$queryRaw<any[]>`
    EXEC sp_GetTaskListOptimized 
      @StatusID = ${filters.statusID},
      @TaskName = ${filters.taskName},
      @ProjectName = ${filters.projectName}
  `
  return result
}
```

### 8. Add Database Query Monitoring

Check your SQL Server query performance:

```sql
-- Find slow queries
SELECT 
  qs.execution_count,
  qs.total_elapsed_time / 1000000 AS total_elapsed_time_seconds,
  qs.total_worker_time / 1000000 AS total_cpu_time_seconds,
  SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
    ((CASE qs.statement_end_offset
      WHEN -1 THEN DATALENGTH(st.text)
      ELSE qs.statement_end_offset
    END - qs.statement_start_offset)/2) + 1) AS statement_text
FROM sys.dm_exec_query_stats AS qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) AS st
WHERE st.text LIKE '%qryTaskList%'
ORDER BY qs.total_elapsed_time DESC
```

## Monitoring & Measurement

### Add Performance Logging
```typescript
// src/app/actions/taskListActions.ts
export async function getTaskList(filters) {
  const startTime = performance.now()
  
  try {
    const result = await prisma.qryTaskList.findMany({...})
    
    const duration = performance.now() - startTime
    console.log(`[PERF] getTaskList: ${duration.toFixed(2)}ms, rows: ${result.length}`)
    
    return result
  } catch (error) {
    console.error('[ERROR] getTaskList failed:', error)
    throw error
  }
}
```

## Performance Budget

Target metrics for your app:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Initial query | < 200ms | ? | Measure! |
| Filtered query | < 100ms | ? | Measure! |
| Data transfer | < 100KB | ? | Measure! |
| Time to Interactive | < 2s | ? | Measure! |

## Priority Order

Implement optimizations in this order:

1. **✅ Indexes** (biggest bang for buck)
2. **✅ Column selection** (reduce data transfer)
3. **✅ Pagination** (essential for scalability)
4. **⚠️ Caching** (only if queries are read-heavy)
5. **⚠️ Indexed views** (only if indexes aren't enough)
6. **⚠️ Stored procedures** (only for complex business logic)

## When to Optimize

- ⏱️ Query takes > 500ms
- 📊 Dataset > 1000 rows
- 🐌 Users complain about slowness
- 📈 Traffic is growing

## When NOT to Optimize

- ✅ Query takes < 100ms (fast enough!)
- ✅ Dataset < 500 rows (no need yet)
- ✅ No user complaints
- 🎯 **Premature optimization is the root of all evil**

## Next Steps

1. **Measure current performance** with console.time()
2. **Add indexes** on frequently filtered columns
3. **Consider pagination** if > 500 rows typically returned
4. **Profile** with SQL Server Profiler if needed
5. **Optimize** only proven bottlenecks

Remember: Your current implementation is already good! Don't over-engineer.

