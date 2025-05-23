# Backend Filter Implementation Guide

This guide explains how to implement backend support for the new keyword search filter functionality.

## Frontend Implementation Status ✅

The frontend now includes:
- **FilterDropdown component**: Allows users to select content filters
- **Modified search flow**: Passes filter parameters to API calls
- **Enhanced UI**: Shows applied filters and manages state
- **Type safety**: Full TypeScript support for filter parameters

## Required Backend Changes

### 1. Update `/api/search` Endpoint

**Current signature:**
```javascript
GET /api/search?keyword=searchTerm
```

**New signature:**
```javascript
GET /api/search?keyword=searchTerm&filter=categoryName
```

### 2. Modify MongoDB Query Logic

**Example implementation:**
```javascript
app.get('/api/search', async (req, res) => {
  try {
    const { keyword, filter } = req.query;
    
    // Base query for text search
    let query = {
      $text: { $search: keyword }
    };
    
    // Add filter if provided
    if (filter && filter !== '') {
      // Option 1: Filter by category field
      query.category = filter;
      
      // Option 2: Filter by tags array
      // query.tags = { $in: [filter] };
      
      // Option 3: Multiple field filter
      // query.$or = [
      //   { category: filter },
      //   { tags: { $in: [filter] } }
      // ];
    }
    
    const results = await Video.find(query)
      .sort({ score: { $meta: 'textScore' } })
      .limit(50);
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});
```

### 3. Add Filter Options Endpoint (Optional)

Create a new endpoint to dynamically fetch available filter options:

```javascript
app.get('/api/filters', async (req, res) => {
  try {
    // Get unique categories with counts
    const categories = await Video.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Format for frontend
    const filterOptions = [
      { value: '', label: 'All Content' },
      ...categories.map(cat => ({
        value: cat._id,
        label: cat._id,
        count: cat.count
      }))
    ];
    
    res.json(filterOptions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch filters', error: error.message });
  }
});
```

### 4. Database Schema Considerations

Ensure your video documents have filterable fields:

```javascript
const videoSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String, // Main filter field
  tags: [String],   // Additional filter options
  publishedDate: Date,
  // ... other fields
});

// Create text index for search
videoSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text'
});

// Create index for efficient filtering
videoSchema.index({ category: 1 });
videoSchema.index({ tags: 1 });
```

## Filter Values Reference

The frontend currently uses these filter values (update as needed):

- `youtube-videos`: YouTube Videos content
- `youtube-livestreams`: YouTube Livestreams content  
- `discord-livestreams`: Discord Livestreams content

## Frontend Integration Points

1. **API Service** (`src/services/apiService.ts`):
   - ✅ Already updated to send filter parameter
   - Will automatically pass filter to backend

2. **Filter Options** (`src/hooks/useFilterOptions.ts`):
   - Currently uses mock data
   - Update to call `/api/filters` endpoint when ready

3. **State Management** (`src/App.tsx`):
   - ✅ Handles filter state and search parameters
   - Passes filter data through search flow

## Testing the Implementation

1. **Without Backend Changes**: Frontend works with mock filter data
2. **With Basic Backend**: Add filter parameter handling to existing search
3. **With Full Backend**: Implement dynamic filter options endpoint

The frontend is designed to gracefully handle missing or empty filter responses. 