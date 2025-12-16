# Error Prevention Guide

এই guide-এ দেখানো হয়েছে কিভাবে future errors prevent করতে হবে।

## 1. API Fetch Errors Prevention

### সমস্যা:
- Apify API 400 error দিচ্ছে
- "API fetch failed" errors logs-এ দেখা যাচ্ছে

### সমাধান (যা করা হয়েছে):

1. **API Key Validation:**
   - API key check করা হচ্ছে request করার আগে
   - API key format validate করা হচ্ছে

2. **Retry Logic:**
   - Automatic retry (3 attempts)
   - Exponential backoff (1s, 2s, 4s)
   - Server errors (5xx) হলে retry
   - Client errors (4xx) হলে retry করবে না

3. **Better Error Messages:**
   - Specific error messages
   - Helpful suggestions
   - Error type based suggestions

4. **Input Validation:**
   - Limit capped at 1000
   - Query format validation
   - Array format ensured

### Prevention Checklist:
- [x] API key validation before requests
- [x] Retry logic for transient failures
- [x] Better error messages with suggestions
- [x] Input validation and limits
- [x] Timeout handling (30 seconds)

## 2. Database Errors Prevention

### সমস্যা:
- 500 Internal Server Error
- MongoDB connection issues

### সমাধান (যা করা হয়েছে):

1. **Connection Checks:**
   - MongoDB connection check করা হচ্ছে request-এর আগে
   - Graceful error handling

2. **Error Handling:**
   - Try-catch blocks everywhere
   - Meaningful error messages
   - Fallback responses (empty arrays/objects)

3. **Query Limits:**
   - Limit capped at 1000
   - Pagination support

### Prevention Checklist:
- [x] MongoDB connection checks
- [x] Graceful error handling
- [x] Query limits and validation
- [x] Fallback responses

## 3. Scraper Errors Prevention

### সমস্যা:
- Playwright browser not installed errors

### সমাধান (যা করা হয়েছে):

1. **Optional Scraper:**
   - Scraper errors don't crash the system
   - Graceful degradation
   - Clear warnings instead of errors

2. **Error Handling:**
   - Playwright errors caught and handled
   - System continues without scraper

### Prevention Checklist:
- [x] Scraper marked as optional
- [x] Errors don't crash system
- [x] Clear warnings instead of errors

## 4. Best Practices

### Environment Variables:
```env
# Always validate these are set
APIFY_API_KEY=your_key_here
MONGODB_URI=your_connection_string
REDIS_URL=your_redis_url (optional)
```

### Monitoring:
- Check `/api/health` endpoint regularly
- Monitor logs in admin dashboard
- Set up alerts for critical errors

### Regular Maintenance:
1. **Clear old errors:**
   ```bash
   npm run clear-old-errors
   ```

2. **Check API status:**
   - Visit Apify Console
   - Check API quota
   - Verify actor status

3. **Database health:**
   - Check MongoDB connection
   - Monitor database size
   - Check indexes

## 5. Error Response Format

All errors now include:
- Error message
- Error type
- Status code (if applicable)
- Suggestions for fixing
- Timestamp

## 6. Health Check

Use `/api/health` endpoint to check:
- Database connection status
- Redis availability
- API key configuration
- Overall system health

## Summary

এই preventive measures-এর মাধ্যমে:
- ✅ API errors automatically retry হবে
- ✅ Database errors gracefully handle হবে
- ✅ Scraper errors system crash করবে না
- ✅ Better error messages দেখাবে
- ✅ Helpful suggestions provide করবে

