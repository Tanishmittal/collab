# PHASE 3: EXECUTION PLAN

## IMPLEMENTATION ROADMAP

Each step is independently deployable. Steps can be done in parallel (e.g., steps 1-3).

---

## SPRINT 1: Foundation (Week 1)

### Step 1: Database Optimization ✅ CRITICAL
**Effort**: 2 hours | **Impact**: 50% query speed improvement

Create new migration:
```
supabase/migrations/20260315120000_add_production_indices.sql
```

What to add:
- Foreign key indices (9 indices)
- Search indices (4 indices)  
- Composite indices (3 indices)
- Full-text search index (1 index)

**Deployment**: Zero downtime (indices added in background)

---

### Step 2: Setup React Query ✅ FOUNDATION
**Effort**: 3 hours | **Impact**: Enables caching layer

Files to create:
```
src/lib/queryClient.ts          (QueryClient config)
src/hooks/useQuery/             (custom hook wrappers)
├── useDashboardData.ts
├── useCampaigns.ts
├── useInfluencers.ts
├── useBookings.ts
├── useMessages.ts
└── useApplications.ts
```

Update files:
```
src/App.tsx                      (wrap with QueryClientProvider)
package.json                     (ensure @tanstack/react-query v5+)
```

---

### Step 3: Create BFF Layer ✅ INFRASTRUCTURE
**Effort**: 4 hours | **Impact**: Query optimization + control

Create Edge Functions:
```
supabase/functions/
├── api/dashboard/get.ts        (Dashboard RPC)
├── api/campaigns/list.ts       (Paginated campaigns)
├── api/influencers/list.ts     (Paginated influencers)
├── api/bookings/list.ts        (Optimized bookings with joins)
├── api/messages/list.ts        (Conversations + unread count)
├── api/applications/list.ts    (Applications with influencer data)
└── api/send-message.ts         (Message creation + broadcaster)
```

**Key**: Each function uses RPC or optimized selects with joins

---

## SPRINT 2: Integration (Week 2)

### Step 4: Migrate Dashboard to React Query ✅ HIGH IMPACT
**Effort**: 3 hours | **Impact**: Dashboard 7x faster

File: `src/pages/Dashboard.tsx`

Changes:
```tsx
// Remove:
const [campaigns, setCampaigns] = useState([]);
const [applications, setApplications] = useState([]);
const [bookings, setBookings] = useState([]);
useEffect(() => { fetchData(); }, [user]);

// Add:
const { data, isLoading, error } = useDashboardData(user?.id);

// Simplify:
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardContent data={data} />
</Suspense>
```

**Benefit**: 
- Automatic loading state
- Automatic error handling
- Automatic retry logic
- 5-min cache

---

### Step 5: Migrate Messages to Realtime Subscriptions ✅ KEY FEATURE
**Effort**: 2 hours | **Impact**: Real-time messaging + 80% bandwidth ↓

File: `src/pages/Messages.tsx`

Changes:
```tsx
// Remove polling:
useEffect(() => {
  const interval = setInterval(() => fetchMessages(), 5000);
  return () => clearInterval(interval);
}, []);

// Add realtime subscription:
useEffect(() => {
  const channel = supabase
    .channel('messages')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, 
      (payload) => handleMessageChange(payload))
    .subscribe();
  
  return () => channel.unsubscribe();
}, []);
```

---

### Step 6: Migrate Index (Home) to Pagination ✅ SCALABILITY
**Effort**: 3 hours | **Impact**: Handles 100k+ influencers

File: `src/pages/Index.tsx`

Changes:
```tsx
// Remove:
supabase.from("influencer_profiles").select("*")  // No limit!

// Add:
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery(['influencers', filters], 
  ({ pageParam }) => getPaginatedInfluencers(filters, { cursor: pageParam }),
  { getNextPageParam: (lastPage) => lastPage.nextCursor }
);
```

---

## SPRINT 3: Hardening (Week 3)

### Step 7: Input Validation with Zod ✅ SECURITY
**Effort**: 2 hours | **Impact**: Prevents invalid data + XSS

File: `src/lib/validation.ts`

Create schemas:
```typescript
import { z } from 'zod';

export const CreateCampaignSchema = z.object({
  brand: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  budget: z.number().min(100).max(10000000),
  niche: z.enum(['Fashion', 'Beauty', 'Tech', ...]),
  city: z.string().min(1),
  // ... more fields
});

export const CreateMessageSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
  applicationId: z.string().uuid(),
});
```

Update forms to validate:
```tsx
const form = useForm({ resolver: zodResolver(CreateCampaignSchema) });
```

---

### Step 8: Error Boundaries ✅ RELIABILITY
**Effort**: 1 hour | **Impact**: Graceful degradation

Create:
```
src/components/ErrorBoundary.tsx
src/components/ErrorFallback.tsx
```

Wrap app:
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

---

### Step 9: Error Logging (Sentry) ✅ OBSERVABILITY
**Effort**: 1 hour | **Impact**: Production debugging

Install: `npm install @sentry/react`

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

---

## SPRINT 4: Performance (Week 4)

### Step 10: Image Optimization ✅ UX
**Effort**: 2 hours | **Impact**: 70% faster image loads

Create image utility:
```typescript
// src/lib/image.ts
export const getOptimizedImageUrl = (url: string, width: number) => {
  // Use Supabase image transformation or external CDN
  return `${url}?w=${width}&q=80&f=webp`;
};
```

Update components:
```tsx
<img src={getOptimizedImageUrl(avatar, 64)} alt="" />
```

---

### Step 11: Code Splitting ✅ PERFORMANCE
**Effort**: 1 hour | **Impact**: 50% better initial load

```typescript
// src/pages are already lazy-loaded via React Router
// Ensure all heavy components are lazy:

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const CampaignDetail = lazy(() => import('@/pages/CampaignDetail'));
```

---

### Step 12: Monitoring Dashboard ✅ OBSERVABILITY
**Effort**: 3 hours | **Impact**: Understands performance

Setup (choose one):
- **Vercel Analytics** (easiest for deployment)
- **Sentry Performance**
- **DataDog**

Tracks:
- Page load times
- API response times
- Error rates
- Custom business metrics

---

## SPRINT 5: Advanced Features (Week 5)

### Step 13: Offline Support ✅ RELIABILITY
**Effort**: 4 hours | **Impact**: Works without internet

```typescript
// Create service worker for offline cache
// Enable IndexedDB for local data storage
```

---

### Step 14: Admin Panel ✅ MAINTENANCE
**Effort**: 3 hours | **Impact**: Moderation + analytics

Create:
```
src/pages/admin/
├── Dashboard.tsx       (overview metrics)
├── Users.tsx          (user management)
├── Campaigns.tsx      (campaign moderation)
└── Reports.tsx        (abuse reports)
```

---

### Step 15: Analytics & Tracking ✅ INSIGHTS
**Effort**: 2 hours | **Impact**: User behavior data

Setup:
- Segment or Mixpanel for events
- Google Analytics 4 for funnel analysis

Track:
- Sign-up flow
- Campaign creation
- Application sent
- Message sent
- Search queries

---

## DEPLOYMENT STRATEGY

### Phased Rollout

```
Week 1 (Sprint 1):
  Day 1: Deploy indices (no downtime)
  Day 2: Deploy React Query hooks (feature flag behind flag)
  Day 3: Deploy BFF functions
  
Week 2 (Sprint 2):
  Day 1-2: Deploy Dashboard migration (10% of users)
  Day 3: Scale to 50% if no errors
  Day 4: 100% rollout
  
  Day 5-6: Deploy realtime messages
  Day 7: Deploy pagination
  
Week 3 (Sprint 3):
  Deploy validation, error boundaries, Sentry
  
Week 4-5:
  Deploy performance & advanced features
```

### Rollback Strategy

Each deployment has:
- Feature flags to disable instantly
- Database migration reversions (if needed)
- Monitoring alerts on errors

---

## TESTING STRATEGY

### Before Each Sprint

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# Load testing (before major deploy)
npm run test:load -- --users=1000 --duration=5m

# Lighthouse
npm run test:lighthouse
```

### Success Metrics

After each sprint:

| Metric | Target | Current | Deadline |
|--------|--------|---------|----------|
| Dashboard load | <1s | 5.6s | Week 2 |
| API calls/page | <5 | 26 | Week 2 |
| Message latency | <500ms | 5s | Week 2 |
| Influencer search | <2s | ∞ | Week 2 |
| Error rate | <0.1% | TBD | Week 3 |
| Lighthouse score | >90 | ~70 | Week 4 |

---

## RESOURCES NEEDED

### Team
- 1 Backend Engineer (BFF + database)
- 1 Frontend Engineer (React Query + components)
- 1 DevOps (monitoring + deployment)
- Total: Can be done by 1-2 people over 4 weeks

### Infrastructure
- No new infrastructure needed
- Supabase handles scaling

### Tools
- Sentry account (free tier ok)
- Vercel Analytics (included)
- Load testing tool (k6 or artillery)

---

## RISK MITIGATION

| Risk | Mitigation | Owner |
|------|-----------|-------|
| Cache invalidation bugs | Comprehensive testing + monitoring | Backend eng |
| Realtime connection drops | Fallback to polling + reconnection logic | Backend eng |
| Query optimization fails | Rollback to old queries (feature flag) | Backend eng |
| Breaking changes | Comprehensive test coverage | Frontend eng |
| Data loss during migration | Full backup before any migration | DevOps |

---

## POST-LAUNCH: WEEKS 6+

### Week 6-8: Optimization
- A/B test UI changes
- Profile optimization based on Sentry data
- Database query analysis

### Week 8-12: Features
- Push notifications
- Search autocomplete
- Advanced filters
- Recommendation engine

### Month 4+: Scaling
- CDN for static assets
- Read replicas for high-volume queries
- Kubernetes orchestration (if needed)

---

**PHASE 3 COMPLETE** ✅

Ready for PHASE 4: Code Refactor
