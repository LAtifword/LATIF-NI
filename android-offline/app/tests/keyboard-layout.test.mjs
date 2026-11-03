import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const appConfig = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

test('Android window requests resize when the IME opens', () => {
  assert.equal(appConfig.expo.android.softwareKeyboardLayoutMode, 'resize');
});

test('keyboard avoidance wraps the whole flexible chat screen on Android', () => {
  assert.match(appSource, /<KeyboardAvoidingView[\s\S]*?style=\{styles\.keyboardRoot\}/);
  assert.match(appSource, /behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}/);
  assert.match(appSource, /keyboardRoot:\s*\{\s*flex:\s*1/);
  assert.match(appSource, /<SafeAreaView[\s\S]*?<ScrollView[\s\S]*?<View style=\{styles\.composer\}/);
});

test('chat taps remain usable and latest content follows the keyboard when appropriate', () => {
  assert.match(appSource, /keyboardShouldPersistTaps="handled"/);
  assert.match(appSource, /Keyboard\.addListener\('keyboardDidShow'/);
  assert.match(appSource, /scrollToEnd\(\{animated:\s*true\}\)/);
});

test('multiline message input and send action remain accessible and touch-sized', () => {
  assert.match(appSource, /<TextInput[\s\S]*?multiline[\s\S]*?accessibilityLabel="Message LATIF"/);
  assert.match(appSource, /accessibilityLabel="Send message"/);
  assert.match(appSource, /minHeight:\s*48/);
  assert.match(appSource, /maxHeight:\s*140/);
});
