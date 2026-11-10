# LATIF 3D — Standalone Android application

This project wraps the actual LATIF 3D WebGL learning studio in a standalone Android app. App ID: `com.latif.energy3d`; Android 7.0+.

* Starts directly in the rotatable, touch-controlled 3D studio.
* Includes all six demonstration modes, guided practice sessions, and the original learning lab.
* All rendering assets are bundled in the APK, with no external CDN and no app internet permission.
* This illustrates traditional concepts and scientific questions; it does not establish supernatural abilities.
* GitHub Actions builds a debug-signed sideload APK: **LATIF-3D-STANDALONE-APK**.

The Android shell uses the system WebView for locally bundled HTML/WebGL rendering; it is not a server-hosted website. APK signing uses the Android debug key and must be replaced by a secure private release key for official distribution.
