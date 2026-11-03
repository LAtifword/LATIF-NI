import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {answerOffline, getModel} from './lib/offline';

type Message = {role: 'user' | 'assistant'; content: string};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('Preparing on-device model…');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const conversation = useRef<Message[]>([]);
  const chatRef = useRef<ScrollView>(null);
  const followLatest = useRef(true);

  useEffect(() => {
    let live = true;
    getModel()
      .then(() => {
        if (live) {
          setReady(true);
          setStatus('Offline model ready');
        }
      })
      .catch((err) => {
        if (live) setStatus('Model error: ' + String(err?.message ?? err));
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (followLatest.current) {
        requestAnimationFrame(() => chatRef.current?.scrollToEnd({animated: true}));
      }
    });
    return () => subscription.remove();
  }, []);

  function handleChatScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    followLatest.current = distanceFromBottom < 72;
  }

  async function send() {
    const question = input.trim();
    if (!question || !ready || busy) return;
    setInput('');
    followLatest.current = true;
    const updated: Message[] = [...conversation.current, {role: 'user', content: question}];
    conversation.current = updated;
    setMessages([...updated, {role: 'assistant', content: ''}]);
    setBusy(true);
    try {
      const result = await answerOffline(
        [
          {role: 'system', content: 'You are LATIF, a helpful offline AI assistant. Answer in the language of the user. Be clear and accurate.'},
          ...updated.map((message) => ({role: message.role, content: message.content})),
        ],
        (token) => {
          setMessages((previous) => {
            const next = [...previous];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              next[next.length - 1] = {...last, content: last.content + token};
            }
            return next;
          });
        },
      );
      conversation.current = [...updated, {role: 'assistant', content: result}];
      setMessages(conversation.current);
    } catch (err) {
      const error = 'Inference error: ' + String((err as Error)?.message ?? err);
      setStatus(error);
      setMessages([...updated, {role: 'assistant', content: error}]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0C111B" />
        <View style={styles.header}>
          <Text style={styles.title}>LATIF · OFFLINE AI</Text>
          <Text style={styles.sub} accessibilityLiveRegion="polite">{status}</Text>
        </View>
        <ScrollView
          ref={chatRef}
          style={styles.chat}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onScroll={handleChatScroll}
          scrollEventThrottle={100}
          onContentSizeChange={() => {
            if (followLatest.current) chatRef.current?.scrollToEnd({animated: false});
          }}
        >
          {messages.length === 0 && (
            <Text style={styles.welcome}>
              مساعدك الذكي يعمل على جهازك بدون خادم.{"\n"}Your private, on-device AI assistant.
            </Text>
          )}
          {messages.map((message, index) => (
            <View key={index} style={[styles.bubble, message.role === 'user' ? styles.user : styles.assistant]}>
              <Text style={styles.role}>{message.role === 'user' ? 'YOU' : 'LATIF'}</Text>
              <Text selectable style={styles.content}>{message.content || '…'}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.composer}>
          <TextInput
            multiline
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="اكتب سؤالك… / Ask anything"
            placeholderTextColor="#85909e"
            accessibilityLabel="Message LATIF"
            textAlignVertical="top"
            blurOnSubmit={false}
            returnKeyType="default"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!ready || busy || !input.trim()}
            onPress={send}
            style={[styles.button, (!ready || busy || !input.trim()) && styles.disabled]}
          >
            {busy ? <ActivityIndicator color="#071220" /> : <Text style={styles.buttonText}>SEND</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {flex: 1, backgroundColor: '#0C111B'},
  safeArea: {flex: 1, backgroundColor: '#0C111B', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0},
  header: {padding: 20, borderBottomWidth: 1, borderColor: '#263241'},
  title: {color: '#E8C98B', fontSize: 20, fontWeight: '700', letterSpacing: 1},
  sub: {color: '#A4B5C8', fontSize: 12, marginTop: 6},
  chat: {flex: 1},
  messages: {padding: 16, paddingBottom: 28, gap: 12, flexGrow: 1},
  welcome: {color: '#C6D0DD', fontSize: 17, textAlign: 'center', lineHeight: 29, marginTop: 75},
  bubble: {padding: 15, borderRadius: 15, maxWidth: '93%'},
  user: {alignSelf: 'flex-end', backgroundColor: '#26394E'},
  assistant: {alignSelf: 'flex-start', backgroundColor: '#1B2631'},
  role: {color: '#E8C98B', fontSize: 11, fontWeight: '700', marginBottom: 7},
  content: {color: '#F2F4F8', fontSize: 16, lineHeight: 25},
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#0C111B',
  },
  input: {flex: 1, color: 'white', backgroundColor: '#1D2B39', borderRadius: 12, padding: 12, maxHeight: 140, minHeight: 48},
  button: {justifyContent: 'center', alignItems: 'center', minHeight: 48, paddingHorizontal: 17, borderRadius: 12, backgroundColor: '#E8C98B'},
  disabled: {opacity: 0.5},
  buttonText: {color: '#15202D', fontWeight: '800'},
});
