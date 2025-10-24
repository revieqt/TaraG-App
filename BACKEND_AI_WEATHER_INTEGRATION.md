# Backend AI Weather Integration Specification

## Overview
The frontend now handles weather requests with caching. When the AI detects a weather-related query, it should return a structured response that the frontend will process.

## Weather Request Detection

### Weather Intent Keywords
Detect when user asks about weather:
- "What's the weather?"
- "How's the weather today?"
- "Weather in [location]"
- "What's the weather like in [location]?"
- "Weather forecast for [date]"
- "Will it rain tomorrow?"
- "Temperature in [location]"

## Response Format for Weather Requests

### Basic Structure
```json
{
  "reply": "Would you like me to check the weather for [location]?",
  "suggestions": ["Yes, show weather", "No thanks"],
  "actionRequired": {
    "type": "confirm_weather",
    "data": {
      "location": "Cebu City",  // or null for current location
      "date": "2024-01-15"      // optional, null for current day
    }
  }
}
```

## Scenarios

### Scenario 1: Current Location Weather
**User Input**: "What's the weather?" or "How's the weather today?"

**Backend Response**:
```json
{
  "reply": "Would you like me to check the current weather for your location?",
  "suggestions": ["Yes, show weather", "No thanks"],
  "actionRequired": {
    "type": "confirm_weather",
    "data": {
      "location": null,  // null means use current location
      "date": null       // null means current day
    }
  }
}
```

**Frontend Behavior**:
- Uses GPS coordinates from `useLocation` hook
- Checks cache first
- Fetches from API if not cached
- Displays formatted weather data

### Scenario 2: Specific Location Weather
**User Input**: "What's the weather in Manila?" or "Weather in Cebu City"

**Backend Response**:
```json
{
  "reply": "Would you like me to check the weather for Manila?",
  "suggestions": ["Yes, show weather", "No thanks"],
  "actionRequired": {
    "type": "confirm_weather",
    "data": {
      "location": "Manila",
      "date": null
    }
  }
}
```

**Frontend Behavior**:
- Geocodes "Manila" to coordinates
- Checks cache first
- Fetches from API if not cached
- Displays formatted weather data

### Scenario 3: Future Date Weather
**User Input**: "What's the weather tomorrow?" or "Weather on January 15"

**Backend Response**:
```json
{
  "reply": "Would you like me to check the weather forecast for tomorrow?",
  "suggestions": ["Yes, show weather", "No thanks"],
  "actionRequired": {
    "type": "confirm_weather",
    "data": {
      "location": null,
      "date": "2024-01-15"  // ISO format: YYYY-MM-DD
    }
  }
}
```

**Frontend Behavior**:
- Validates date is within 14 days
- If > 14 days: Shows error "I can only provide weather forecasts up to 14 days in advance"
- Otherwise: Fetches weather for that date

### Scenario 4: Location + Date
**User Input**: "Weather in Tokyo tomorrow" or "What's the weather in Paris on January 20?"

**Backend Response**:
```json
{
  "reply": "Would you like me to check the weather forecast for Tokyo tomorrow?",
  "suggestions": ["Yes, show weather", "No thanks"],
  "actionRequired": {
    "type": "confirm_weather",
    "data": {
      "location": "Tokyo",
      "date": "2024-01-15"
    }
  }
}
```

### Scenario 5: Too Far in Future (Error Case)
**User Input**: "What's the weather 40 days from now?"

**Backend Response**:
```json
{
  "reply": "I can only provide weather forecasts up to 14 days in advance. Would you like to check the weather for a date within the next 14 days?",
  "suggestions": ["Check today's weather", "Check tomorrow's weather"]
}
```

**Note**: No `actionRequired` field since this is an error case.

## Date Parsing

### Relative Dates
- "today" → Current date
- "tomorrow" → Current date + 1 day
- "day after tomorrow" → Current date + 2 days
- "next Monday" → Next occurrence of Monday
- "in 3 days" → Current date + 3 days

### Absolute Dates
- "January 15" → 2024-01-15 (current year)
- "Jan 15, 2024" → 2024-01-15
- "15/01/2024" → 2024-01-15
- "2024-01-15" → 2024-01-15

### Date Format
Always return dates in ISO format: `YYYY-MM-DD`

## Location Parsing

### Current Location Keywords
- "here"
- "current location"
- "my location"
- "where I am"
- null or empty string

When these are detected, set `location: null` in the response.

### Specific Locations
- City names: "Manila", "Cebu", "Tokyo"
- Full addresses: "123 Main St, Cebu City"
- Landmarks: "Ayala Center", "SM Mall"

Return the location name as provided by the user.

## Frontend Processing

### Cache Check Flow
```
1. User confirms weather request
2. Frontend checks if location is null
   - If null: Use GPS coordinates
   - If not null: Geocode location name to coordinates
3. Check AsyncStorage cache for coordinates + date
4. If cache valid (< 30 minutes old):
   - Display cached data immediately
5. If cache expired or missing:
   - Fetch from backend API
   - Save to cache
   - Display data
```

### Weather Data Format (Frontend Display)
```
Weather for [location] on [date]:

🌡️ Current: 28.5°C - Partly cloudy
📊 Temperature Range: 24.0°C - 32.0°C
💧 Humidity: 65%
🌧️ Precipitation: 0.2mm
💨 Wind Speed: 12.3 km/h
```

## Error Handling

### Location Not Found
If geocoding fails:
```json
{
  "reply": "I couldn't find the location 'XYZ'. Could you provide a more specific location name?",
  "suggestions": ["Try again", "Use current location"]
}
```

### Date Too Far in Future
If date > 14 days:
```json
{
  "reply": "I can only provide weather forecasts up to 14 days in advance. The date you requested is too far in the future.",
  "suggestions": ["Check today's weather", "Check tomorrow's weather"]
}
```

### API Error
If weather API fails:
```json
{
  "reply": "Sorry, I couldn't get the weather information right now. Please try again later.",
  "suggestions": ["Try again", "Cancel"]
}
```

## Implementation Checklist

- [ ] Detect weather intent from user message
- [ ] Parse location from message (or null for current)
- [ ] Parse date from message (or null for today)
- [ ] Convert relative dates to ISO format (YYYY-MM-DD)
- [ ] Validate date is within 14 days
- [ ] Return structured response with `confirm_weather` action
- [ ] Handle edge cases (no location, far future dates)
- [ ] Provide clear confirmation messages

## Testing Examples

### Test Case 1: Current Weather
```
Input: "What's the weather?"
Expected response:
{
  "actionRequired": {
    "type": "confirm_weather",
    "data": { "location": null, "date": null }
  }
}
```

### Test Case 2: Location Weather
```
Input: "Weather in Manila"
Expected response:
{
  "actionRequired": {
    "type": "confirm_weather",
    "data": { "location": "Manila", "date": null }
  }
}
```

### Test Case 3: Future Date
```
Input: "Weather tomorrow"
Expected response:
{
  "actionRequired": {
    "type": "confirm_weather",
    "data": { "location": null, "date": "2024-01-16" }
  }
}
```

### Test Case 4: Location + Date
```
Input: "Weather in Tokyo on January 20"
Expected response:
{
  "actionRequired": {
    "type": "confirm_weather",
    "data": { "location": "Tokyo", "date": "2024-01-20" }
  }
}
```

### Test Case 5: Too Far Future
```
Input: "Weather 40 days from now"
Expected response:
{
  "reply": "I can only provide weather forecasts up to 14 days in advance...",
  // No actionRequired field
}
```

## Notes

- Frontend handles all caching automatically
- Frontend geocodes location names to coordinates
- Frontend validates date range (max 14 days)
- Backend only needs to parse intent and return structured data
- Cache is transparent to backend (no backend changes needed)
