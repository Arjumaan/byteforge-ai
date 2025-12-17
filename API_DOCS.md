# ByteForge AI - API Documentation

Base URL: `http://localhost:8000/api`

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "display_name": "John Doe" // Optional
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "display_name": "John Doe",
    "provider": "local",
    "is_admin": false,
    "created_at": "2025-12-17T05:29:48.702377Z"
  },
  "tokens": {
    "refresh": "eyJhbGci...",
    "access": "eyJhbGci..."
  }
}
```

### Login
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "display_name": "John Doe",
    "provider": "local",
    "is_admin": false,
    "created_at": "2025-12-17T05:29:48.702377Z"
  },
  "tokens": {
    "refresh": "eyJhbGci...",
    "access": "eyJhbGci..."
  }
}
```

### Logout
**POST** `/auth/logout` 🔒

Logout user and invalidate refresh token.

**Request Body:**
```json
{
  "refresh": "eyJhbGci..."
}
```

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

### Get Profile
**GET** `/auth/profile` 🔒

Get current user's profile information.

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "display_name": "John Doe",
  "provider": "local",
  "is_admin": false,
  "created_at": "2025-12-17T05:29:48.702377Z"
}
```

### Update Profile
**PUT** `/auth/profile/update` 🔒

Update user's display name.

**Request Body:**
```json
{
  "display_name": "Jane Doe"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "display_name": "Jane Doe",
    "provider": "local",
    "is_admin": false,
    "created_at": "2025-12-17T05:29:48.702377Z"
  }
}
```

## Chat Endpoints

### List Conversations
**GET** `/chat/conversations` 🔒

Get all conversations for the authenticated user.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "user": 1,
    "title": "My First Chat",
    "total_tokens_used": 1234,
    "token_limit": 20000,
    "created_at": "2025-12-17T05:30:05.075205Z",
    "updated_at": "2025-12-17T05:35:22.123456Z",
    "message_count": 10,
    "last_message": {
      "content": "That's a great question!",
      "created_at": "2025-12-17T05:35:22.123456Z"
    }
  }
]
```

### Create Conversation
**POST** `/chat/conversations` 🔒

Create a new conversation.

**Request Body:**
```json
{
  "title": "New Conversation"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "user": 1,
  "title": "New Conversation",
  "total_tokens_used": 0,
  "token_limit": 20000,
  "created_at": "2025-12-17T05:40:00.000000Z",
  "updated_at": "2025-12-17T05:40:00.000000Z",
  "message_count": 0,
  "last_message": null
}
```

### Get Conversation History
**GET** `/chat/conversations/:id/history` 🔒

Get all messages in a conversation.

**Response (200 OK):**
```json
{
  "conversation": {
    "id": 1,
    "user": 1,
    "title": "My First Chat",
    "total_tokens_used": 1234,
    "token_limit": 20000,
    "created_at": "2025-12-17T05:30:05.075205Z",
    "updated_at": "2025-12-17T05:35:22.123456Z",
    "message_count": 2,
    "last_message": {...}
  },
  "messages": [
    {
      "id": 1,
      "conversation": 1,
      "user": 1,
      "role": "user",
      "content": "Hello!",
      "tokens_used": 10,
      "created_at": "2025-12-17T05:35:00.000000Z"
    },
    {
      "id": 2,
      "conversation": 1,
      "user": null,
      "role": "assistant",
      "content": "Hello! How can I help you today?",
      "tokens_used": 15,
      "created_at": "2025-12-17T05:35:01.000000Z"
    }
  ]
}
```

### Send Message
**POST** `/chat/send` 🔒

Send a message to the AI and get a response.

**Request Body:**
```json
{
  "conversation_id": 1,
  "message": "What is machine learning?"
}
```

**Response (200 OK):**
```json
{
  "user_message": {
    "id": 3,
    "conversation": 1,
    "user": 1,
    "role": "user",
    "content": "What is machine learning?",
    "tokens_used": 25,
    "created_at": "2025-12-17T05:40:00.000000Z"
  },
  "ai_response": {
    "id": 4,
    "conversation": 1,
    "user": null,
    "role": "assistant",
    "content": "Machine learning is a subset of artificial intelligence...",
    "tokens_used": 150,
    "created_at": "2025-12-17T05:40:02.000000Z"
  },
  "conversation": {
    "id": 1,
    "total_tokens_used": 1409,
    "token_limit": 20000,
    ...
  }
}
```

**Error Response (403 Forbidden) - Token Limit Reached:**
```json
{
  "error": "Token limit reached for this conversation. Please make a payment to continue.",
  "token_limit_reached": true
}
```

### Get Token Usage
**GET** `/chat/conversations/:id/token-usage` 🔒

Get token usage statistics for a conversation.

**Response (200 OK):**
```json
{
  "conversation_id": 1,
  "total_tokens_used": 1409,
  "token_limit": 20000,
  "tokens_remaining": 18591,
  "percentage_used": 7.045
}
```

## Payment Endpoints

### Create Payment
**POST** `/payments/create` 🔒

Create a payment for token top-up (mock payment).

**Request Body:**
```json
{
  "conversation_id": 1,
  "amount": 10.00,
  "tokens_to_add": 10000
}
```

**Response (201 Created):**
```json
{
  "message": "Payment successful",
  "payment": {
    "id": 1,
    "user": 1,
    "user_email": "user@example.com",
    "conversation": 1,
    "amount": "10.00",
    "tokens_added": 10000,
    "status": "success",
    "created_at": "2025-12-17T05:45:00.000000Z"
  },
  "new_token_limit": 30000
}
```

### Get Payment History
**GET** `/payments/history` 🔒

Get all payments for the authenticated user.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "user": 1,
    "user_email": "user@example.com",
    "conversation": 1,
    "amount": "10.00",
    "tokens_added": 10000,
    "status": "success",
    "created_at": "2025-12-17T05:45:00.000000Z"
  }
]
```

## Admin Endpoints

### Get Admin Dashboard
**GET** `/admin/dashboard` 🔒👑

Get platform statistics (admin only).

**Response (200 OK):**
```json
{
  "total_users": 42,
  "total_conversations": 156,
  "total_tokens_used": 1234567,
  "latest_payments": [
    {
      "id": 10,
      "user": 5,
      "user_email": "user5@example.com",
      "conversation": 23,
      "amount": "15.00",
      "tokens_added": 15000,
      "status": "success",
      "created_at": "2025-12-17T05:50:00.000000Z"
    }
  ]
}
```

**Error Response (403 Forbidden) - Not Admin:**
```json
{
  "error": "Unauthorized. Admin access required."
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "field_name": ["Error message"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

or

```json
{
  "detail": "Given token not valid for any token type"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred"
}
```

## Rate Limiting

Currently, there are no rate limits implemented. In production, consider adding:
- 100 requests per minute per user for chat endpoints
- 1000 requests per hour for authentication endpoints

## Token Pricing

- **Default**: 20,000 tokens per conversation
- **Rate**: $1 = 1,000 tokens
- **Minimum purchase**: $1 (1,000 tokens)
- **Maximum purchase**: $100 (100,000 tokens)

## Notes

- 🔒 indicates authentication required
- 👑 indicates admin access required
- All timestamps are in ISO 8601 format (UTC)
- Token counting includes both prompt and completion tokens
- Mock payment system automatically succeeds

## Example Usage with cURL

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","password2":"Test123!"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Create Conversation
```bash
curl -X POST http://localhost:8000/api/chat/conversations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Chat"}'
```

### Send Message
```bash
curl -X POST http://localhost:8000/api/chat/send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id":1,"message":"Hello AI!"}'
```

---

For more information, see the main [README.md](README.md)
