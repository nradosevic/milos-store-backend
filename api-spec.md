# Rariteti.rs API Specification

Base URL: `http://localhost:3000/api`

All routes use the `/api` prefix except `GET /sitemap.xml`.

## Authentication

Admin endpoints require a JWT Bearer token obtained from `POST /api/admin/auth/login`.

Include in requests:
```
Authorization: Bearer <token>
```

---

## Public Endpoints

### Categories

#### `GET /api/categories`
Returns the full nested category tree (active only) with product counts.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Knjige i rukopisi",
    "slug": "knjige-i-rukopisi",
    "description": "Stare knjige...",
    "iconName": "book",
    "depth": 0,
    "sortOrder": 0,
    "isActive": true,
    "parentId": null,
    "productCount": 12,
    "children": [
      {
        "id": 2,
        "name": "Stare knjige",
        "slug": "stare-knjige",
        "depth": 1,
        "productCount": 5,
        "children": []
      }
    ]
  }
]
```

#### `GET /api/categories/:slug`
Category detail with description and paginated products (including descendants).

**Query params:** `page` (default: 1), `limit` (default: 20)

**Response** `200 OK`
```json
{
  "category": { "id": 1, "name": "Knjige", "slug": "knjige", "description": "..." },
  "products": [{ "id": 1, "title": "Stara knjiga", "slug": "stara-knjiga", "price": 1500 }],
  "total": 25,
  "page": 1,
  "limit": 20
}
```

---

### Products

#### `GET /api/products`
Paginated product listing with filters.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search in title and description (case-insensitive) |
| `categorySlug` | string | Filter by category (includes descendants) |
| `tags` | string | Comma-separated tag slugs (OR logic) |
| `priceMin` | number | Minimum price in RSD |
| `priceMax` | number | Maximum price in RSD |
| `yearMin` | number | Minimum year |
| `yearMax` | number | Maximum year |
| `condition` | string | Filter by condition value |
| `isUnique` | boolean | Filter unique items |
| `isSold` | boolean | Filter sold items |
| `sortBy` | string | `price`, `year`, `createdAt`, `title` |
| `sortDir` | string | `asc` or `desc` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

**Response** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "title": "Stara karta Beograda",
      "slug": "stara-karta-beograda",
      "price": "2500.00",
      "isSold": false,
      "isFeatured": false,
      "category": { "id": 1, "name": "Mape", "slug": "mape" },
      "tags": [{ "id": 1, "name": "SFRJ", "slug": "sfrj" }],
      "images": [{ "s3Key": "products/1/img.jpg", "thumbnailS3Key": "products/1/img_thumb.jpg", "isMain": true, "altText": "Karta Beograda" }]
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

#### `GET /api/products/featured`
Returns featured products (isFeatured=true) for the homepage.

#### `GET /api/products/:slug`
Full product detail including images, category breadcrumb, tags, and related products.

**Response** `200 OK`
```json
{
  "id": 1,
  "title": "Stara karta Beograda",
  "slug": "stara-karta-beograda",
  "description": "<p>Retka karta iz 1920. godine...</p>",
  "shortDescription": "Retka karta Beograda iz 1920.",
  "price": "2500.00",
  "priceOnRequest": false,
  "year": 1920,
  "condition": "Odlično",
  "origin": "Srbija",
  "period": "Kraljevina Jugoslavija",
  "hiddenFields": [],
  "customFields": { "Dimenzije": "60x80cm", "Tehnika": "Litografija" },
  "isUnique": true,
  "isSold": false,
  "images": [
    { "id": 1, "s3Key": "products/1/img.jpg", "thumbnailS3Key": "products/1/img_thumb.jpg", "altText": "Karta Beograda 1920", "isMain": true, "sortOrder": 0 }
  ],
  "breadcrumb": [
    { "id": 1, "name": "Knjige i rukopisi", "slug": "knjige-i-rukopisi" },
    { "id": 2, "name": "Mape i atlasi", "slug": "mape-i-atlasi" }
  ],
  "tags": [{ "id": 1, "name": "SFRJ", "slug": "sfrj" }],
  "related": [{ "id": 2, "title": "Drugi predmet", "slug": "drugi-predmet" }]
}
```

---

### Tags

#### `GET /api/tags`
All tags with product counts (for tag cloud / filter UI).

**Response** `200 OK`
```json
[{ "id": 1, "name": "SFRJ", "slug": "sfrj", "productCount": 15 }]
```

#### `GET /api/tags/:slug`
Tag detail with paginated products.

**Query params:** `page`, `limit`

**Response** `200 OK`
```json
{
  "tag": { "id": 1, "name": "SFRJ", "slug": "sfrj" },
  "products": [...],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

---

### Other Public Endpoints

#### `GET /api/testimonials`
Active testimonials ordered by sortOrder.

#### `GET /api/faq`
Active FAQ items ordered by sortOrder.

#### `GET /api/settings/:key`
Get a site setting by key.

#### `POST /api/contact`
Submit a contact form.

**Body:**
```json
{
  "name": "Marko Marković",
  "email": "marko@example.com",
  "phone": "+381601234567",
  "message": "Zanima me cena predmeta.",
  "productSlug": "stara-knjiga",
  "productTitle": "Stara knjiga iz 1950."
}
```
- `message` is required
- `name`, `email`, `phone` are optional

**Response** `201 Created`

#### `GET /sitemap.xml`
Auto-generated XML sitemap with all active product and category URLs.

---

## Admin Endpoints

All admin endpoints require `Authorization: Bearer <token>`.

### Authentication

#### `POST /api/admin/auth/login`
Get JWT access token.

**Body:**
```json
{ "email": "admin@rariteti.rs", "password": "CHANGE_ME_ON_FIRST_LOGIN" }
```

**Response** `201 Created`
```json
{ "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

---

### Admin Categories

#### `GET /api/admin/categories`
List all categories (including inactive).

#### `POST /api/admin/categories`
Create a category.

**Body:**
```json
{
  "name": "Knjige i rukopisi",
  "slug": "knjige-i-rukopisi",
  "description": "Stare knjige...",
  "iconName": "book",
  "parentId": null,
  "sortOrder": 0,
  "isActive": true
}
```

#### `PATCH /api/admin/categories/:id`
Update a category.

#### `DELETE /api/admin/categories/:id`
Delete a category (fails if it has subcategories).

#### `POST /api/admin/categories/bulk-import?mode=merge|replace`
Bulk import category tree.

**Query:** `mode=merge` (default) or `mode=replace`

**Body:**
```json
{
  "categories": [
    {
      "name": "Knjige",
      "slug": "knjige",
      "description": "Stare knjige",
      "iconName": "book",
      "children": [
        { "name": "Stare knjige", "slug": "stare-knjige" }
      ]
    }
  ]
}
```

- `merge`: Creates new categories, updates existing by slug, does NOT delete missing
- `replace`: Deletes ALL categories first, then recreates from JSON

#### `GET /api/admin/categories/bulk-export`
Export full category tree as JSON (same format as import).

---

### Admin Products

#### `GET /api/admin/products`
Paginated product list with all filters (same as public, but includes inactive).

#### `POST /api/admin/products`
Create a product.

**Body:**
```json
{
  "title": "Stara karta Beograda",
  "description": "<p>Retka karta...</p>",
  "shortDescription": "Retka karta iz 1920.",
  "price": 2500,
  "priceOnRequest": false,
  "year": 1920,
  "condition": "Odlično",
  "origin": "Srbija",
  "period": "Kraljevina Jugoslavija",
  "author": null,
  "publisher": null,
  "dimensions": "60x80cm",
  "material": "Papir",
  "hiddenFields": [],
  "customFields": { "Tehnika": "Litografija" },
  "isUnique": true,
  "isFeatured": false,
  "categoryId": 2,
  "tags": ["SFRJ", "karta"]
}
```

Note: `tags` is an array of tag names. New tags are created automatically.

#### `PATCH /api/admin/products/:id`
Update a product.

#### `DELETE /api/admin/products/:id`
Delete a product.

#### `PATCH /api/admin/products/:id/mark-sold`
Mark product as sold (sets `isSold=true`, `stock=0`).

#### `POST /api/admin/products/:id/images`
Upload images (multipart/form-data).

**Form field:** `files[]` (multiple files allowed)
**Content-Type:** `multipart/form-data`
**Max size:** 10MB per file
**Allowed types:** `image/jpeg`, `image/png`, `image/webp`

Thumbnails (300px) are generated automatically.

#### `PATCH /api/admin/products/:id/images/:imageId`
Update image metadata.

**Body:**
```json
{ "isMain": true, "sortOrder": 0, "altText": "Karta Beograda" }
```

#### `DELETE /api/admin/products/:id/images/:imageId`
Delete an image from DB and S3.

---

### Admin Tags

#### `GET /api/admin/tags`
List all tags with product counts.

#### `POST /api/admin/tags`
Create a tag. **Body:** `{ "name": "SFRJ" }`

#### `PATCH /api/admin/tags/:id`
Rename a tag. **Body:** `{ "name": "New name" }`

#### `DELETE /api/admin/tags/:id`
Delete a tag.

#### `POST /api/admin/tags/merge`
Merge two tags. **Body:** `{ "sourceId": 1, "targetId": 2 }` (source is deleted, products moved to target)

---

### Admin Testimonials

#### `GET /api/admin/testimonials`
All testimonials.

#### `POST /api/admin/testimonials`
Create. **Body:** `{ "text": "...", "authorName": "Marko P.", "source": "Google", "sortOrder": 0 }`

#### `PATCH /api/admin/testimonials/:id`
Update.

#### `DELETE /api/admin/testimonials/:id`
Delete.

---

### Admin FAQ

#### `GET /api/admin/faq`
All FAQ items.

#### `POST /api/admin/faq`
Create. **Body:** `{ "question": "...", "answer": "...", "sortOrder": 0 }`

#### `PATCH /api/admin/faq/:id`
Update.

#### `DELETE /api/admin/faq/:id`
Delete.

---

### Admin Settings

#### `GET /api/admin/settings`
All settings.

#### `POST /api/admin/settings`
Create or update setting. **Body:** `{ "key": "site_name", "value": "Rariteti.rs", "type": "text" }`

#### `PATCH /api/admin/settings/:id`
Update setting value. **Body:** `{ "value": "New value" }`

#### `DELETE /api/admin/settings/:id`
Delete setting.

---

### Admin Dashboard

#### `GET /api/admin/dashboard`
Returns aggregate statistics.

**Response** `200 OK`
```json
{
  "products": { "total": 150, "active": 142, "sold": 8, "featured": 10 },
  "contacts": { "total": 45, "unread": 3, "recent": [...] },
  "categories": { "total": 22 },
  "tags": { "total": 35 }
}
```

---

### Admin Contacts

#### `GET /api/admin/contacts`
Paginated contact submissions.

**Query params:** `page`, `limit`, `isRead` (true/false)

#### `PATCH /api/admin/contacts/:id`
Mark read/unread. **Body:** `{ "isRead": true }`

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400 Bad Request` | Validation error or bad input |
| `401 Unauthorized` | Missing or invalid JWT |
| `404 Not Found` | Resource not found |
| `409 Conflict` | Duplicate slug or unique constraint |

---

## Default Admin Credentials

- **Email:** `admin@rariteti.rs`
- **Password:** `CHANGE_ME_ON_FIRST_LOGIN`

Change the password after first login.
