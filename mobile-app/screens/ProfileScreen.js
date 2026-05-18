import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { profileApi } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

// 💎 Premium Lucide Icons
import { User, Activity, Droplet, AlertTriangle, HeartPulse, Edit2, Shield, LogOut } from 'lucide-react-native';

function StatRow({ Icon, label, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderColor: COLORS.divider }}>
      <View style={{ width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md }}>
        <Icon size={18} color={COLORS.textSecondary} />
      </View>
      <Text style={[TYPE.body, { flex: 1, color: COLORS.textSecondary }]}>{label}</Text>
      <Text style={[TYPE.bodyMedium, { color: value ? COLORS.text : COLORS.textMuted }]}>{value || 'Not set'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ age: '', gender: '', blood_group: '', allergies: '', existing_conditions: '' });

  const fetchProfile = () => {
    profileApi.get().then(r => {
      const s = r.data.stats || {};
      setStats(s);
      setForm({
        age: s.age ? String(s.age) : '',
        gender: s.gender || '',
        blood_group: s.blood_group || '',
        allergies: s.allergies || '',
        existing_conditions: s.existing_conditions || ''
      });
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload = { ...form, age: form.age ? Number(form.age) : null };
      await profileApi.update(payload);
      setEditing(false);
      fetchProfile();
      Alert.alert("Success", "Profile updated successfully");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}><ActivityIndicator color={COLORS.primary} /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: SPACING.lg, paddingTop: 60, paddingBottom: 100 }}>
      
      {/* Header Profile Info */}
      <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md, ...SHADOW.sm }}>
          <Text style={{ fontSize: 32, fontWeight: FONT.bold, color: COLORS.primaryDark }}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={[TYPE.h2, { marginBottom: 2 }]}>{user?.name}</Text>
        <Text style={[TYPE.caption]}>{user?.email}</Text>
      </View>

      {editing ? (
        /* ==================== EDIT MODE ==================== */
        <Card variant="elevated" style={{ padding: SPACING.lg, marginBottom: SPACING.xl }}>
          <Text style={[TYPE.h3, { marginBottom: SPACING.lg }]}>Edit Profile Details</Text>
          
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}><Input label="Age" value={form.age} onChangeText={v => setForm({...form, age: v})} keyboardType="numeric" placeholder="e.g. 30" /></View>
            <View style={{ flex: 1 }}><Input label="Gender" value={form.gender} onChangeText={v => setForm({...form, gender: v})} placeholder="Male/Female" /></View>
          </View>
          
          <Input label="Blood Group" value={form.blood_group} onChangeText={v => setForm({...form, blood_group: v})} placeholder="e.g. O+" />
          <Input label="Allergies" value={form.allergies} onChangeText={v => setForm({...form, allergies: v})} placeholder="Peanuts, Penicillin..." />
          <Input label="Existing Conditions" value={form.existing_conditions} onChangeText={v => setForm({...form, existing_conditions: v})} placeholder="Asthma, Diabetes..." multiline />
          
          <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md }}>
            <Button label="Cancel" variant="ghost" onPress={() => { setEditing(false); fetchProfile(); }} style={{ flex: 1 }} />
            <Button label="Save Changes" onPress={saveProfile} loading={saving} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        /* ==================== VIEW MODE ==================== */
        <>
          <Card variant="elevated" style={{ padding: SPACING.md, paddingBottom: 0, marginBottom: SPACING.xl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: SPACING.md, borderBottomWidth: 1, borderColor: COLORS.divider }}>
              <Text style={{ fontSize: 16, fontWeight: FONT.bold, color: COLORS.text }}>Health Details</Text>
              <TouchableOpacity onPress={() => setEditing(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full }}>
                <Edit2 size={12} color={COLORS.primaryDark} />
                <Text style={{ fontSize: 12, fontWeight: FONT.bold, color: COLORS.primaryDark }}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <StatRow Icon={User} label="Age & Gender" value={stats.age ? `${stats.age} yrs · ${stats.gender}` : ''} />
            <StatRow Icon={Droplet} label="Blood Group" value={stats.blood_group} />
            <StatRow Icon={AlertTriangle} label="Allergies" value={stats.allergies} />
            <View style={{ paddingBottom: SPACING.md }}>
              <StatRow Icon={HeartPulse} label="Conditions" value={stats.existing_conditions} />
            </View>
          </Card>

          {/* Upgrade Plan Banner */}
          <Card variant="elevated" style={{ padding: 0, overflow: 'hidden', marginBottom: SPACING.xl }}>
            <View style={{ backgroundColor: '#1E293B', padding: SPACING.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Shield size={18} color="#FBBF24" />
                <Text style={{ color: '#FBBF24', fontWeight: FONT.bold, fontSize: 14 }}>PRO PLAN</Text>
              </View>
              <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: FONT.bold, marginBottom: 8 }}>Unlock AI Lab Analysis & Unlimited Chats</Text>
              
              <TouchableOpacity activeOpacity={0.8} onPress={() => Alert.alert('Coming soon', 'Payment integration pending')}
                style={{ backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.sm }}>
                <Text style={{ color: '#fff', fontWeight: FONT.bold }}>Upgrade to Premium</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </>
      )}

      {/* Sign Out Button */}
      <Button
        label="Sign out"
        variant="danger"
        fullWidth
        icon={<LogOut size={18} color={COLORS.danger} />}
        onPress={() => Alert.alert('Sign out', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign out', style: 'destructive', onPress: logout },
        ])}
      />
    </ScrollView>
  );
}