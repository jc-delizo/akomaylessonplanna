# Feature 11: Messaging System – Implementation Summary

**Date:** January 31, 2026  
**Status:** 🚧 **In Progress** (full implementation plan executed)

---

## Overview

Feature 11 (Messaging System) full implementation focused on wiring Contact Seller and Contact Buyer to the correct conversations, fixing polling and unread badge, and documenting migration status. Source: [docs/brainstorming/13-feature-11-messaging-system.md](docs/brainstorming/13-feature-11-messaging-system.md) and plan `messaging_full_implementation_31a545b2.plan.md`.

---

## 1. Conversation Model

### 1.1 Contact Seller (product page)

- **Rule:** One conversation per **buyer + seller + product** (design).
- **Entry:** Product page "Chat" button.
- **Implementation:** `ContactSellerButton` in `components/products/product-detail-layout.tsx` calls `POST /api/messages/conversations` with `seller_id`, `product_id`, then redirects to `/messages/[conversationId]`. No intermediate "New Message" form.

### 1.2 Contact Buyer (seller orders)

- **Rule:** One conversation per **buyer + seller** (any product). Product is context on first create only; reuse same conversation for later orders with same buyer.
- **Entry:** Seller orders list/table "Contact" and order detail modal "Contact Buyer".
- **Implementation:**
  - **API:** `POST /api/messages/conversations` accepts optional `buyer_id`. When current user is seller (`can_sell`), find conversation by `buyer_id` + `seller_id` (any product); if found return 200, else create with `buyer_id`, `seller_id`, `product_id` (from order), `order_id` optional, return 201.
  - **RLS:** Migration `033_conversations_seller_create_policy.sql` adds policy "Sellers can create conversations" so `seller_id = auth.uid()` can INSERT.
  - **UI:** `ContactBuyerButton` in `app/shop/orders/page.tsx` (table, mobile card, modal) calls find-or-create then redirects to `/messages/[conversationId]`.

---

## 2. Entry Points

| Entry point              | Params              | Behavior                                                                 |
|--------------------------|---------------------|--------------------------------------------------------------------------|
| Product page "Chat"      | seller_id, product_id | Client button → POST → redirect to conversation                         |
| Seller orders "Contact"  | buyer_id, product_id, order_id | Client button → POST (seller-initiated) → redirect                      |
| Seller profile "Contact Seller" | sellerId (no product) | Link to `/messages/new?sellerId=...`; new page auto-create/redirect if logged in |
| `/messages/new` with ?sellerId (& productId) | URL query           | Auto POST create/find and redirect when user is logged in                |

---

## 3. Polling

- **Design:** 30-second polling; pause when tab is hidden.
- **Implementation:**
  - **Client:** `lib/hooks/useMessages.ts` – sends `after=<last_message_created_at>` (ISO timestamp), not message ID. Supports `initialAfter` so conversation view can pass last loaded message timestamp. Tab visibility: stop polling when `document.hidden`, resume when visible.
  - **API:** `GET /api/messages/new` – filters by `after` (timestamp), `conversation_id` (optional), user’s conversations; excludes messages sent by current user.
  - **Conversation view:** `components/messaging/conversation-view.tsx` uses `useMessages({ conversationId, enabled: true, initialAfter: lastLoadedMessageCreatedAt, onNewMessage })`; new messages are merged and scroll-to-bottom on new message.

---

## 4. Unread Count and Badge

- **Design:** Unread count on **Messages** icon only (navbar and seller sidebar); not in the main notifications bell.
- **Implementation:**
  - **API:** `GET /api/messages/unread-count` returns `{ unread_count: number }` – counts messages where recipient = current user and `is_read = false` (conversations user is in, sender ≠ current user).
  - **Navbar:** `components/navigation/main-nav.tsx` fetches `/api/messages/unread-count` (and polls every 30s) for Messages icon badge; shows "9+" when > 9.
  - **Seller sidebar:** `components/dashboard/dashboard-sidebar.tsx` uses same endpoint for Messages link badge.
  - **Refresh:** Badge updates on next poll (30s); after read/send, next poll or refetch updates count (no local decrement in this pass).

---

## 5. Migration Status Updates (docs only)

- **IMPLEMENTATION-STATUS.md:** Migrations 019, 020, 027, 031, 032 set to ✅ Applied.
- **docs/DATABASE-MIGRATIONS-INDEX.md:** 019, 020, 027 status set to ✅ Applied (note: may be applied manually in Supabase SQL editor).
- **New migration:** `033_conversations_seller_create_policy.sql` – RLS policy so sellers can create conversations (Contact Buyer flow). Apply when deploying.

---

## 6. Files Touched

- `components/products/product-detail-layout.tsx` – ContactSellerButton
- `app/api/messages/conversations/route.ts` – seller-initiated find/create (buyer_id)
- `app/shop/orders/page.tsx` – ContactBuyerButton (table, mobile, modal)
- `app/messages/new/page.tsx` – auto create/redirect when sellerId (and optional productId) in URL
- `lib/hooks/useMessages.ts` – after=created_at, initialAfter, tab visibility
- `app/api/messages/new/route.ts` – (unchanged; already filters by conversation_id and after timestamp)
- `components/messaging/conversation-view.tsx` – useMessages with initialAfter and onNewMessage
- `app/api/messages/unread-count/route.ts` – new lightweight endpoint
- `components/navigation/main-nav.tsx` – use unread-count for Messages badge
- `components/dashboard/dashboard-sidebar.tsx` – use unread-count for Messages badge
- `supabase/migrations/033_conversations_seller_create_policy.sql` – new
- `IMPLEMENTATION-STATUS.md` – migration table and Feature 11 detail
- `docs/DATABASE-MIGRATIONS-INDEX.md` – 019, 020, 027 status

---

## 7. Remaining (not in this pass)

- Quick reply templates (5 system + 5 custom Pro) – UI wiring
- Away message wiring
- Image attachments (3 images, 5MB) – upload/display
- Auto-flagging (external links, profanity, spam)
- Admin: join conversation, resolve disputes, flagged queue
- Message retention/archive (e.g. 1 year soft delete)
- Supabase Realtime (post-MVP; design doc notes consider for scale)

---

## 8. Verification

- **Contact Seller:** From product page, click Chat → one request → redirect to conversation (existing or new).
- **Contact Buyer:** From any order, click Contact/Contact Buyer → one request → redirect to single buyer–seller conversation (reused across orders).
- **Polling:** Open a conversation; send message from other account; within ~30s new message appears; hide tab then show – polling resumes.
- **Unread badge:** Messages icon in nav and seller sidebar shows count; open conversation and read – count updates on next poll (or refetch).
- **Seller profile:** Click "Contact Seller" → if logged in, auto-redirect to conversation; if not, show new message form.

---

**For AI agents:** This summary reflects the full implementation plan execution. Migration 033 must be applied for Contact Buyer (seller-initiated) to work. No message count is shown in the main notifications bell (by design).
