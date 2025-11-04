# Collections Module - Implementation Summary

## ✅ Completed Tasks

### 1. Database Schema
**File**: `supabase/migrations/20250531_create_collections_table.sql`
- Created `collections` table with fields:
  - `shopify_id` (unique identifier from Shopify)
  - `handle` (unique URL-friendly name)
  - `title`, `description`
  - `image_url`, `video_url` (custom media)
  - `sort_order`, `published` (display settings)
  - `shopify_data` (JSONB for preserving original data)
- Row Level Security (RLS) policies configured
- Storage policies for collection media in `images/collections/`

### 2. Backend (tRPC Router)
**File**: `trpc/api/routers/collections.ts`
- **Endpoints**:
  - `getAll` - Fetch all collections with optional published filter
  - `getById` - Get single collection
  - `syncFromShopify` - Sync collections from Shopify API (filters out handles with underscores)
  - `update` - Update collection media and settings
  - `delete` - Delete collection and associated media
- Integrated with `trpc/api/root.ts`

### 3. Frontend Components
**Directory**: `app/(dashboard)/dashboard/collections/`

#### Main Page
- `page.tsx` - Server component with prefetching

#### Components (`_components/`)
- `collections-list.tsx` - Main list view with sync button
- `collection-card.tsx` - Individual collection card with edit/delete actions
- `edit-collection-dialog.tsx` - Dialog for uploading images/videos and managing settings
- `collections-skeleton.tsx` - Loading state

### 4. UI Components
**File**: `components/ui/alert-dialog.tsx`
- Created AlertDialog component using Radix UI primitives

### 5. Navigation
**File**: `config/menu.ts`
- Added "Colecciones" menu item with `FolderKanban` icon
- Positioned after Promotions in sidebar

## 📋 Required Actions

### 1. Install Dependencies
```bash
npm install @radix-ui/react-alert-dialog
```

### 2. Run Database Migration
```bash
# Using Supabase CLI
supabase db push

# Or apply manually through Supabase Dashboard
```

### 3. Configure Environment Variables
Add to your `.env` file:
```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_admin_api_access_token
```

See `SHOPIFY_SETUP.md` for detailed instructions on obtaining these credentials.

## 🎯 Key Features

1. **Shopify Sync**
   - Fetches collections from Shopify Custom Collections API
   - Filters out collections with underscores in handle
   - Updates existing or creates new collections
   - Preserves original Shopify data

2. **Media Management**
   - Upload custom images (max 5MB)
   - Upload videos for specific collections (max 50MB)
   - Preview before upload
   - Remove media functionality

3. **Collection Settings**
   - Sort order control
   - Published/unpublished toggle
   - View Shopify handle and description

4. **UI/UX**
   - Card-based layout
   - Responsive grid (1/2/3 columns)
   - Loading states and skeletons
   - Toast notifications for actions
   - Confirmation dialogs for deletions

## 🔧 Technical Details

- **Framework**: Next.js 15 with App Router
- **State Management**: TanStack Query (React Query)
- **API**: tRPC with Supabase backend
- **UI**: ShadCN UI components with Tailwind CSS
- **Storage**: Supabase Storage for media files
- **Authentication**: Clerk integration

## 📝 Notes

- Collections are synced from Shopify's Custom Collections endpoint
- Only collections without underscores in their handle are synced (as per requirements)
- Media files are converted to base64 for upload to Supabase Storage
- The module follows the existing patterns from the Promotions module
- All mutations invalidate the collections query cache for real-time updates

## 🚀 Next Steps

1. Install the required npm package
2. Run the database migration
3. Configure Shopify API credentials
4. Test the sync functionality
5. Upload images/videos to collections as needed
