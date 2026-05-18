import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';
import Input from '../components/Input';
import Button from '../components/Button';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const submit = async () => {
    setLoading(true); setError(null);
    try { await login(email, password); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: SPACING['2xl'] }}>
        
        {/* Premium App Logo Wrapper (Keeps your heartbeat icon.png) */}
        <View style={{ alignItems: 'center', marginBottom: SPACING['4xl'] }}>
          <View style={{ 
            width: 88, height: 88, borderRadius: 24, backgroundColor: '#fff', padding: 4, 
            marginBottom: SPACING.lg, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 12 }, 
            shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 
          }}>
            <Image source={require('../assets/icon.png')} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
            {/* Subtle glassmorphic border overlay */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }} />
          </View>
          <Text style={[TYPE.h2, { marginBottom: 2, fontWeight: '800' }]}>HealthNestAI</Text>
          <Text style={TYPE.caption}>AI-powered health intelligence</Text>
        </View>

        <Text style={[TYPE.h1, { marginBottom: SPACING.xs }]}>Welcome back</Text>
        <Text style={[TYPE.caption, { marginBottom: SPACING['3xl'] }]}>Sign in to continue</Text>

        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

        {error && (
          <View style={{ backgroundColor: COLORS.dangerBg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#FCA5A5' }}>
            <Text style={{ color: COLORS.danger, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        <Button label="Sign in" onPress={submit} loading={loading} fullWidth size="lg" />

        <Text onPress={() => navigation.navigate('Register')}
          style={[TYPE.caption, { textAlign: 'center', marginTop: SPACING['2xl'] }]}>
          No account? <Text style={{ color: COLORS.primary, fontWeight: FONT.bold }}>Sign up</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}