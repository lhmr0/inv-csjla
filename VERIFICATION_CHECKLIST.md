# ✅ Verification Checklist - Google Drive Photo Upload Feature

Use this checklist to verify everything is working before trying to upload photos to Google Drive.

---

## 📋 PRE-LAUNCH CHECKS

### 1. Basic App Functionality
- [ ] App loads without errors
- [ ] Can navigate between tabs (Inventario, Cargar, Estadísticas, Inventariados)
- [ ] localStorage is working (press F12 → Application → Storage)
- [ ] No red errors in console (F12 → Console)

### 2. Photo Capture
- [ ] Photo button appears in "Cargar" tab
- [ ] Can capture 1 photo successfully
- [ ] Can capture 2 photos (max)
- [ ] Trying to capture 3rd photo shows warning
- [ ] Photos appear as preview below button
- [ ] Photo size shows correctly

### 3. UI Elements
- [ ] "📤 Enviar Fotos a Google Drive" button appears ONLY when photos are captured
- [ ] Button disappears when no photos captured
- [ ] Button is clickable (not disabled)

---

## 🔧 CONFIGURATION CHECKS

### 4. Google API Setup
```javascript
// Run in console (F12 → Console):
console.log(window.gapi ? '✅ gapi loaded' : '❌ gapi NOT loaded')
console.log(DriveIntegration.CLIENT_ID)
```

- [ ] `gapi` shows as loaded
- [ ] CLIENT_ID displays (doesn't contain "TU_CLIENT_ID")
- [ ] CLIENT_ID matches Google Cloud Console

### 5. Google Cloud Console Configuration
- [ ] Navigate to [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Project selected
- [ ] Google Drive API is **ENABLED**
- [ ] OAuth 2.0 Client ID credential exists
- [ ] JavaScript origins includes: `https://lhmr0.github.io`
- [ ] Redirect URIs includes: `https://lhmr0.github.io/inv-csjla/`

---

## 🧪 FUNCTIONAL TESTS

### 6. Diagnostic Function
```javascript
// Run in console:
DriveIntegration.diagnose()
```

Expected output should show:
- [ ] CLIENT_ID válido: ✅ SÍ
- [ ] Google API available: ✅
- [ ] Fotos capturadas: [count > 0]

### 7. Pre-Upload State
```javascript
// Run in console:
console.log({
    fotos: window.currentProductPhotos?.length,
    autenticado: DriveIntegration.isAuthenticated,
    clientIdOk: !DriveIntegration.CLIENT_ID.includes('TU_CLIENT_ID'),
    gapiReady: !!window.gapi?.client?.drive
})
```

Expected:
- [ ] Fotos count > 0
- [ ] autenticado: false (initially, will be true after clicking button)
- [ ] clientIdOk: true
- [ ] gapiReady: true

### 8. Upload Test
1. [ ] Capture 1-2 photos in app
2. [ ] Click "📤 Enviar Fotos a Google Drive" button
3. [ ] Google OAuth popup appears
4. [ ] Can see "Sign in with Google" or accept permissions
5. [ ] After authorization, see success message "✅ X foto(s) enviada(s)"
6. [ ] Console shows detailed logs (F12 → Console should scroll up with new messages)

### 9. Drive Verification
1. [ ] Open [drive.google.com](https://drive.google.com)
2. [ ] Check your Google Drive for folder "Inventario_Fotos"
3. [ ] Folder contains uploaded photos (JPEG files)
4. [ ] Photos are viewable
5. [ ] Photos have correct timestamps

---

## 🔴 ERROR HANDLING CHECKS

### 10. Test Error Scenarios

**Scenario A: No photos**
- [ ] Click "📤 Enviar" with no photos
- [ ] See warning toast "No hay fotos para enviar"

**Scenario B: Decline permission**
- [ ] Capture photos
- [ ] Click "📤 Enviar"
- [ ] In OAuth popup, click "Decline" or close
- [ ] See error message in console
- [ ] App doesn't crash

**Scenario C: Slow upload**
- [ ] Photos upload (watch for "🚀 Iniciando upload" in console)
- [ ] See progress "Foto X/Y"
- [ ] Eventually see success or error

---

## 🔐 SECURITY CHECKS

### 11. Permission Verification
- [ ] App only requests: `https://www.googleapis.com/auth/drive.file`
- [ ] This grants access to files app creates only
- [ ] User can revoke in their Google Account settings
- [ ] No personal data accessed beyond photos

### 12. Data Privacy
- [ ] Photos not sent anywhere except Google Drive
- [ ] No copies kept in app memory after upload
- [ ] localStorage still has backup copy
- [ ] Can clear all data anytime via settings

---

## 📱 BROWSER/DEVICE CHECKS

### 13. Browser Compatibility
Test on:
- [ ] Chrome/Chromium (Desktop)
- [ ] Firefox (Desktop)
- [ ] Edge (Desktop)
- [ ] Safari (Desktop) - if possible
- [ ] Chrome (Mobile) - if applicable

Each should:
- [ ] Allow camera/photo access
- [ ] Capture and upload successfully
- [ ] Display success/error messages

### 14. Network Conditions
- [ ] Upload works on normal WiFi
- [ ] Upload works over mobile data (if applicable)
- [ ] Graceful handling if offline
- [ ] Retry message if blocked

---

## 🔧 TROUBLESHOOTING TEST

### 15. Can You Diagnose Issues?

Try these console commands and verify output:

```javascript
// Should show details
DriveIntegration.diagnose()

// Should show photos
console.table(window.currentProductPhotos)

// Should attempt auth
await DriveIntegration.authenticate()

// Should list Drive files (if authorized)
const result = await gapi.client.drive.files.list();
console.table(result.result.files)
```

- [ ] All commands execute without "undefined" errors
- [ ] Output is human-readable
- [ ] Error messages are clear

---

## 📊 PERFORMANCE CHECKS

### 16. Speed
- [ ] Photo capture < 2 seconds
- [ ] Upload start < 3 seconds
- [ ] Upload per photo (large) < 10 seconds
- [ ] Total 2-photo upload < 15 seconds

### 17. Resource Usage
```javascript
// Check memory isn't leaking
console.table(performance.getEntriesByType('measure'))
```

- [ ] Memory doesn't spike excessively
- [ ] App remains responsive
- [ ] No "Device out of memory" messages

---

## 📝 DOCUMENTATION CHECKS

### 18. Help Resources Available
- [ ] TROUBLESHOOTING_GOOGLE_DRIVE.md exists
- [ ] CONSOLE_DIAGNOSTICS.md exists  
- [ ] QUICK_REFERENCE.md exists
- [ ] RESUMEN_MEJORAS_DEBUGGING.md exists
- [ ] Each file is readable and up-to-date

### 19. Can Users Self-Troubleshoot?
- [ ] Can access help for 403 errors
- [ ] Can access help for permission errors
- [ ] Can find diagnostic commands
- [ ] Can generate debug info for support

---

## ✅ FINAL CHECKLIST

### 20. Sign-Off
- [ ] All sections above have been completed
- [ ] No blocking issues found
- [ ] Feature is ready for user testing
- [ ] Documentation is clear and helpful
- [ ] Error messages are user-friendly

**Date Completed:** ___________  
**Verified By:** ___________  
**Notes:** _________________________________

---

## 🚀 DEPLOYMENT READY?

When ALL checkboxes above are checked, the feature is ready for:
- ✅ Internal testing
- ✅ Beta user rollout  
- ✅ Full production deployment

---

## 🆘 If Checks Fail

| Failed Check | Action |
|---|---|
| Google API not loading | Hard reload (Ctrl+Shift+R), check script tags in index.html |
| OAuth popup won't appear | Verify CLIENT_ID in Google Cloud, check browser permissions |
| Photos won't upload | Check Google Cloud Console - add URLs to approved origins |
| DriveIntegration not in console | Verify drive-integration.js is loaded (check Network tab F12) |
| Storage not working | Enable localStorage in browser, check privacy settings |

---

**Checklist Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for verification

