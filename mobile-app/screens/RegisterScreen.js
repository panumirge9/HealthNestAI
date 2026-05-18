import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';
import Input from '../components/Input';
import Button from '../components/Button';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const submit = async () => {
    setLoading(true); setError(null);
    try { await register(form); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: SPACING['2xl'] }}>
        
        {/* Premium App Logo Wrapper */}
        <View style={{ alignItems: 'center', marginBottom: SPACING['3xl'] }}>
          <View style={{ 
            width: 72, height: 72, borderRadius: 20, backgroundColor: '#fff', padding: 3, 
            marginBottom: SPACING.md, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, 
            shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 
          }}>
            <Image source={require('../assets/icon.png')} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }} />
          </View>
        </View>

        <Text style={[TYPE.h1, { marginBottom: SPACING.xs }]}>Create account</Text>
        <Text style={[TYPE.caption, { marginBottom: SPACING['3xl'] }]}>Free to use. No card required.</Text>

        <Input label="Name" value={form.name} onChangeText={v => setForm({...form, name: v})} placeholder="Your name" />
        <Input label="Email" value={form.email} onChangeText={v => setForm({...form, email: v})} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
        <Input label="Password (min 8)" value={form.password} onChangeText={v => setForm({...form, password: v})} secureTextEntry placeholder="••••••••" />

        {error && (
          <View style={{ backgroundColor: COLORS.dangerBg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#FCA5A5' }}>
            <Text style={{ color: COLORS.danger, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        <Button label="Get started" onPress={submit} loading={loading} fullWidth size="lg" />

        <Text onPress={() => navigation.navigate('Login')}
          style={[TYPE.caption, { textAlign: 'center', marginTop: SPACING['2xl'] }]}>
          Have an account? <Text style={{ color: COLORS.primary, fontWeight: FONT.bold }}>Sign in</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}