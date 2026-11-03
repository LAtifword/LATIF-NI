# LATIF Offline AI — standalone Android project

This is a clean, independent Expo SDK 54 app. It does not use the previous literary application.
It bundles the user's existing LoRA-merged GGUF model through Metro assets and initializes `llama.rn` on-device.

This directory is the canonical, editable source for Android package `com.latif.offlineai`. The original source archive at `android-offline/source.zip.b64` is retained for provenance; the APK workflow builds from this directory.

The primary AI remains the existing LATIF Qwen2.5 0.5B GGUF model, initialized through `llama.rn` in `lib/offline.ts`. The model binary is not committed to this repository.

## Android keyboard behavior

The Android activity uses `softwareKeyboardLayoutMode: "resize"`, requesting window resizing when the IME opens. A full-screen `KeyboardAvoidingView` applies Android `height` behavior while the chat and composer stay in one flexible layout; iOS retains `padding` behavior. The scroll view keeps taps enabled while the keyboard is open and follows streamed output while the user is at the bottom. The multiline composer and Send action remain in the resized window.

Run the automated source-level regression checks with:

```sh
node --test tests/keyboard-layout.test.mjs
```

These checks validate the IME configuration and component contracts. They are not a substitute for Android emulator or physical-device keyboard testing.

## Build and validation

The workflow at `.github/workflows/latif-embedded-apk.yml` retrieves the GGUF from the already validated APK artifact of run `41063568398`, extracts only the model, validates its SHA-256, then runs Expo prebuild and assembles a release APK. This avoids committing or republishing the model. The old Google Drive link currently rejects unauthenticated CI downloads; the reference artifact is retained until 2027-01-28 and the run ID must be refreshed from a later successful build before it expires. To reproduce locally on an Android build machine with Node 22, JDK 17, Android SDK/NDK, and the model in `assets/models/`:

```sh
npm ci
npm run model:verify
npm run test:keyboard
npm run check
npx expo prebuild --platform android --non-interactive
cd android
./gradlew assembleRelease --no-daemon
```

The expected model is 397,807,680 bytes with SHA-256 `4c5deec6759705c82c4ec59e8611383ed1c5fd1badae6fbd104fbec891480a76`. Do not replace or retrain it as part of UI work.

An earlier successful GitHub Actions build is recorded at run `41063568398` (commit `8967397038d27214b3be1411b399096bb6af76c5`). The APK supplied for this task matches that artifact's size, archive entry names, package configuration, and model SHA-256; 659 of 660 archive entries are byte-identical, with only `resources.arsc` differing. This supports provenance but is not a whole-file byte-identical match.

The keyboard change is not yet verified on an Android emulator or physical device. File/document intelligence, microphone speech input, spoken output, camera/vision, persistent conversation history, cancellation controls, settings, and model management are not implemented in this source. The current model is text-only; attaching an image alone must not be represented as image understanding. Those capabilities require separate implementation and runtime testing before the broader acceptance checklist is met.

## Release validation
- Build is NOT verified on the user's Windows machine.
- Model file is intentionally NOT included in this ZIP.
- Inspect the APK to ensure GGUF is packaged; test with airplane mode on a physical Android phone.
- Local Gradle release signing must be inspected before distributing this APK to others.
- If Expo reports version conflicts, use `pnpm exec expo install --check` to diagnose rather than blindly upgrading all dependencies.
