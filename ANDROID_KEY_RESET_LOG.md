# Android Signing Key Reset Log - Dec 21, 2025

**Status**: Key Reset Requested (Pending 48h Google wait)

## The Valid Key
We have generated a NEW upload key because the previous one (from Dec 19) was lost/locked.

- **Keystore File**: `upload-key.jks` (Located in project root)
- **Certificate File**: `upload_certificate.pem` (Uploaded to Google)
- **Key Alias**: `upload`
- **Keystore Password**: `android`
- **Key Password**: `android`

> **Note**: The old file `@mpc_triengen_sv_naum__sv-naum-calendar.jks` is LOCKED/LOST. Do not use it.

## Step-by-Step Instructions

### 1. Google Play Console (The Request)
1. Go to **Release > Setup > App Integrity > App Signing**.
2. If there is a pending request from Dec 19, click **Cancel Request**.
3. Click **Request upload key reset**.
4. Select "I need to upload a new key certificate".
5. Upload the file: **`upload_certificate.pem`**
6. Click **Submit**.
   - *Result*: Google will say "New key active in 48 hours".

### 2. EAS Build Configuration (The Save)
To ensure the app builds correctly after the 48h wait, we must save the key to Expo.

1. Open terminal in project folder.
2. Run: `npx eas credentials`
3. Select **Android** > **production** > **Update Keystore**.
4. Select **Upload a keystore**.
   - Path: `upload-key.jks`
5. Enter credentials:
   - Keystore Password: `android`
   - Key Alias: `upload`
   - Key Password: `android`

> **CONFIRMED**: EAS is now using the correct key (SHA1: `16:70:B5...`).


## Next Steps
- Wait until **Dec 23, 2025** (approx).
- Google will email you saying "The upload key reset is complete".
- After that email, you can run `eas submit -p android` successfully.

## Context & History (The "Lost Key" Incident)

**Date**: Dec 21, 2025

**The Problem**:
- A request to reset the upload key was made on **Dec 19, 2025**.
- Google sent a confirmation email with SHA-1 fingerprint starting with `67:15:9A...`.
- However, on Dec 21, the only keystore file found locally (`upload-key.jks`) had a SHA-1 fingerprint starting with `16:70:B5...`.
- Another file `@mpc_triengen_sv_naum__sv-naum-calendar.jks` (created Dec 18) existed but the password was lost (tried `android`, `SvNaum`, etc. without success).

**The Decision**:
- Since the key matching the pending Google request (`67:15...`) could not be unlocked or found, it was declared **LOST**.
- We decided to **cancel** the old Dec 19 request.
- We generated a **NEW** key (`upload-key.jks`) on Dec 21.
- We started a **NEW** request with Google using this new key.

**Result**:
- We are now waiting for the *new* 48h timer (expiring ~Dec 23).
- We have verified that EAS is correctly configured with the new key (`16:70...`).

