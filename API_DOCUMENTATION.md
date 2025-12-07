# 📚 FAHEEMLY API Documentation
## Complete API Reference Guide

> **Version:** 2.0.0  
> **Base URL:** `https://api.faheemly.com` or `http://localhost:3001`  
> **Authentication:** Bearer Token (JWT)

---

## 🔐 Authentication

### Register New User
Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "user_123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CLIENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Login
Authenticate and get access token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CLIENT"
  }
}
```

---

### Get Current User
Get authenticated user profile.

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CLIENT",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Logout
Invalidate current session.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🏢 Business Management

### Create Business
Create a new business/bot.

**Endpoint:** `POST /api/businesses`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "name": "My Restaurant",
  "activityType": "RESTAURANT",
  "language": "ar",
  "botTone": "friendly",
  "primaryColor": "#6366F1"
}
```

**Activity Types:**
- RESTAURANT, CAFE, BAKERY
- CLINIC, HOSPITAL, PHARMACY, DENTAL
- RETAIL, FASHION, ELECTRONICS, JEWELRY, FURNITURE
- COMPANY, CONSULTING, LEGAL, ACCOUNTING
- REALESTATE, EDUCATION, SCHOOL, UNIVERSITY
- HOTEL, TRAVEL, TOURISM
- SALON, SPA, GYM
- IT, SOFTWARE, MARKETING, DESIGN
- OTHER

**Response (201):**
```json
{
  "success": true,
  "business": {
    "id": "biz_456def",
    "name": "My Restaurant",
    "activityType": "RESTAURANT",
    "status": "TRIAL",
    "planType": "TRIAL",
    "messageQuota": 1000,
    "messagesUsed": 0
  }
}
```

---

### Get All Businesses
Get all businesses for the authenticated user.

**Endpoint:** `GET /api/businesses`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "businesses": [
    {
      "id": "biz_456def",
      "name": "My Restaurant",
      "activityType": "RESTAURANT",
      "status": "ACTIVE",
      "messagesUsed": 150,
      "messageQuota": 1000
    }
  ]
}
```

---

### Get Business Details
Get specific business details.

**Endpoint:** `GET /api/businesses/:businessId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "business": {
    "id": "biz_456def",
    "name": "My Restaurant",
    "activityType": "RESTAURANT",
    "language": "ar",
    "status": "ACTIVE",
    "planType": "PRO",
    "botTone": "friendly",
    "primaryColor": "#6366F1",
    "widgetConfig": {
      "welcomeMessage": "مرحباً! كيف يمكنني مساعدتك؟",
      "showBranding": true
    }
  }
}
```

---

### Update Business
Update business settings.

**Endpoint:** `PUT /api/businesses/:businessId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "name": "Updated Restaurant Name",
  "botTone": "professional",
  "primaryColor": "#FF5733",
  "widgetConfig": {
    "welcomeMessage": "مرحباً بك في مطعمنا!",
    "showBranding": false
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "business": {
    "id": "biz_456def",
    "name": "Updated Restaurant Name",
    "botTone": "professional"
  }
}
```

---

### Delete Business
Delete a business permanently.

**Endpoint:** `DELETE /api/businesses/:businessId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Business deleted successfully"
}
```

---

## 📚 Knowledge Base Management

### Add Knowledge
Add content to business knowledge base.

**Endpoint:** `POST /api/knowledge/:businessId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

**Request Body (Text):**
```json
{
  "type": "TEXT",
  "content": "مطعمنا يفتح من 9 صباحاً حتى 11 مساءً. نقدم أفضل المأكولات الشرقية والغربية."
}
```

**Request Body (URL):**
```json
{
  "type": "URL",
  "content": "https://example.com/menu"
}
```

**Request Body (PDF Upload):**
```
Content-Type: multipart/form-data

Fields:
- type: PDF
- file: [PDF file]
```

**Response (201):**
```json
{
  "success": true,
  "knowledge": {
    "id": "kb_789ghi",
    "type": "TEXT",
    "content": "مطعمنا يفتح من 9 صباحاً...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get All Knowledge
Get all knowledge base entries for a business.

**Endpoint:** `GET /api/knowledge/:businessId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "knowledge": [
    {
      "id": "kb_789ghi",
      "type": "TEXT",
      "content": "مطعمنا يفتح من 9 صباحاً...",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "kb_789ghj",
      "type": "URL",
      "content": "https://example.com/menu",
      "metadata": {
        "title": "Restaurant Menu",
        "scrapedAt": "2024-01-15T10:30:00Z"
      }
    }
  ]
}
```

---

### Delete Knowledge
Delete a knowledge base entry.

**Endpoint:** `DELETE /api/knowledge/:businessId/:knowledgeId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Knowledge deleted successfully"
}
```

---

## 💬 Chat & Conversations

### Start Conversation
Start a new chat conversation.

**Endpoint:** `POST /api/chat/:businessId/start`

**Request Body:**
```json
{
  "channel": "WIDGET",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://example.com"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "conversationId": "conv_abc123",
  "message": "Conversation started"
}
```

---

### Send Message
Send a message in conversation.

**Endpoint:** `POST /api/chat/:conversationId/message`

**Request Body:**
```json
{
  "message": "ما هي أوقات العمل؟"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": {
    "id": "msg_xyz789",
    "role": "USER",
    "content": "ما هي أوقات العمل؟",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "reply": {
    "id": "msg_xyz790",
    "role": "ASSISTANT",
    "content": "مطعمنا يفتح من الساعة 9 صباحاً حتى 11 مساءً يومياً. نحن في خدمتكم طوال الأسبوع!",
    "createdAt": "2024-01-15T10:30:05Z"
  },
  "tokensUsed": 45,
  "aiModel": "grok"
}
```

---

### Get Conversation History
Get all messages in a conversation.

**Endpoint:** `GET /api/chat/:conversationId/history`

**Response (200):**
```json
{
  "success": true,
  "conversation": {
    "id": "conv_abc123",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T10:25:00Z"
  },
  "messages": [
    {
      "id": "msg_xyz789",
      "role": "USER",
      "content": "ما هي أوقات العمل؟",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "msg_xyz790",
      "role": "ASSISTANT",
      "content": "مطعمنا يفتح من الساعة 9 صباحاً...",
      "createdAt": "2024-01-15T10:30:05Z"
    }
  ]
}
```

---

### Rate Conversation
Rate and provide feedback for a conversation.

**Endpoint:** `POST /api/chat/:conversationId/rate`

**Request Body:**
```json
{
  "rating": 5,
  "feedback": "خدمة ممتازة وسريعة!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Rating submitted successfully"
}
```

---

## 📊 Dashboard & Analytics

### Get Dashboard Stats
Get overview statistics for a business.

**Endpoint:** `GET /api/dashboard/:businessId/stats`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Query Parameters:**
- `period`: day | week | month | year (default: month)

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalConversations": 450,
    "totalMessages": 2340,
    "messagesUsed": 2340,
    "messageQuota": 10000,
    "quotaPercentage": 23.4,
    "averageRating": 4.7,
    "activeConversations": 12,
    "completedConversations": 438,
    "knowledgeBaseItems": 25
  }
}
```

---

### Get Analytics
Get detailed analytics data.

**Endpoint:** `GET /api/dashboard/:businessId/analytics`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Query Parameters:**
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response (200):**
```json
{
  "success": true,
  "analytics": {
    "conversationsByDay": [
      { "date": "2024-01-15", "count": 45 },
      { "date": "2024-01-16", "count": 52 }
    ],
    "messagesByHour": [
      { "hour": 9, "count": 120 },
      { "hour": 10, "count": 145 }
    ],
    "topQuestions": [
      { "question": "ما هي أوقات العمل؟", "count": 89 },
      { "question": "كيف أطلب توصيل؟", "count": 67 }
    ],
    "averageResponseTime": 2.3,
    "satisfactionRate": 94.5
  }
}
```

---

### Get Recent Conversations
Get list of recent conversations.

**Endpoint:** `GET /api/dashboard/:businessId/conversations/recent`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Query Parameters:**
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response (200):**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv_abc123",
      "channel": "WIDGET",
      "status": "CLOSED",
      "messageCount": 8,
      "rating": 5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 450,
  "limit": 20,
  "offset": 0
}
```

---

## 🎫 Support Tickets

### Create Ticket
Create a new support ticket.

**Endpoint:** `POST /api/tickets`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "businessId": "biz_456def",
  "subject": "Need help with integration",
  "priority": "MEDIUM"
}
```

**Priorities:** LOW | MEDIUM | HIGH | URGENT

**Response (201):**
```json
{
  "success": true,
  "ticket": {
    "id": "ticket_abc123",
    "subject": "Need help with integration",
    "status": "OPEN",
    "priority": "MEDIUM",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get All Tickets
Get all support tickets for user.

**Endpoint:** `GET /api/tickets`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "tickets": [
    {
      "id": "ticket_abc123",
      "subject": "Need help with integration",
      "status": "IN_PROGRESS",
      "priority": "MEDIUM",
      "messageCount": 3,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T14:20:00Z"
    }
  ]
}
```

---

### Get Ticket Details
Get specific ticket with messages.

**Endpoint:** `GET /api/tickets/:ticketId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "ticket": {
    "id": "ticket_abc123",
    "subject": "Need help with integration",
    "status": "IN_PROGRESS",
    "priority": "MEDIUM",
    "messages": [
      {
        "id": "msg_001",
        "senderId": "user_123abc",
        "message": "I need help setting up WhatsApp",
        "isAdmin": false,
        "createdAt": "2024-01-15T10:30:00Z"
      },
      {
        "id": "msg_002",
        "senderId": "admin_001",
        "message": "Sure! I can help with that...",
        "isAdmin": true,
        "createdAt": "2024-01-15T11:00:00Z"
      }
    ]
  }
}
```

---

### Add Message to Ticket
Add a message/reply to a ticket.

**Endpoint:** `POST /api/tickets/:ticketId/messages`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "message": "Thank you! That helped a lot."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": {
    "id": "msg_003",
    "message": "Thank you! That helped a lot.",
    "createdAt": "2024-01-15T11:30:00Z"
  }
}
```

---

## 👨‍💼 Admin Panel

### Get All Users
Get list of all users (Admin only).

**Endpoint:** `GET /api/admin/users`

**Headers:**
```
Authorization: Bearer [ADMIN_TOKEN]
```

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 50)
- `role`: SUPERADMIN | CLIENT | AGENT
- `search`: string

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "user_123abc",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CLIENT",
      "isActive": true,
      "businessCount": 2,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 3
}
```

---

### Get All Businesses
Get list of all businesses (Admin only).

**Endpoint:** `GET /api/admin/businesses`

**Headers:**
```
Authorization: Bearer [ADMIN_TOKEN]
```

**Query Parameters:**
- `page`: number
- `status`: TRIAL | ACTIVE | SUSPENDED | CANCELLED
- `planType`: TRIAL | BASIC | PRO | AGENCY | ENTERPRISE

**Response (200):**
```json
{
  "success": true,
  "businesses": [
    {
      "id": "biz_456def",
      "name": "My Restaurant",
      "owner": {
        "id": "user_123abc",
        "name": "John Doe",
        "email": "user@example.com"
      },
      "activityType": "RESTAURANT",
      "status": "ACTIVE",
      "planType": "PRO",
      "messagesUsed": 2340,
      "messageQuota": 10000,
      "createdAt": "2024-01-10T10:00:00Z"
    }
  ]
}
```

---

### Get System Stats
Get overall system statistics (Admin only).

**Endpoint:** `GET /api/admin/stats`

**Headers:**
```
Authorization: Bearer [ADMIN_TOKEN]
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalBusinesses": 89,
    "totalConversations": 12450,
    "totalMessages": 67890,
    "activeSubscriptions": 67,
    "trialAccounts": 22,
    "revenue": {
      "monthly": 4500,
      "yearly": 54000
    },
    "systemHealth": {
      "uptime": 99.9,
      "responseTime": 120,
      "errorRate": 0.1
    }
  }
}
```

---

### Get System Logs
Get system logs (Admin only).

**Endpoint:** `GET /api/admin/logs`

**Headers:**
```
Authorization: Bearer [ADMIN_TOKEN]
```

**Query Parameters:**
- `level`: INFO | WARN | ERROR
- `limit`: number (default: 100)
- `startDate`: ISO date
- `endDate`: ISO date

**Response (200):**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log_001",
      "level": "ERROR",
      "message": "Failed to send message",
      "context": {
        "error": "API timeout",
        "conversationId": "conv_abc123"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Update User
Update user details or status (Admin only).

**Endpoint:** `PUT /api/admin/users/:userId`

**Headers:**
```
Authorization: Bearer [ADMIN_TOKEN]
```

**Request Body:**
```json
{
  "isActive": false,
  "role": "AGENT"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_123abc",
    "isActive": false,
    "role": "AGENT"
  }
}
```

---

### Update Business Status
Update business status or plan (Admin only).

**Endpoint:** `PUT /api/admin/businesses/:businessId`

**Headers:**
```
Authorization: Bearer [ADMIN_TOKEN]
```

**Request Body:**
```json
{
  "status": "SUSPENDED",
  "planType": "BASIC",
  "messageQuota": 5000
}
```

**Response (200):**
```json
{
  "success": true,
  "business": {
    "id": "biz_456def",
    "status": "SUSPENDED",
    "planType": "BASIC",
    "messageQuota": 5000
  }
}
```

---

## 🛠️ System & Health

### Health Check
Check if API is running.

**Endpoint:** `GET /api/health`

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400,
  "version": "2.0.0"
}
```

---

### Get API Documentation
Get API documentation page.

**Endpoint:** `GET /api/docs`

Returns HTML page with API documentation.

---

## 📝 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Common Error Codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 🔒 Rate Limiting

API requests are rate-limited:
- **Free Tier:** 100 requests/hour
- **Basic:** 500 requests/hour
- **Pro:** 2000 requests/hour
- **Enterprise:** Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642249800
```

---

## 📱 Widget Integration

### Widget Script
Add to your website:

```html
<script src="https://faheemly.com/widget/fahimo-widget.js"></script>
<script>
  FahimoWidget.init({
    businessId: 'your_business_id',
    position: 'bottom-right',
    primaryColor: '#6366F1',
    language: 'ar'
  });
</script>
```

---

## 🌐 Webhook Events

Subscribe to events (Coming Soon):

- `conversation.started`
- `conversation.completed`
- `message.received`
- `ticket.created`
- `ticket.updated`

---

## 📞 Support

- **Email:** support@faheemly.com
- **Documentation:** https://docs.faheemly.com
- **Status Page:** https://status.faheemly.com

---

**Last Updated:** December 2024  
**Version:** 2.0.0
