# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "user|professional"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string"
    }
  }
}
```

## Events

### Create Event
```http
POST /events
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "date": "date",
  "location": "string",
  "category": "string",
  "budget": "number",
  "requirements": ["string"]
}
```

### List Events
```http
GET /events
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `category` (string, optional)
- `search` (string, optional)

### Get Event Details
```http
GET /events/:id
Authorization: Bearer {token}
```

### Update Event
```http
PUT /events/:id
Authorization: Bearer {token}
```

### Delete Event
```http
DELETE /events/:id
Authorization: Bearer {token}
```

## Messages

### Send Message
```http
POST /messages
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "recipientId": "string",
  "content": "string"
}
```

### Get Conversations
```http
GET /messages
Authorization: Bearer {token}
```

### Get Conversation Messages
```http
GET /messages/:conversationId
Authorization: Bearer {token}
```

## Notifications

### Get Notifications
```http
GET /notifications
Authorization: Bearer {token}
```

### Mark Notification as Read
```http
PUT /notifications/:id/read
Authorization: Bearer {token}
```

## Professional Profile

### Update Profile
```http
PUT /professionals/profile
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "bio": "string",
  "skills": ["string"],
  "experience": "string",
  "hourlyRate": "number",
  "availability": {
    "days": ["string"],
    "hours": {
      "start": "string",
      "end": "string"
    }
  }
}
```

### Get Professional Profile
```http
GET /professionals/:id
```

### List Professionals
```http
GET /professionals
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `category` (string, optional)
- `search` (string, optional)

## Dashboard

### Get Dashboard Stats
```http
GET /dashboard/stats
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEvents": "number",
    "activeEvents": "number",
    "totalEarnings": "number",
    "upcomingEvents": ["Event"],
    "recentMessages": ["Message"],
    "unreadNotifications": "number"
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "string",
    "details": ["string"]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
