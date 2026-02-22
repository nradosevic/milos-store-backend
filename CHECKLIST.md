# Backend Build Checklist
Project: Rariteti.rs — Milos's Vintage & Collectibles Store
Generated: 2026-02-22T19:24:11.118Z

## Project Setup
- [x] NestJS scaffold with TypeORM + PostgreSQL
- [x] Auth module (jwt) with admin role
- [x] AppModule wiring and base configuration
- [x] .env.example with all required variables

## Entities
- [x] Category entity (7 fields, 3 relations)
- [x] Tag entity (2 fields, 1 relations)
- [x] Product entity (22 fields, 3 relations)
- [x] ProductImage entity (6 fields, 1 relations)
- [x] SiteSettings entity (3 fields, 0 relations)
- [x] Testimonial entity (5 fields, 0 relations)
- [x] FaqItem entity (4 fields, 0 relations)
- [x] ContactSubmission entity (8 fields, 0 relations)

## Public Endpoints
- [x] GET /categories
- [x] GET /categories/:slug
- [x] GET /products
- [x] GET /products/featured
- [x] GET /products/:slug
- [x] GET /tags
- [x] GET /tags/:slug
- [x] GET /testimonials
- [x] GET /faq
- [x] GET /settings/:key
- [x] POST /contact
- [x] GET /sitemap.xml

## Admin Endpoints
- [x] POST /admin/auth/login
- [x] CRUD /admin/categories
- [x] POST /admin/categories/bulk-import?mode=merge|replace
- [x] GET /admin/categories/bulk-export
- [x] CRUD /admin/products
- [x] POST /admin/products/:id/images
- [x] PATCH /admin/products/:id/images/:imageId
- [x] DELETE /admin/products/:id/images/:imageId
- [x] PATCH /admin/products/:id/mark-sold
- [x] CRUD /admin/tags
- [x] CRUD /admin/testimonials
- [x] CRUD /admin/faq
- [x] CRUD /admin/settings
- [x] GET /admin/dashboard
- [x] GET /admin/contacts
- [x] PATCH /admin/contacts/:id

## File Upload
- [x] S3/MinIO integration
- [x] Image upload with thumbnail generation

## Seed Data
- [x] Category seeding
- [x] Tag seeding
- [x] Product seeding
- [x] ProductImage seeding
- [x] SiteSettings seeding
- [x] Testimonial seeding
- [x] FaqItem seeding
- [x] ContactSubmission seeding

## DevOps
- [x] Dockerfile (multi-stage build)
- [x] .env.example

## Quality
- [x] npm run build passes
- [x] npm test passes
