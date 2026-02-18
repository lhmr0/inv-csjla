# 🎯 QUICK REFERENCE - Google Drive Upload Debugging

## ⚡ 30-Second Diagnostic

**Press F12 → Console → Paste:**
```javascript
DriveIntegration.diagnose()
```

**Look for:**
- ✅ All GREEN = Ready to send photos
- ❌ Any RED = That's what needs fixing

---

## 🔴 Most Common Errors → Solution

| Error | Console Output | Solution |
|---|---|---|
| **Popup won't appear** | `auth2 disponible: ❌ NO` | Reload page (F5) then try again |
| **Error 403 mismatch** | `{error: 'server_error'}` | Register URL in Google Cloud Console |
| **Permission denied** | `Permiso denegado` | Enable Drive API in Cloud Console |
| **Session expired** | `Token expirado` | Hard reload (Ctrl+Shift+R) |

---

## 🔧 Quick Fixes (Try These First)

### 1. Hard Reload
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### 2. Clear Google Cookies Only
```
F12 → Application → Cookies
Search: "google"
Delete All
Then hard reload
```

### 3. Use Incognito Window
```
Windows: Ctrl + Shift + N
Mac: Cmd + Shift + N
```

---

## 📋 3-Step Debug Process

### Step 1: Check Status
```javascript
DriveIntegration.diagnose()
```

### Step 2: Find What's Red ❌

### Step 3: Match to Fix Table Above

---

## 🔗 Google Cloud Setup (5 minutes)

1. Open: [console.cloud.google.com](https://console.cloud.google.com)
2. Go to: *APIs & Services → Credentials*
3. Edit OAuth Client
4. Add to **JavaScript origins**: 
   ```
   https://lhmr0.github.io
   ```
5. Add to **Redirect URIs**:
   ```
   https://lhmr0.github.io/inv-csjla/
   https://lhmr0.github.io/
   ```
6. SAVE
7. Wait 10 minutes

---

## 💻 Console Commands Cheat Sheet

| What | Command |
|---|---|
| Full diagnosis | `DriveIntegration.diagnose()` |
| View photos | `console.table(window.currentProductPhotos)` |
| Test auth | `await DriveIntegration.authenticate()` |
| Send photos | `App.sendPhotosToGoogleDrive()` |
| Check Google session | `window.gapi?.auth2?.getAuthInstance()?.isSignedIn?.get()` |
| Clear local storage | `localStorage.clear();location.reload()` |

---

## 📊 Traffic Light System

**GREEN ✅** = OK  
**RED ❌** = Problem  
**YELLOW ⚠️** = Warning but might work

From `DriveIntegration.diagnose()`:
- ✅ **All GREEN** → Photos ready, click upload button
- ❌ **RED items** → See fix table above  
- ✅ **But no folder ID** → Click upload and it will create folder

---

## 🆘 If Still Stuck

Collect this and send to support:

```javascript
// Copy entire output from running this:
DriveIntegration.diagnose()

// Also include:
// 1. URL you're on
// 2. Exact error message from console (red text)
// 3. Steps you did to reproduce
```

---

## 📱 Key Files Reference

| File | Purpose |
|---|---|
| `js/drive-integration.js` | Handles all Google Drive logic |
| `js/app.js` | Main app controller |
| `TROUBLESHOOTING_GOOGLE_DRIVE.md` | Detailed solutions |
| `CONSOLE_DIAGNOSTICS.md` | Console commands guide |

---

## ✅ Before Contacting Support

- [ ] Ran `DriveIntegration.diagnose()`
- [ ] Copied output that shows problem
- [ ] Checked Google Cloud Console settings
- [ ] Tried hard reload (Ctrl+Shift+R)
- [ ] Tried incognito window
- [ ] Waited 10 minutes after Cloud changes
- [ ] Checked URL is correct (https://lhmr0.github.io/...)

---

## 🎓 Understanding the Flow

```
Photo Capture → Button Click → Google OAuth Popup → 
→ Auth Check ✅ → Folder Create ✅ → Upload Photo ✅ → Success ✅
    ↓
   Any ❌ → See console error → Match to table → Fix
```

---

**🔥 Most Common Fix (80% of issues):**
```
1. Go to console.cloud.google.com
2. Credentials → Authorized JavaScript origins
3. Add: https://lhmr0.github.io
4. SAVE
5. Wait 10 minutes
6. Hard reload (Ctrl+Shift+R)
7. Try again
```

---

**Version:** Quick Ref v1.0  
**Last Updated:** 2024

