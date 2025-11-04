# Shopify GraphQL API Migration Summary

## ✅ Migration Completed

The collections module has been updated to use the **Shopify GraphQL Admin API (2024-10)** instead of the deprecated REST Admin API.

## Changes Made

### 1. API Endpoint Update
**Before (REST API):**
```javascript
GET https://${shopifyDomain}/admin/api/2024-01/custom_collections.json
```

**After (GraphQL API):**
```javascript
POST https://${shopifyDomain}/admin/api/2024-10/graphql.json
```

### 2. GraphQL Query Implementation
The new implementation uses a GraphQL query to fetch collections:

```graphql
query GetCollections($first: Int!, $after: String) {
  collections(first: $first, after: $after) {
    edges {
      node {
        id
        handle
        title
        description
        descriptionHtml
        image {
          url
          altText
        }
        updatedAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### 3. Key Features

#### Pagination
- Automatically fetches all collections using cursor-based pagination
- Fetches 50 collections per request
- Continues until all collections are retrieved

#### Data Mapping
- **ID**: Extracts numeric ID from GraphQL Global ID format (`gid://shopify/Collection/123` → `123`)
- **Image**: Maps from `image.src` (REST) to `image.url` (GraphQL)
- **Description**: Uses `description` field (plain text) instead of `body_html`

#### Error Handling
- Validates GraphQL response structure
- Handles GraphQL-specific errors
- Provides detailed error messages

## Field Mapping Changes

| REST API Field | GraphQL Field | Notes |
|----------------|---------------|-------|
| `id` | `id` (extracted) | GraphQL returns `gid://shopify/Collection/ID` |
| `handle` | `handle` | No change |
| `title` | `title` | No change |
| `body_html` | `description` | GraphQL provides plain text |
| `image.src` | `image.url` | Field name changed |
| - | `descriptionHtml` | Available but not used |
| - | `updatedAt` | Timestamp from Shopify |

## Benefits of GraphQL API

1. **Future-proof**: REST API is deprecated as of Oct 1, 2024
2. **Efficient**: Only fetch the fields you need
3. **Pagination**: Built-in cursor-based pagination
4. **Type-safe**: GraphQL schema provides type information
5. **Flexible**: Easy to add more fields without breaking changes

## Required Shopify Permissions

Ensure your Shopify app has the following scope enabled:
- `read_collections` - **Required** for GraphQL collections query

## Testing Checklist

- [ ] Verify Shopify credentials are set in `.env`
- [ ] Test sync with collections that have no underscores
- [ ] Verify collections with underscores are filtered out
- [ ] Check pagination works with large collection catalogs
- [ ] Confirm image URLs are correctly mapped
- [ ] Validate description field contains plain text

## Migration Notes

- The GraphQL API version is `2024-10` (latest stable as of implementation)
- No changes required to the database schema
- No changes required to the frontend components
- The sync logic remains the same (filter by underscore in handle)
- All existing collections in the database remain compatible

## Troubleshooting

### Error: "Shopify credentials not configured"
- Ensure `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_ACCESS_TOKEN` are set in `.env`

### Error: "GraphQL errors"
- Check that your Shopify app has `read_collections` scope enabled
- Verify your access token is valid and not expired

### Error: "No collections data in response"
- Verify your Shopify store has collections created
- Check that the GraphQL query is properly formatted

## References

- [Shopify GraphQL Admin API Docs](https://shopify.dev/docs/api/admin-graphql/latest)
- [Collections Query Reference](https://shopify.dev/docs/api/admin-graphql/latest/queries/collections)
- [REST to GraphQL Migration Guide](https://shopify.dev/docs/api/usage/migrate-to-graphql)
