# 🔐 SECURITY ALERT - API Key Exposed

**⚠️ IMPORTANT: Your Google Maps API key was committed to git history and needs to be rotated immediately!**

## Immediate Action Required

### 1. Rotate Your Google Maps API Key

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your API key: `AIzaSyCX47dfg3U8ZXNSn9fIxPJK2jpV9kMfSNY`
3. **Delete it** or **Regenerate** it immediately
4. Create a new API key
5. Enable the following APIs for the new key:
   - Maps SDK for Android
   - Directions API
   - (Optional) Places API

### 2. Update Your Local Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your **NEW** API key:
   ```env
   GOOGLE_MAPS_API_KEY=your_new_api_key_here
   ```

3. Update your Supabase credentials in `.env` as well

### 3. Why This Happened

The API key was hardcoded in `app.json` in commit `973de88`. Even though we've removed it from the current code, it still exists in git history.

### 4. What We've Done

✅ Removed API keys from `app.json`  
✅ Created `app.config.js` to load keys from environment variables  
✅ Added `.env.example` template  
✅ Force-pushed to remove the exposed commit from remote  
✅ API keys now safely stored in `.env` (which is in `.gitignore`)

### 5. Verify the Old Key is Disabled

Monitor your [Google Cloud Console Usage](https://console.cloud.google.com/apis/dashboard) to ensure the old key is not being used.

---

## For Future Development

**Never commit these files with secrets:**
- `.env` ✅ (already in .gitignore)
- `app.json` if it contains API keys ❌ (use app.config.js instead)
- Any configuration files with credentials

**Always use:**
- Environment variables (`.env` file)
- `app.config.js` with `process.env.*`
- `.env.example` for templates

---

## Questions?

If you have any questions about security best practices, feel free to ask!
