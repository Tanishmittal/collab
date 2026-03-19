# Placeholder And Mock-Backed Feature Audit

Last updated: March 19, 2026

## Purpose

This document lists features and code paths that are:

- user-facing placeholders
- mock-backed features that look real
- static data that may be acceptable for now
- legacy or dead code that should likely be removed

The goal is to make it easy to decide, item by item, whether to:

- keep
- wire up
- replace with real data
- delete

## Summary

### Highest-priority cleanup

1. Replace mocked review and portfolio data in `UnifiedProfile`.
2. Delete the stale `RegisterBrand.tsx.backup` file.
3. Confirm whether legacy `BrandProfile` and `InfluencerProfile` pages are still needed.
4. Decide whether dashboard search and notifications are real roadmap items or should be hidden for now.

## Decision Table

| Area | File / Reference | Current State | Decision | Priority | Notes |
| --- | --- | --- | --- | --- | --- |
| Brand messaging | [src/pages/BrandProfile.tsx:192](src/pages/BrandProfile.tsx) | `Message Brand` only shows a "Coming Soon" toast | Delete with page, or wire only if page is kept | Medium | This page appears to be legacy, so wiring this here is probably wasted work |
| Dashboard search | [src/components/DashboardLayout.tsx:47](src/components/DashboardLayout.tsx) | Search input is visual only; no state/query/action | Wire up or hide | Medium | If global dashboard search is not imminent, hiding is cleaner than shipping fake affordance |
| Dashboard notifications | [src/components/DashboardLayout.tsx:54](src/components/DashboardLayout.tsx) | Bell icon with unread dot but no behavior | Wire up or hide | Medium | The red dot implies real unread state, so it is misleading today |
| Unified influencer review summary | [src/pages/UnifiedProfile.tsx:221](src/pages/UnifiedProfile.tsx) | Summary/stats come from mocked helper data | Replace with real data | High | This is public-facing and appears production-real |
| Unified influencer portfolio | [src/pages/UnifiedProfile.tsx:222](src/pages/UnifiedProfile.tsx) | Portfolio/gallery comes from mocked helper data | Replace with real data | High | Another public-facing feature that should not stay fake |
| Legacy influencer review summary | [src/pages/InfluencerProfile.tsx:133](src/pages/InfluencerProfile.tsx) | Uses mocked helper data | Delete with page, or replace only if page is kept | Low | Likely legacy page |
| Legacy influencer portfolio | [src/pages/InfluencerProfile.tsx:134](src/pages/InfluencerProfile.tsx) | Uses mocked helper data | Delete with page, or replace only if page is kept | Low | Likely legacy page |
| Mock review helper source | [src/data/profileData.ts:24](src/data/profileData.ts) | Hardcoded reviews | Remove after profile pages stop using it | Medium | Safe to delete once no live page imports it |
| Mock portfolio helper source | [src/data/profileData.ts:48](src/data/profileData.ts) | Hardcoded portfolio items | Remove after profile pages stop using it | Medium | Safe to delete once no live page imports it |
| Legacy brand profile page | [src/pages/BrandProfile.tsx](src/pages/BrandProfile.tsx) | Exists, but routing uses `UnifiedProfile` for `/brand/:id` | Delete or archive after confirmation | Medium | See `App.tsx` route behavior |
| Legacy influencer profile page | [src/pages/InfluencerProfile.tsx](src/pages/InfluencerProfile.tsx) | Older profile implementation still in repo | Delete or archive after confirmation | Medium | Public profile routing appears to use `UnifiedProfile` now |
| Backup page file | [src/pages/RegisterBrand.tsx.backup](src/pages/RegisterBrand.tsx.backup) | Stale backup file checked in | Delete | High | No reason to keep in production repo |
| Static taxonomies | [src/components/SearchFilters.tsx:4](src/components/SearchFilters.tsx) | Cities/niches come from static mock constants | Keep for now | Low | Not ideal, but not necessarily a placeholder |
| Static taxonomies | [src/components/CampaignForm.tsx:23](src/components/CampaignForm.tsx) | Cities/niches from static mock constants | Keep for now | Low | Replace only if admin-managed taxonomy is needed |
| Static taxonomies | [src/components/BrandRegistrationForm.tsx:26](src/components/BrandRegistrationForm.tsx) | Cities/niches from static mock constants | Keep for now | Low | Same as above |
| Static taxonomies | [src/components/InfluencerRegistrationForm.tsx:15](src/components/InfluencerRegistrationForm.tsx) | Cities/niches from static mock constants | Keep for now | Low | Same as above |
| Static taxonomies | [src/pages/EditBrandProfile.tsx:12](src/pages/EditBrandProfile.tsx) | Cities/niches from static mock constants | Keep for now | Low | Same as above |
| Static taxonomies | [src/pages/EditInfluencerProfile.tsx:14](src/pages/EditInfluencerProfile.tsx) | Cities/niches from static mock constants | Keep for now | Low | Same as above |

## Detailed Notes

### 1. User-Facing Placeholder UI

These are the clearest "looks interactive but is not really implemented" items.

#### Brand message CTA

- File: [src/pages/BrandProfile.tsx:192](src/pages/BrandProfile.tsx)
- Behavior: clicking `Message Brand` only triggers a toast saying messaging is coming soon
- Recommendation:
  - if `BrandProfile.tsx` is removed, do nothing
  - if the page stays, replace this with real messaging or remove the button

#### Dashboard search

- File: [src/components/DashboardLayout.tsx:47](src/components/DashboardLayout.tsx)
- Behavior: search box renders but does nothing
- Recommendation:
  - hide it until search exists
  - or wire it to a dashboard-wide search flow

#### Dashboard notifications

- File: [src/components/DashboardLayout.tsx:54](src/components/DashboardLayout.tsx)
- Behavior: notification bell and red unread dot are visual only
- Recommendation:
  - remove unread dot until real notification state exists
  - or implement notification center/inbox

### 2. Mock-Backed Features That Look Production-Real

These are more important than the obvious placeholders because users may assume they are real.

#### Unified profile review summary

- File: [src/pages/UnifiedProfile.tsx:221](src/pages/UnifiedProfile.tsx)
- Current behavior:
  - calls `getReviewsForInfluencer(influencer.id)`
  - summary numbers derive from hardcoded review data
- Risk:
  - public profile pages can show fake review counts/ratings even if real reviews exist elsewhere
- Recommendation:
  - replace with live aggregate review queries

#### Unified profile portfolio

- File: [src/pages/UnifiedProfile.tsx:222](src/pages/UnifiedProfile.tsx)
- Current behavior:
  - calls `getPortfolioForInfluencer(influencer.id)`
  - gallery content is hardcoded
- Risk:
  - this can misrepresent creator work as real campaign history
- Recommendation:
  - replace with live portfolio/collaboration content
  - or hide the section until real data exists

#### Legacy influencer profile page using mocks

- Files:
  - [src/pages/InfluencerProfile.tsx:133](src/pages/InfluencerProfile.tsx)
  - [src/pages/InfluencerProfile.tsx:134](src/pages/InfluencerProfile.tsx)
  - [src/pages/InfluencerProfile.tsx:380](src/pages/InfluencerProfile.tsx)
- Current behavior:
  - still uses mocked review and portfolio helpers
  - explicitly labels a section as `mock reviews`
- Recommendation:
  - likely delete the page rather than fix it

#### Mock helper source

- File: [src/data/profileData.ts](src/data/profileData.ts)
- Current behavior:
  - returns hardcoded reviews and hardcoded portfolio content
- Recommendation:
  - keep only until all profile pages stop importing it
  - then delete

### 3. Legacy Or Dead Code

#### BrandProfile page

- File: [src/pages/BrandProfile.tsx](src/pages/BrandProfile.tsx)
- Current status:
  - page exists
  - public brand route appears to use `UnifiedProfile` instead
- Recommendation:
  - confirm there are no internal/manual links still using it
  - then delete or archive

#### InfluencerProfile page

- File: [src/pages/InfluencerProfile.tsx](src/pages/InfluencerProfile.tsx)
- Current status:
  - older profile implementation remains in repo
  - profile routes appear to use `UnifiedProfile`
- Recommendation:
  - confirm it is not imported by any active route
  - then delete or archive

#### RegisterBrand backup

- File: [src/pages/RegisterBrand.tsx.backup](src/pages/RegisterBrand.tsx.backup)
- Current status:
  - stale backup file
- Recommendation:
  - delete

### 4. Static Data That Is Probably Fine For Now

These are not ideal if you want dynamic admin control, but they are not automatically broken placeholders.

#### Static city and niche lists

- Files:
  - [src/components/SearchFilters.tsx:4](src/components/SearchFilters.tsx)
  - [src/components/CampaignForm.tsx:23](src/components/CampaignForm.tsx)
  - [src/components/BrandRegistrationForm.tsx:26](src/components/BrandRegistrationForm.tsx)
  - [src/components/InfluencerRegistrationForm.tsx:15](src/components/InfluencerRegistrationForm.tsx)
  - [src/pages/EditBrandProfile.tsx:12](src/pages/EditBrandProfile.tsx)
  - [src/pages/EditInfluencerProfile.tsx:14](src/pages/EditInfluencerProfile.tsx)
- Current behavior:
  - cities and niches come from static constants under mock data
- Recommendation:
  - keep for now if taxonomy changes rarely
  - replace with DB/admin-managed lists only if needed

## Not Placeholders

These came up during review but appear to be real features or valid disabled states.

- Campaign application flow in [src/pages/CampaignDetail.tsx:547](src/pages/CampaignDetail.tsx)
- Social verification flow in [src/components/SocialVerification.tsx:77](src/components/SocialVerification.tsx)
- Disabled completed/closed campaign states in:
  - [src/pages/CampaignDetail.tsx:539](src/pages/CampaignDetail.tsx)
  - [src/pages/Dashboard.tsx:680](src/pages/Dashboard.tsx)

## Recommended Execution Order

### Phase 1

- Replace mocked review and portfolio data in `UnifiedProfile`
- Delete `RegisterBrand.tsx.backup`

### Phase 2

- Confirm and remove legacy `BrandProfile`
- Confirm and remove legacy `InfluencerProfile`
- Delete `profileData.ts` if no longer referenced

### Phase 3

- Decide whether dashboard search should exist now
- Decide whether notifications should exist now
- Hide or implement those affordances accordingly

## Owner Notes

Use this section to assign decisions:

| Item | Decision | Owner | Due Date | Notes |
| --- | --- | --- | --- | --- |
| UnifiedProfile review summary |  |  |  |  |
| UnifiedProfile portfolio |  |  |  |  |
| Dashboard search |  |  |  |  |
| Dashboard notifications |  |  |  |  |
| BrandProfile page |  |  |  |  |
| InfluencerProfile page |  |  |  |  |
| RegisterBrand backup file |  |  |  |  |

