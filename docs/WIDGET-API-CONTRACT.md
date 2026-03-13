# Fugah Widget ↔ chatbot-api Contract

This document describes the exact payloads the widget sends to your Supabase `chatbot-api` Edge Function and what the backend must do to store phone numbers, conversations, and messages in Supabase.

## Endpoint

- **URL**: `https://pmzhsxlsnxvpzkiflxww.supabase.co/functions/v1/chatbot-api`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Override**: Use `data-api-url` on the script tag for staging.

---

## Common Fields (included automatically)

Every request includes:

- `storeId` – from script tag store identifier (required):
  - Salla: `data-store-id` (numeric/string store id)
  - Zid: `data-store-url` (store origin URL, e.g. `https://c1n4mc.zid.store`)
- `phone` – digits-only phone number (when available)
- `conversationId` – UUID or string (when continuing a conversation)

---

## Actions and Payloads

### 1. get_config (on widget load)

**Request:**
```json
{
  "storeId": "1351253002",
  "action": "get_config"
}
```

**Backend must:**
- Resolve store using `storeId`:
  - If numeric/id-like: lookup by Salla `store_id`
  - If URL-like: lookup by Zid `store_url`
- Return widget config (theme, position, welcome message, etc.) or empty object.
- No phone/conversation storage.

**Response example:**
```json
{
  "theme": "yellow",
  "position": "bottom-right",
  "welcomeMessage": "مرحباً بك 👋"
}
```

---

### 2. Chat message (default, no action)

**Request:**
```json
{
  "storeId": "1351253002",
  "message": "أين يقع المتجر؟",
  "phone": "966512345678",
  "conversationId": "uuid-here-or-omit-for-first-message"
}
```

**Backend must:**
1. Find or create a `conversations` row for `(store_id, customer_phone)`.
2. If no `conversationId`, create new conversation and return its ID.
3. Insert user message into `messages` table.
4. Call N8n/Superpiece for AI reply.
5. Insert bot message into `messages`.
6. Update `conversations.last_message_at`, `last_message_preview`.
7. Return AI reply and `conversationId`.

**Response:**
```json
{
  "message": "نحن متجر إلكتروني فقط.",
  "conversationId": "uuid-of-conversation"
}
```

**Important:** Phone is required. The widget blocks sending if phone is missing.

---

### 3. get_history (Messages tab)

**Request:**
```json
{
  "storeId": "1351253002",
  "action": "get_history",
  "phone": "966512345678"
}
```

**Backend must:**
- Query `conversations` where `store_id = storeId` and `customer_phone = phone`.
- Return list ordered by `updated_at` DESC.

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "last_message": "شكراً لك",
      "lastMessage": "شكراً لك",
      "created_at": "2026-03-11T12:34:56Z",
      "updated_at": "2026-03-11T12:35:00Z"
    }
  ]
}
```

---

### 4. get_messages (open conversation from list)

**Request:**
```json
{
  "storeId": "1351253002",
  "action": "get_messages",
  "phone": "966512345678",
  "conversationId": "uuid"
}
```

**Backend must:**
- Query `messages` for that conversation.
- Return array with `sender` (`user`|`bot`) and `text` (or `message`/`content`).

**Response:**
```json
{
  "messages": [
    { "id": 1, "sender": "user", "text": "أريد تتبع طلبي" },
    { "id": 2, "sender": "bot", "text": "ما هو رقم الطلب؟" }
  ]
}
```

---

### 5. ticket_request (create ticket)

**Request:**
```json
{
  "storeId": "1351253002",
  "message": "ticket_request",
  "phone": "966512345678",
  "conversationId": "uuid"
}
```

**Backend must:**
- Create row in `tickets` table.
- Mark conversation as closed/ticket_created.
- Trigger classification if needed.
- Return `{ "ticketCreated": true }` or similar.

---

### 6. rating:N (submit rating)

**Request:**
```json
{
  "storeId": "1351253002",
  "message": "rating:4",
  "phone": "966512345678",
  "conversationId": "uuid"
}
```

**Backend must:**
- Store rating (1–5) on conversation.
- Mark conversation as closed.
- Trigger `classify-conversation` if applicable.
- Return `{ "conversationEnded": true }` or similar.

---

## Widget Flow Summary

1. **Load** → `get_config`
2. **Home** → User enters phone, clicks Send → `currentCustomerPhone` stored
3. **Chat** → Each message → POST with `message`, `phone`, `conversationId`
4. **Messages tab** → `get_history` with `phone`
5. **Open conversation** → `get_messages` with `phone`, `conversationId`
6. **Create ticket** → `ticket_request` with `phone`, `conversationId`
7. **Rate** → `rating:N` with `phone`, `conversationId`

---

## Supabase Tables (recommended)

- `conversations`: `id`, `store_id`, `customer_phone`, `status`, `last_message_at`, `last_message_preview`, `last_rating`
- `messages`: `id`, `conversation_id`, `sender`, `text`, `created_at`
- `tickets`: `id`, `conversation_id`, `store_id`, `status`, `created_at`

The `chatbot-api` Edge Function must persist all of this; the widget only sends the payloads above.
