# Weather Data Caching Implementation

## Overview
Weather data is now cached using AsyncStorage to prevent unnecessary API calls and improve app performance. Cache automatically expires after 30 minutes and old caches are deleted when new data is fetched.

## Implementation Details

### Cache Configuration
```typescript
const WEATHER_CACHE_PREFIX = '@weather_cache_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
```

### Cache Key Format
Cache keys are generated based on location and date:
```
@weather_cache_{latitude}_{longitude}_{date}
```

**Examples**:
- Current weather: `@weather_cache_10.32_123.89_current`
- Specific date: `@weather_cache_10.32_123.89_2024-01-15`

**Note**: Coordinates are rounded to 2 decimal places to improve cache hit rate for nearby locations.

### Cached Data Structure
```typescript
interface CachedWeatherData {
  data: WeatherResponse;      // The actual weather data
  timestamp: number;           // When the data was cached (milliseconds)
  cacheKey: string;            // The cache key for reference
}
```

## Caching Flow

### 1. Data Fetch Request
```
User opens app → useWeather hook called → fetchWeather()
```

### 2. Cache Check
```typescript
// Try to load from cache first
const cachedData = await loadCachedData();
if (cachedData) {
  setWeatherData(cachedData);
  setLoading(false);
  return; // Skip API call
}
```

### 3. Cache Validation
- **Valid Cache**: If cache exists and is less than 30 minutes old → Use cached data
- **Expired Cache**: If cache is older than 30 minutes → Delete cache and fetch new data
- **No Cache**: Fetch from API

### 4. Save New Data
When new data is fetched from API:
```typescript
// Save to cache
await saveCachedData(data);

// Delete old weather caches (keep only current one)
const allKeys = await AsyncStorage.getAllKeys();
const weatherCacheKeys = allKeys.filter(key => 
  key.startsWith(WEATHER_CACHE_PREFIX) && key !== cacheKey
);
await AsyncStorage.multiRemove(weatherCacheKeys);
```

## Key Features

### ✅ Automatic Cache Expiration
- Cache expires after 30 minutes
- Expired cache is automatically deleted
- Fresh data is fetched when cache expires

### ✅ Old Cache Cleanup
- When new data is cached, all old weather caches are deleted
- Prevents AsyncStorage from filling up with stale data
- Only keeps the most recent cache

### ✅ Location-Based Caching
- Different cache for different locations
- Rounded coordinates (2 decimal places) for better cache hits
- Separate cache for current weather vs specific dates

### ✅ Error Handling
- Graceful fallback if cache read fails
- Continues to API fetch if cache errors occur
- Logs errors for debugging

### ✅ Performance Benefits
- Instant data display from cache
- Reduced API calls (saves bandwidth and backend load)
- Better user experience (no loading spinner on cached data)

## Usage Examples

### Example 1: First App Open
```
1. User opens app
2. No cache exists
3. Fetch from API: GET /api/weather?latitude=10.32&longitude=123.89
4. Save to cache: @weather_cache_10.32_123.89_current
5. Display weather data
```

### Example 2: Second App Open (Within 30 Minutes)
```
1. User opens app
2. Cache exists and is valid (< 30 minutes old)
3. Load from cache: @weather_cache_10.32_123.89_current
4. Display weather data immediately (no API call)
```

### Example 3: App Open After 30 Minutes
```
1. User opens app
2. Cache exists but expired (> 30 minutes old)
3. Delete expired cache
4. Fetch from API: GET /api/weather?latitude=10.32&longitude=123.89
5. Save new cache
6. Delete old caches
7. Display weather data
```

### Example 4: Different Location
```
1. User views weather for different location
2. Check cache: @weather_cache_14.60_121.02_current
3. No cache for this location
4. Fetch from API
5. Save to cache
6. Delete old cache (@weather_cache_10.32_123.89_current)
```

## Cache Management

### Cache Lifetime
- **Duration**: 30 minutes
- **Reason**: Weather data doesn't change frequently, but should be reasonably fresh

### Cache Storage
- **Location**: AsyncStorage (persistent storage)
- **Size**: ~10-20 KB per cache entry
- **Cleanup**: Automatic deletion of old caches

### Cache Keys
All weather caches start with `@weather_cache_` prefix for easy identification and cleanup.

## Benefits

### For Users
- ⚡ **Faster Load Times**: Instant weather display from cache
- 📱 **Reduced Data Usage**: Fewer API calls = less mobile data
- 🔋 **Better Battery Life**: Less network activity
- 💪 **Offline Resilience**: Last cached data available even offline

### For Backend
- 🚀 **Reduced Load**: Fewer API requests to handle
- 💰 **Cost Savings**: Less bandwidth and compute usage
- 📊 **Better Scalability**: Can handle more users with same resources

### For App Performance
- ✅ **Instant Display**: No loading spinner on cached data
- ✅ **Smooth UX**: No delay when switching between screens
- ✅ **Reliable**: Graceful fallback to API if cache fails

## Console Logs

### Cache Hit
```
🌤️ Using cached weather data: @weather_cache_10.32_123.89_current
```

### Cache Miss
```
🌤️ Fetching weather from API for: { latitude: 10.32, longitude: 123.89 }
🌤️ Weather data cached: @weather_cache_10.32_123.89_current
🌤️ Deleted 1 old weather cache(s)
```

### Cache Expired
```
🌤️ Cache expired, will fetch new data
🌤️ Fetching weather from API for: { latitude: 10.32, longitude: 123.89 }
```

## Technical Details

### File Modified
- `hooks/useWeather.ts`: Added caching logic

### Dependencies
- `@react-native-async-storage/async-storage`: Already installed

### Functions Added
- `getCacheKey()`: Generates unique cache key
- `loadCachedData()`: Loads and validates cached data
- `saveCachedData()`: Saves data and cleans up old caches

### No Breaking Changes
- Existing components work without modification
- Cache is transparent to consumers
- Fallback to API if cache fails

## Future Enhancements

- [ ] Configurable cache duration
- [ ] Cache size limits
- [ ] Background cache refresh
- [ ] Cache statistics/metrics
- [ ] Manual cache clear option in settings
