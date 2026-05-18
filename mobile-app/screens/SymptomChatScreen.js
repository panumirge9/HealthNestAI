import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import api from '../lib/api';
import { COLORS, SPACING, RADIUS, FONT } from '../lib/theme';

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <View style={{ flexDirection: 'row', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      {!isUser && (
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 4 }}>
          <Text style={{ fontSize: 14 }}>🩺</Text>
        </View>
      )}
      <View style={{
        maxWidth: '78%',
        paddingHorizontal: 14, paddingVertical: 10,
        backgroundColor: isUser ? COLORS.primary : '#fff',
        borderRadius: 18,
        borderBottomRightRadius: isUser ? 6 : 18,
        borderBottomLeftRadius: isUser ? 18 : 6,
        borderWidth: isUser ? 0 : 1,
        borderColor: COLORS.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
        elevation: 1,
      }}>
        <Text style={{ fontSize: 14, lineHeight: 20, color: isUser ? '#fff' : COLORS.text }}>{msg.content}</Text>
      </View>
    </View>
  );
}

function TypingDots() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 14 }}>🩺</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, borderBottomLeftRadius: 6, paddingHorizontal: 14, paddingVertical: 10 }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 6 }}>Analyzing…</Text>
      </View>
    </View>
  );
}

function AnalysisCard({ analysis }) {
  if (!analysis) return null;
  const colors = { Mild: '#16a34a', Moderate: '#d97706', Severe: '#dc2626' };
  const icons = { Mild: '🟢', Moderate: '🟡', Severe: '🔴' };
  const col = colors[analysis.severity] || '#6b7280';

  return (
    <View style={{ marginVertical: SPACING.md }}>
      <View style={{ backgroundColor: col + '12', borderWidth: 1.5, borderColor: col + '40', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm }}>
        <Text style={{ fontSize: 20 }}>{icons[analysis.severity]} <Text style={{ fontWeight: FONT.bold, color: col }}>{analysis.severity}</Text></Text>
        <Text style={{ fontSize: 13, color: COLORS.text, marginTop: 6, lineHeight: 19 }}>{analysis.recommended_action}</Text>
      </View>
      <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.lg }}>
        <Text style={{ fontWeight: FONT.bold, marginBottom: SPACING.sm }}>Possible causes</Text>
        {analysis.causes?.slice(0, 4).map((c, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: i < 3 ? 1 : 0, borderColor: '#f5f5f4' }}>
            <Text style={{ fontSize: 13, textTransform: 'capitalize' }}>{c.name}</Text>
            <Text style={{ fontSize: 10, fontWeight: FONT.bold, textTransform: 'uppercase',
              color: c.confidence === 'high' ? '#16a34a' : c.confidence === 'moderate' ? '#d97706' : '#9ca3af' }}>{c.confidence}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SymptomChatScreen() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your health assistant. Tell me what symptoms you're experiencing — for example, \"I have a headache and fever.\"" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(["I have headache", "Fever and cough", "Stomach hurts"]);
  const scrollRef = useRef(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100);
  }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setSuggestions([]);
    setAnalysis(null);

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/symptom/chat', {
        message: msg,
        history: [...history, userMsg],
        context,
      });

      setContext(data.context);
      setSuggestions(data.suggestions || []);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

      if (data.stage === 'analysis' && data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([{ role: 'assistant', content: "Let's start fresh. What symptoms are you experiencing?" }]);
    setContext(null); setAnalysis(null);
    setSuggestions(["I have headache", "Fever and cough", "Stomach hurts"]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fafaf8' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🩺</Text>
          </View>
          <View>
            <Text style={{ fontWeight: FONT.bold, fontSize: 16 }}>Symptom Analysis</Text>
            <Text style={{ fontSize: 10, color: COLORS.textMuted }}>AI health assistant</Text>
          </View>
        </View>
        {messages.length > 2 && (
          <TouchableOpacity onPress={reset} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f5f5f4' }}>
            <Text style={{ fontSize: 11, color: COLORS.textMuted }}>New chat</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd?.({ animated: true })}>
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {loading && <TypingDots />}
        {analysis && <AnalysisCard analysis={analysis} />}
      </ScrollView>

      {/* Suggestions */}
      {suggestions.length > 0 && !loading && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f5f5f4' }}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i} onPress={() => send(s)} style={{
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
              backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac',
            }}>
              <Text style={{ fontSize: 12, color: '#15803d', fontWeight: FONT.medium }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={{ flexDirection: 'row', gap: 8, padding: SPACING.md, backgroundColor: '#fff', borderTopWidth: 1, borderColor: COLORS.border }}>
        <TextInput value={input} onChangeText={setInput} placeholder="Describe your symptoms…"
          placeholderTextColor="#a8a8a3" editable={!loading}
          onSubmitEditing={() => send()}
          style={{ flex: 1, backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 }} />
        <TouchableOpacity onPress={() => send()} disabled={loading || !input.trim()}
          style={{ width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: input.trim() ? COLORS.primary : '#e5e5e5', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: FONT.bold }}>↑</Text>
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 9, color: COLORS.textMuted, textAlign: 'center' }}>AI health guidance only — not a medical diagnosis.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}
