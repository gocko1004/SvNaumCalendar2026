# Firebase Admin Setup Guide

## Security Update
The app now uses **Firebase Authentication** instead of hardcoded credentials. This is much more secure!

## Setting Up Admin User

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **svnaumkalendar**

### Step 2: Create Admin User
1. Go to **Authentication** → **Users** tab
2. Click **Add user**
3. Enter email: **Your preferred admin email** (e.g., `admin@svnaum.triengen` or `svnaum.triengen@gmail.com`)
4. Enter password: Your secure password (e.g., `SvNaum2025#Triengen`)
5. Click **Add user**

### Step 3: Login in App
- **Email:** Use the **full email address** you created in Firebase (e.g., `admin@svnaum.triengen`)
- **Or Username:** If you used `admin@svnaumkalendar.firebaseapp.com`, you can just type `admin`
- **Password:** The password you set in Firebase Console

**Note:** You can use ANY email address you want! Just make sure to use the full email when logging in if it's not the default format.

## Important Security Notes

✅ **Secure:**
- Credentials are stored in Firebase (not in app code)
- Firebase handles password hashing and security
- Can reset password through Firebase Console
- Can add multiple admin users
- Can revoke access by deleting user in Firebase

❌ **Old Method (Removed):**
- ~~Hardcoded credentials in source code~~
- ~~Anyone with app code could see password~~
- ~~No way to change password without code update~~

## Additional Security Recommendations

1. **Use Strong Password:** At least 12 characters, mix of letters, numbers, symbols
2. **Enable 2FA:** Consider enabling two-factor authentication in Firebase
3. **Monitor Access:** Check Firebase Console → Authentication → Users for login activity
4. **Regular Password Updates:** Change password periodically
5. **Limit Admin Users:** Only create admin accounts for trusted personnel

## Troubleshooting

**Can't login?**
- Verify user exists in Firebase Console → Authentication → Users
- Check email format (should be valid email)
- Try using full email instead of username
- Reset password in Firebase Console if needed

**Need to change password?**
- Go to Firebase Console → Authentication → Users
- Click on the user
- Click "Reset password" or "Change password"

