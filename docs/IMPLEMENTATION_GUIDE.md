# QUICK START IMPLEMENTATION GUIDE

## For Developers: Execute in This Order

### Quick Reference Links
- [Phase 1: Analysis](PRODUCTION_ANALYSIS.md) - Understand problems
- [Phase 2: Architecture](PHASE2_ARCHITECTURE.md) - Understand solutions
- [Phase 3: Roadmap](PHASE3_EXECUTION.md) - Implementation plan
- [Phase 4: Code Examples](PHASE4_CODE_REFACTOR.md) - Copy-paste ready code
- [Phase 5-6: Production](PHASE5_PHASE6_PRODUCTION.md) - Production features
- [Phase 7: Overview](PHASE7_FINAL_OVERVIEW.md) - System summary

---

## WEEK 1: FOUNDATION

### Day 1-2: Database Optimization (1-2 hours)

```bash
# 1. Create migration file
touch supabase/migrations/20260315120000_add_production_indices.sql

# 2. Copy all indices from PHASE2_ARCHITECTURE.md (Indices section)
# 3. Test locally
supabase db reset

# 4. Deploy to production (zero downtime)
supabase db push
```

**Progress Check**:
- [ ] All 17 indices created
- [ ] No errors during migration
- [ ] Verify indices exist: `\d influencer_profiles`

---

### Day 2-3: React Query Setup (2 hours)

**File: `src/lib/queryClient.ts`**
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});
```

**File: `src/App.tsx`**
```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* rest of app */}
    </QueryClientProvider>
  );
}
```

**Progress Check**:
- [ ] React Query installed
- [ ] QueryClientProvider wraps app
- [ ] DevTools visible (optional, but helpful)

---

### Day 3: RPC Functions (2 hours)

**Create: `supabase/functions/rpc/get_dashboard_data.sql`**

Copy from [PHASE4_CODE_REFACTOR.md](PHASE4_CODE_REFACTOR.md) (Refactor 1 section)

```sql
CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id UUID)
RETURNS JSON AS $$
...
$$ LANGUAGE plpgsql;
```

**Test RPC function:**
```bash
supabase functions deploy rpc/get_dashboard_data

# Test in Supabase editor:
SELECT get_dashboard_data('user-uuid-here');
```

**Progress Check**:
- [ ] RPC function created
- [ ] Returns correct JSON structure
- [ ] Handles NULL values gracefully

---

## WEEK 2: DASHBOARD MIGRATION

### Day 1-2: Create React Query Hooks (2 hours)

**File: `src/hooks/useQuery/useDashboardData.ts`**
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardData = (userId: string | undefined) => {
  return useQuery(
    ['dashboard', userId],
    async () => {
      const { data, error } = await supabase.rpc(
        'get_dashboard_data',
        { p_user_id: userId }
      );
      if (error) throw error;
      return data;
    },
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
      retry: 2,
    }
  );
};
```

**Create other hooks similarly:**
- `useCampaigns.ts` (paginated)
- `useInfluencers.ts` (paginated with filters)
- `useMessages.ts` (with realtime)
- `useBookings.ts` (with joins)

**Progress Check**:
- [ ] All hooks created
- [ ] Hooks use React Query correctly
- [ ] TypeScript types defined

---

### Day 2-3: Refactor Dashboard Component (2-3 hours)

**File: `src/pages/Dashboard.tsx`**

```typescript
// BEFORE:
const [campaigns, setCampaigns] = useState([]);
const [applications, setApplications] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => { fetchData(); }, [user]);

// AFTER:
const { data: dashboardData, isLoading, isError } = useDashboardData(user?.id);

// Instead of manually rendering loading state:
if (isLoading) return <DashboardSkeleton />;
if (isError) return <ErrorAlert error={error} />;

// Use data:
const { campaigns, applications, bookings } = dashboardData;
```

**Remove functions:**
- `fetchData()` → delete entire function
- `fetchProfiles()` → delete
- Update handlers stay but become simpler

**Progress Check**:
- [ ] Component simplified (should be ~100 lines shorter)
- [ ] No manual state management
- [ ] Loading states work
- [ ] Error states work
- [ ] Test in browser (6-7x faster!)

---

## WEEK 2: MESSAGES & PAGINATION

### Day 4-5: Realtime Messages (2-3 hours)

**File: `src/hooks/useQuery/useMessages.ts`**

Copy from [PHASE4_CODE_REFACTOR.md](PHASE4_CODE_REFACTOR.md) (Refactor 2 section)

**File: `src/pages/Messages.tsx`**

Update to use new hook:
```typescript
const { messages, isLoading } = useMessages(applicationId);

// Subscribe to changes automatically (hook handles it)
return (
  <MessageThread messages={messages} />
);
```

**Progress Check**:
- [ ] Messages load on mount
- [ ] New messages appear instantly (no polling!)
- [ ] No console errors
- [ ] Message read status updates

---

### Day 5: Index Pagination (2-3 hours)

**File: `src/lib/pagination.ts`**

Copy from [PHASE4_CODE_REFACTOR.md](PHASE4_CODE_REFACTOR.md) (Refactor 3 section)

**File: `src/pages/Index.tsx`**

Replace everything in discovery section:
```typescript
// BEFORE:
const [influencers, setInfluencers] = useState([]);
useEffect(() => {
  supabase.from('influencer_profiles').select('*'); // Loads ALL
}, []);

// AFTER:
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery(
  ['influencers', filters],
  ({ pageParam }) => getPaginatedInfluencers(filters, { cursor: pageParam }),
  { getNextPageParam: (lastPage) => lastPage.nextCursor }
);

// Render with infinite scroll trigger
```

**Progress Check**:
- [ ] Loads 20 by default
- [ ] Scroll down loads more
- [ ] Filters work server-side
- [ ] Memory usage is low
- [ ] No "loading entire dataset" on open

---

## WEEK 3: VALIDATION & ERROR HANDLING

### Day 1: Input Validation (1-2 hours)

**File: `src/lib/validation.ts`**

Copy from [PHASE4_CODE_REFACTOR.md](PHASE4_CODE_REFACTOR.md) (Refactor 4 section)

**Update all forms:**
```typescript
// Before using unsafe form:
const form = useForm({ /* no validation */ });

// After:
import { CreateCampaignSchema } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(CreateCampaignSchema),
});
```

**Progress Check**:
- [ ] All forms have Zod schemas
- [ ] Error messages show for invalid input
- [ ] Can't submit invalid data
- [ ] No console warnings

---

### Day 2: Error Boundaries (1 hour)

**File: `src/components/ErrorBoundary.tsx`**

Copy from [PHASE5_PHASE6_PRODUCTION.md](PHASE5_PHASE6_PRODUCTION.md) (Error Boundaries section)

**File: `src/App.tsx`**

```typescript
import ErrorBoundary from '@/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* app */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

**Progress Check**:
- [ ] Component crash shows error UI
- [ ] Retry button works
- [ ] Error logged to console

---

### Day 3: Sentry Integration (1-2 hours)

**Install:**
```bash
npm install @sentry/react @sentry/tracing
```

**File: `src/main.tsx`**

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
});

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <Sentry.ErrorBoundary fallback={<ErrorPage />}>
    <App />
  </Sentry.ErrorBoundary>
);
```

**File: `.env.local`**

```
VITE_SENTRY_DSN=https://key@sentry.io/project-id
```

**Progress Check**:
- [ ] Sentry dashboard connected
- [ ] Test error logged: `Sentry.captureException(new Error('test'))`
- [ ] Environment shows correctly

---

## WEEK 4: PERFORMANCE & LAUNCH

### Day 1: Image Optimization (1 hour)

**File: `src/lib/image.ts`**

Copy from [PHASE5_PHASE6_PRODUCTION.md](PHASE5_PHASE6_PRODUCTION.md) (Image Optimization section)

**Use in components:**
```typescript
import { getOptimizedImageUrl } from '@/lib/image';

<img 
  src={getOptimizedImageUrl(avatar, { width: 64 })}
  alt="Avatar"
  loading="lazy"
/>
```

**Progress Check**:
- [ ] Images load as WebP
- [ ] Smaller file sizes
- [ ] Network tab shows optimization

---

### Day 2: Code Splitting (30 minutes)

**File: `src/App.tsx`**

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const CampaignDetail = lazy(() => import('@/pages/CampaignDetail'));

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaign/:id" element={<CampaignDetail />} />
      </Routes>
    </Suspense>
  );
}
```

**Progress Check**:
- [ ] Build produces multiple chunks
- [ ] `npm run build` shows chunk sizes
- [ ] Loading screen shows while lazy component loads

---

### Day 3: Performance Audit (1 hour)

```bash
# Install Lighthouse
npm install -D lighthouse

# Run audit
npx lighthouse https://localhost:8080 --view

# Expected scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 100
```

**If scores are low:**
- [ ] Check bundle size (`npm run build`)
- [ ] Profile with Chrome DevTools
- [ ] Check main thread blocking
- [ ] Defer off-screen images

---

### Day 4-5: Testing & Deployment (2-3 hours)

```bash
# Unit tests
npm run test

# Build for production
npm run build

# Preview build
npm run preview

# Deploy
git push origin main  # If using Vercel/Netlify auto-deploy
# OR
vercel deploy --prod

# Monitor
# 1. Check Sentry dashboard for errors
# 2. Monitor Vercel/Netlify analytics
# 3. Check database CPU usage
# 4. Monitor API latency
```

**Progress Check**:
- [ ] Build succeeds without errors
- [ ] All tests passing
- [ ] No console errors in production
- [ ] Performance metrics show in Sentry

---

## VALIDATION CHECKLIST

After each week, verify:

### Week 1: Foundation
- [ ] Database indices created
- [ ] React Query working
- [ ] RPC functions callable
- [ ] No console errors

### Week 2: Dashboard
- [ ] Dashboard loads in <1s (vs 5.6s)
- [ ] Stays fast on revisit (caching)
- [ ] Messages appear instantly (realtime)
- [ ] Influencer search works (pagination)

### Week 3: Production Ready
- [ ] All forms validate input
- [ ] Errors show gracefully
- [ ] Sentry captures errors
- [ ] No data corruption

### Week 4: Optimized
- [ ] Lighthouse score 90+
- [ ] Bundle size <400KB
- [ ] All tests passing
- [ ] Production monitoring active

---

## PERFORMANCE BEFORE/AFTER TEST

```bash
# Test Dashboard load time
# BEFORE:
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/dashboard
# Should show ~5.6s

# AFTER (after all refactors):
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/dashboard
# Should show ~0.8s
```

---

## TROUBLESHOOTING

### "React Query not working"
- [ ] Check QueryClientProvider wraps entire app
- [ ] Check import paths are correct
- [ ] Run `npm list @tanstack/react-query` (should be v5+)

### "RPC function not found"
- [ ] Make sure migration ran: `supabase db list`
- [ ] Check function exists: `SELECT * FROM information_schema.routines WHERE specific_schema = 'public'`

### "Realtime not working"
- [ ] Check Supabase realtime is enabled: Project Settings → Realtime
- [ ] Check you're subscribed to correct table/event
- [ ] Check WebSocket is open in DevTools → Network

### "Sentry not capturing errors"
- [ ] Check DSN is correct in `.env.local`
- [ ] Check environment variable is loaded
- [ ] Test: `Sentry.captureMessage('test')`

### "Pagination not working"
- [ ] Check `useInfiniteQuery` has `getNextPageParam`
- [ ] Check cursor value is returned from API
- [ ] Check intersection observer element exists

---

## ESTIMATED EFFORT

| Phase | Effort | Effort when done |
|-------|--------|-----------------|
| Week 1 (Foundation) | 8-10 hours | 8-10 hrs total |
| Week 2 (Dashboard) | 10-12 hours | 18-22 hrs total |
| Week 3 (Validation) | 8-10 hours | 26-32 hrs total |
| Week 4 (Performance) | 6-8 hours | 32-40 hrs total |

**Total: 32-40 hours (approximately 1 week full-time or 2 weeks part-time)**

---

## NEXT STEPS AFTER LAUNCH

1. **Week 5**: Monitor production metrics for 1 week
2. **Week 6**: Optimize based on real usage patterns
3. **Week 7-8**: Add advanced features (search, notifications)
4. **Month 3+**: Scale infrastructure for 100k+ users

---

**START IMPLEMENTING NOW** 🚀

Follow the order above exactly. Each week builds on the previous.

Questions? Refer to code examples in [PHASE4_CODE_REFACTOR.md](PHASE4_CODE_REFACTOR.md)
