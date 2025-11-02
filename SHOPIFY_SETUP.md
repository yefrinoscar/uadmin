# Shopify Collections Module Setup

## Overview
This module allows you to sync and manage Shopify collections with custom images and videos using the **Shopify GraphQL Admin API** (2024-10 version).

## Environment Variables Required

Add the following environment variables to your `.env` file:

```env
# Shopify Configuration
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_admin_api_access_token
```

## How to Get Shopify Credentials

1. **Go to your Shopify Admin Panel**
   - Navigate to: `Settings` → `Apps and sales channels` → `Develop apps`

2. **Create a Custom App**
   - Click "Create an app"
   - Name it (e.g., "Uadmin Collections Manager")
   - Click "Create app"

3. **Configure Admin API Access**
   - Go to "Configuration" tab
   - Under "Admin API access scopes", enable:
     - `read_products` - To read product information
     - `read_product_listings` - To read product listings
     - `read_collections` - **Required** to fetch collections via GraphQL
   - Click "Save"

4. **Install the App**
   - Go to "API credentials" tab
   - Click "Install app"
   - Copy the "Admin API access token" (this is your `SHOPIFY_ACCESS_TOKEN`)

5. **Get Your Store Domain**
   - Your store domain is: `your-store-name.myshopify.com`
   - Use this as `SHOPIFY_STORE_DOMAIN`

## API Version
This module uses the **Shopify GraphQL Admin API (2024-10)**. The REST Admin API is deprecated as of October 1, 2024.

## Database Migration

Run the migration to create the collections table:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually through Supabase Dashboard
# File: supabase/migrations/20250531_create_collections_table.sql
```

## Required NPM Package

Install the missing Radix UI package:

```bash
npm install @radix-ui/react-alert-dialog
```

## Features

### 1. Sync from Shopify (GraphQL API)
- Uses Shopify GraphQL Admin API (2024-10) for modern, efficient data fetching
- Automatic pagination to fetch all collections (50 per request)
- Syncs collections from Shopify that **don't have underscores** in their handle
- Automatically creates or updates collections in your database
- Preserves Shopify metadata in `shopify_data` JSONB field
- Extracts collection ID from GraphQL Global ID format (`gid://shopify/Collection/...`)

### 2. Media Management
- **Images**: Upload custom images for each collection (max 5MB)
- **Videos**: Upload videos for specific collections (max 50MB)
- Media files are stored in Supabase Storage under `images/collections/`

### 3. Collection Settings
- **Sort Order**: Control the display order of collections
- **Published**: Toggle visibility in your store
- **Handle**: Unique identifier from Shopify (read-only)

## Usage

1. Navigate to `/dashboard/collections` in your app
2. Click "Sincronizar desde Shopify" to fetch collections
3. Click "Editar" on any collection card to add images/videos
4. Manage sort order and published status per collection

## API Endpoints (tRPC)

- `collections.getAll` - Get all collections (with optional published filter)
- `collections.getById` - Get a single collection by ID
- `collections.syncFromShopify` - Sync collections from Shopify
- `collections.update` - Update collection media and settings
- `collections.delete` - Delete a collection and its media

## Notes

- **GraphQL API**: This module uses the modern Shopify GraphQL Admin API (2024-10), not the deprecated REST API
- Collections with underscores in their handle are automatically filtered out during sync
- The sync process updates existing collections and creates new ones
- Original Shopify data is preserved in the `shopify_data` JSONB field
- Media uploads are converted to base64 and uploaded to Supabase Storage
- GraphQL pagination automatically handles large collection catalogs
- Collection IDs are extracted from Shopify's Global ID format for database storage
