import { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { reportApi } from '../lib/api';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const RISK = {
  low: { color: '#10B981', bg: '#ECFDF5', label: 'Low Risk', emoji: '✅' },
  moderate: { color: '#F59E0B', bg: '#FFFBEB', label: 'Moderate', emoji: '⚠️' },
  high: { color: '#F97316', bg: '#FFF7ED', label: 'High Risk', emoji: '🔶' },
  critical: { color: '#EF4444', bg: '#FEF2F2', label: 'Critical', emoji: '🔴' },
};
const STATUS_C = { excellent: '#10B981', good: '#84CC16', fair: '#F59E0B', poor: '#EF4444' };
const STATUS_E = { excellent: '✅', good: '👍', fair: '⚠️', poor: '❌' };

export default function HealthReportScreen() {
  const [form, setForm] = useState({
    age: '', gender: 'not_specified', weight_kg: '', height_cm: '',
    systolic_bp: '', diastolic_bp: '80', sugar_mgdl: '',
    sleep_hours: '', water_glasses: '', exercise_days_per_week: '0', smoking: false,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.age || !form.weight_kg || !form.height_cm || !form.systolic_bp) {
      Alert.alert('Missing fields', 'Age, weight, height, and systolic BP are required.'); return;
    }
    setLoading(true);
    try {
      const payload = {};
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'smoking') payload[k] = v;
        else if (k === 'gender') payload[k] = v;
        else if (v !== '') payload[k] = Number(v);
        else if (['sugar_mgdl','sleep_hours','water_glasses'].includes(k)) payload[k] = null;
      });
      const { data } = await reportApi.generate(payload);
      setResult(data);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  if (result) {
    const risk = RISK[result.risk_level] || RISK.moderate;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

        {/* Score hero */}
        <View style={{
          marginHorizontal: SPACING.xl, borderRadius: RADIUS['2xl'],
          backgroundColor: risk.bg, padding: SPACING['3xl'],
          alignItems: 'center', marginBottom: SPACING.xl,
          borderWidth: 1, borderColor: risk.color + '30',
          ...SHADOW.md,
        }}>
          <Text style={{ fontSize: 64, fontWeight: FONT.heavy, color: risk.color, letterSpacing: -3 }}>
            {result.score}
          </Text>
          <Text style={[TYPE.label, { color: risk.color, marginTop: SPACING.xs }]}>
            {risk.emoji} Health Score · {risk.label}
          </Text>
          <Text style={[TYPE.caption, { marginTop: SPACING.lg, textAlign: 'center', lineHeight: 20 }]}>
            {result.summary}
          </Text>
        </View>

        {/* BMI quick stat */}
        <View style={{ flexDirection: 'row', gap: SPACING.md, marginHorizontal: SPACING.xl, marginBottom: SPACING.xl }}>
          {[
            { label: 'BMI', value: result.bmi, emoji: '⚖️' },
            { label: 'Score', value: `${result.score}/100`, emoji: '🎯' },
            { label: 'Risk', value: result.risk_level, emoji: risk.emoji },
          ].map(s => (
            <View key={s.label} style={{
              flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
              padding: SPACING.md, alignItems: 'center',
              borderWidth: 1, borderColor: COLORS.border,
            }}>
              <Text style={{ fontSize: 16, marginBottom: 4 }}>{s.emoji}</Text>
              <Text style={{ fontSize: 18, fontWeight: FONT.bold, color: COLORS.text }}>{s.value}</Text>
              <Text style={[TYPE.micro]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={{ paddingHorizontal: SPACING.xl }}>
          <Card variant="elevated">
            <Text style={[TYPE.h3, { marginBottom: SPACING.md }]}>Detailed Insights</Text>
            {result.insights?.map((ins, i) => (
              <View key={i} style={{
                flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
                paddingVertical: SPACING.md,
                borderBottomWidth: i < result.insights.length - 1 ? 1 : 0,
                borderColor: COLORS.divider,
              }}>
                <Text style={{ fontSize: 18 }}>{STATUS_E[ins.status]}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={[TYPE.bodyMedium, { textTransform: 'capitalize' }]}>{ins.category.replace('_', ' ')}</Text>
                    <Text style={{ fontSize: 12, fontWeight: FONT.bold, color: STATUS_C[ins.status] }}>{ins.score}</Text>
                  </View>
                  {/* Progress bar */}
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: COLORS.border }}>
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: STATUS_C[ins.status], width: `${ins.score}%` }} />
                  </View>
                  <Text style={[TYPE.micro, { marginTop: 4 }]}>{ins.message}</Text>
                </View>
              </View>
            ))}
          </Card>

          {result.recommendations?.length > 0 && (
            <Card variant="elevated">
              <Text style={[TYPE.h3, { marginBottom: SPACING.md }]}>Recommendations</Text>
              {result.recommendations.map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md }}>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: COLORS.primaryLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: FONT.bold, color: COLORS.primaryDark }}>{i + 1}</Text>
                  </View>
                  <Text style={[TYPE.body, { flex: 1 }]}>{r}</Text>
                </View>
              ))}
            </Card>
          )}

          <Button label="New Report" variant="ghost" fullWidth onPress={() => setResult(null)} />
        </View>
      </ScrollView>
    );
  }

  // Form view — grouped sections
  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}>

      <View style={{ paddingHorizontal: SPACING['2xl'], marginBottom: SPACING.xl }}>
        <Text style={TYPE.h1}>Health Report</Text>
        <Text style={[TYPE.caption, { marginTop: 2 }]}>Enter vitals for your 0–100 health score</Text>
      </View>

      <View style={{ paddingHorizontal: SPACING.xl }}>
        {/* Section 1: Body */}
        <Card variant="elevated">
          <Text style={[TYPE.label, { marginBottom: SPACING.lg, color: COLORS.primary }]}>📐 Body Measurements</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}><Input label="Age *" value={form.age} onChangeText={v => set('age', v)} keyboardType="numeric" placeholder="28" /></View>
            <View style={{ flex: 1 }}><Input label="Weight (kg) *" value={form.weight_kg} onChangeText={v => set('weight_kg', v)} keyboardType="decimal-pad" placeholder="70" /></View>
          </View>
          <Input label="Height (cm) *" value={form.height_cm} onChangeText={v => set('height_cm', v)} keyboardType="numeric" placeholder="170" />
        </Card>

        {/* Section 2: Vitals */}
        <Card variant="elevated">
          <Text style={[TYPE.label, { marginBottom: SPACING.lg, color: COLORS.danger }]}>❤️ Vitals</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}><Input label="Systolic BP *" value={form.systolic_bp} onChangeText={v => set('systolic_bp', v)} keyboardType="numeric" placeholder="120" /></View>
            <View style={{ flex: 1 }}><Input label="Diastolic BP" value={form.diastolic_bp} onChangeText={v => set('diastolic_bp', v)} keyboardType="numeric" placeholder="80" /></View>
          </View>
          <Input label="Blood sugar (mg/dL)" value={form.sugar_mgdl} onChangeText={v => set('sugar_mgdl', v)} keyboardType="decimal-pad" placeholder="Optional" />
        </Card>

        {/* Section 3: Lifestyle */}
        <Card variant="elevated">
          <Text style={[TYPE.label, { marginBottom: SPACING.lg, color: COLORS.blue }]}>🏃 Lifestyle</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}><Input label="Sleep hrs/night" value={form.sleep_hours} onChangeText={v => set('sleep_hours', v)} keyboardType="decimal-pad" placeholder="7.5" /></View>
            <View style={{ flex: 1 }}><Input label="Water glasses" value={form.water_glasses} onChangeText={v => set('water_glasses', v)} keyboardType="numeric" placeholder="8" /></View>
          </View>
          <Input label="Exercise days/week" value={form.exercise_days_per_week} onChangeText={v => set('exercise_days_per_week', v)} keyboardType="numeric" placeholder="3" />

          <Text style={[TYPE.label, { marginBottom: SPACING.sm }]}>Smoking</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            {[{ v: false, l: '🚭 No', bg: COLORS.successBg }, { v: true, l: '🚬 Yes', bg: COLORS.dangerBg }].map(o => (
              <TouchableOpacity key={o.l} onPress={() => set('smoking', o.v)} activeOpacity={0.7}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: RADIUS.lg, alignItems: 'center',
                  backgroundColor: form.smoking === o.v ? (o.v ? COLORS.danger : COLORS.primary) : COLORS.bg,
                  borderWidth: 1.5,
                  borderColor: form.smoking === o.v ? (o.v ? COLORS.danger : COLORS.primary) : COLORS.border,
                }}>
                <Text style={{
                  fontSize: 14, fontWeight: FONT.semibold,
                  color: form.smoking === o.v ? '#fff' : COLORS.textSecondary,
                }}>{o.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Button label="Generate Health Report →" onPress={submit} loading={loading} fullWidth size="lg" />
      </View>
    </ScrollView>
  );
}
