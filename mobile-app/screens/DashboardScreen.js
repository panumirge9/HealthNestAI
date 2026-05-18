import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { profileApi } from '../lib/api';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';

// 💎 Premium Lucide Icons
import { Target, HeartPulse, FlaskConical, Bell, Archive, AlertTriangle, Shield } from 'lucide-react-native';

const FEATURE_GRID = [
  [
    { screen: 'Goals', title: 'Health Goals', Icon: Target, bg: COLORS.primaryLight, color: COLORS.primaryDark, size: 'lg' },
    { screen: 'Medical', title: 'Medical History', Icon: HeartPulse, bg: COLORS.dangerBg, color: COLORS.danger, size: 'lg' },
  ],
  [
    { screen: 'Labs', title: 'Lab Results', Icon: FlaskConical, bg: COLORS.blueBg, color: COLORS.blue, size: 'md' },
    { screen: 'Reminders', title: 'Reminders', Icon: Bell, bg: COLORS.purpleBg, color: COLORS.purple, size: 'md' },
    { screen: 'Inventory', title: 'Med Inventory', Icon: Archive, bg: COLORS.orangeBg, color: COLORS.orange, size: 'md' },
  ],
  [
    { screen: 'Emergency', title: 'Emergency ID', Icon: AlertTriangle, bg: '#FEE2E2', color: '#991B1B', size: 'full' },
    { screen: 'Insurance', title: 'Insurance', Icon: Shield, bg: '#EFF6FF', color: '#1D4ED8', size: 'full' }
  ]
];

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    profileApi.get().then(r => setStats(r.data.stats || {})).catch(() => {});
  }, []);

  const navigate = (screen) => navigation.navigate(screen);
  const first = user?.name?.split(' ')[0] || 'there';
  const greet = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: SPACING.lg, paddingTop: 60, paddingBottom: 100 }}>
      <View style={{ marginBottom: SPACING.xl }}>
        <Text style={[TYPE.h1, { marginBottom: 4 }]}>{greet}, {first}</Text>
        <Text style={TYPE.body}>What would you like to focus on today?</Text>
      </View>

      {/* Phase 2: Grid Layout */}
      <View style={{ gap: SPACING.md }}>
        
        {/* Top Row: Large Cards */}
        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          {FEATURE_GRID[0].map(f => (
            <TouchableOpacity key={f.screen} onPress={() => navigate(f.screen)} activeOpacity={0.8}
              style={{ flex: 1, backgroundColor: f.bg, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'flex-start', ...SHADOW.sm }}>
              <View style={{ width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md }}>
                <f.Icon size={24} color={f.color} strokeWidth={2.5} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: FONT.bold, color: f.color, marginBottom: 2 }}>{f.title}</Text>
              <Text style={{ fontSize: 11, color: f.color, opacity: 0.8, fontWeight: FONT.medium }}>View details →</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Middle Row: 3 small blocks */}
        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          {FEATURE_GRID[1].map(f => (
            <TouchableOpacity key={f.screen} onPress={() => navigate(f.screen)} activeOpacity={0.8}
              style={{ flex: 1, backgroundColor: f.bg, borderRadius: RADIUS.xl, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.sm, alignItems: 'center', ...SHADOW.sm }}>
              <f.Icon size={26} color={f.color} strokeWidth={2} />
              <Text style={{ fontSize: 11, fontWeight: FONT.semibold, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' }}>{f.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Row: Admin & Safety */}
        <Text style={[TYPE.label, { marginTop: SPACING.sm, marginBottom: SPACING.xs, paddingHorizontal: SPACING.xs }]}>Admin & Safety</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl }}>
          {FEATURE_GRID[2].map(f => (
            <TouchableOpacity key={f.screen} onPress={() => navigate(f.screen)} activeOpacity={0.8}
              style={{ flex: 1, backgroundColor: f.bg, borderRadius: RADIUS.xl, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, ...SHADOW.sm }}>
              <f.Icon size={22} color={f.color} strokeWidth={2.5} />
              <Text style={{ fontSize: 13, fontWeight: FONT.bold, color: f.color }}>{f.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={{ padding: SPACING.lg, backgroundColor: COLORS.warningBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#FCD34D30' }}>
          <Text style={{ fontSize: 10, color: '#92400E', lineHeight: 15, textAlign: 'center' }}>
            HealthNestAI provides informational analysis only and is not a substitute for professional medical advice. Always seek immediate help in emergencies.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}