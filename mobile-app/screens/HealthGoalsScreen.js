import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { goalsApi } from '../lib/api';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

// 💎 Clean Premium Icons (Lucide)
import { Scale, Footprints, Moon, Droplets, Target, X, Plus, TrendingUp } from 'lucide-react-native';

const GOAL_ICONS = {
  weight: Scale,
  steps: Footprints,
  sleep: Moon,
  hydration: Droplets,
  custom: Target,
};

const GOAL_COLORS = {
  weight: '#F59E0B',
  steps: '#10B981',
  sleep: '#8B5CF6',
  hydration: '#3B82F6',
  custom: '#EC4899',
};

export default function HealthGoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [logging, setLogging] = useState(null);
  const [logValue, setLogValue] = useState('');

  const [form, setForm] = useState({
    category: 'steps',
    title: '',
    target_value: '',
    current_value: '',
    unit: '',
    start_date: new Date().toISOString().split('T')[0],
  });

  const PRESETS = [
    { category: 'steps', title: 'Daily Steps', target_value: '10000', current_value: '0', unit: 'steps' },
    { category: 'sleep', title: 'Sleep Hours', target_value: '8', current_value: '0', unit: 'hrs' },
    { category: 'hydration', title: 'Water Intake', target_value: '8', current_value: '0', unit: 'glasses' },
  ];

  const fetch_ = () =>
    goalsApi.list()
      .then(r => setGoals(r.data.goals || []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetch_(); }, []);

  const save = async () => {
    if (!form.title || !form.target_value) {
      Alert.alert('Required', 'Title and target are required');
      return;
    }

    try {
      await goalsApi.create({
        ...form,
        target_value: Number(form.target_value),
        current_value: Number(form.current_value),
      });
      setAdding(false);
      fetch_();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const logProgress = async (id) => {
    if (!logValue) return;

    try {
      await goalsApi.log(id, {
        value: Number(logValue),
        logged_date: new Date().toISOString().split('T')[0],
      });
      setLogging(null);
      setLogValue('');
      fetch_();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const del = (id) => {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await goalsApi.delete(id);
          fetch_();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}>

        {/* ================= ADD FORM ================= */}
        {adding && (
          <Card variant="elevated" style={{ marginBottom: SPACING.xl }}>

            {/* Presets */}
            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={[TYPE.micro, { color: COLORS.textMuted, marginBottom: 6 }]}>
                QUICK START
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {PRESETS.map(p => {
                  const Icon = GOAL_ICONS[p.category];
                  return (
                    <TouchableOpacity
                      key={p.title}
                      onPress={() => setForm({ ...form, ...p })}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: RADIUS.full,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.card,
                      }}>
                      <Icon size={14} color={COLORS.textSecondary} />
                      <Text style={{ fontSize: 12, fontWeight: FONT.bold }}>
                        {p.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Category selector */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md }}>
              {Object.keys(GOAL_ICONS).map(k => {
                const color = GOAL_COLORS[k];
                return (
                  <TouchableOpacity
                    key={k}
                    onPress={() => setForm({ ...form, category: k })}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: RADIUS.md,
                      borderWidth: 1,
                      borderColor: form.category === k ? color : COLORS.border,
                      backgroundColor: form.category === k ? color + '20' : COLORS.card,
                    }}>
                    <Text style={{
                      color: form.category === k ? color : COLORS.textSecondary,
                      fontSize: 12,
                      fontWeight: FONT.bold,
                      textTransform: 'capitalize'
                    }}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input label="Goal Title" value={form.title} onChangeText={v => setForm({ ...form, title: v })} />

            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <View style={{ flex: 1 }}>
                <Input label="Target" value={form.target_value} keyboardType="numeric"
                  onChangeText={v => setForm({ ...form, target_value: v })} />
              </View>

              <View style={{ flex: 1 }}>
                <Input label="Start" value={form.current_value} keyboardType="numeric"
                  onChangeText={v => setForm({ ...form, current_value: v })} />
              </View>

              <View style={{ flex: 1 }}>
                <Input label="Unit" value={form.unit}
                  onChangeText={v => setForm({ ...form, unit: v })} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
              <Button label="Create Goal" onPress={save} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        {/* ================= EMPTY STATE ================= */}
        {!adding && goals.length === 0 && (
          <View style={{ alignItems: 'center', padding: SPACING.xl }}>
            <TrendingUp size={48} color={COLORS.textLight} />
            <Text style={[TYPE.body, { marginTop: 10, color: COLORS.textMuted }]}>
              No goals yet
            </Text>
          </View>
        )}

        {/* ================= GOALS ================= */}
        <View style={{ gap: SPACING.md }}>
          {goals.map(g => {
            const color = GOAL_COLORS[g.category] || GOAL_COLORS.custom;
            const Icon = GOAL_ICONS[g.category] || GOAL_ICONS.custom;

            return (
              <Card key={g.id} variant="elevated">

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: RADIUS.lg,
                      backgroundColor: color + '15',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={22} color={color} />
                    </View>

                    <View>
                      <Text style={TYPE.bodyMedium}>{g.title}</Text>
                      <Text style={[TYPE.micro, { color }]}>
                        {g.current_value} / {g.target_value} {g.unit}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => del(g.id)}>
                    <X size={18} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>

                {/* Progress */}
                <View style={{ marginTop: 12 }}>
                  <View style={{ height: 6, backgroundColor: COLORS.border, borderRadius: 6 }}>
                    <View style={{
                      width: `${Math.min(100, g.progress_pct)}%`,
                      height: 6,
                      backgroundColor: color,
                      borderRadius: 6,
                    }} />
                  </View>

                  <Text style={{ fontSize: 11, marginTop: 4, color }}>
                    {g.progress_pct}% completed
                  </Text>
                </View>

                {/* Logging */}
                {logging === g.id ? (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                    <Input value={logValue} onChangeText={setLogValue} placeholder="Value" keyboardType="numeric" style={{ flex: 1 }} />
                    <Button label="Save" onPress={() => logProgress(g.id)} />
                  </View>
                ) : (
                  <Button
                    label="Log Progress"
                    variant="ghost"
                    onPress={() => {
                      setLogging(g.id);
                      setLogValue('');
                    }}
                    style={{ marginTop: 10 }}
                  />
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* FAB */}
      {!adding && (
        <TouchableOpacity
          onPress={() => setAdding(true)}
          style={{
            position: 'absolute',
            bottom: 80,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...SHADOW.lg
          }}>
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}