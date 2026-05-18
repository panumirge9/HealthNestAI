import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { medicinesApi } from '../lib/api';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const DAYS = ['S','M','T','W','T','F','S'];
const DAY_COLORS = ['#EF4444','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899','#6366F1'];

export default function MedicineReminderScreen() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', dosage: '', times: ['08:00'], days_of_week: [0,1,2,3,4,5,6], start_date: new Date().toISOString().split('T')[0], notes: '' });

  const fetch_ = () => medicinesApi.list().then(r => setReminders(r.data.reminders || [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { fetch_(); }, []);

  const toggleDay = d => setForm(f => ({ ...f, days_of_week: f.days_of_week.includes(d) ? f.days_of_week.filter(x => x !== d) : [...f.days_of_week, d] }));

  const save = async () => {
    if (!form.name) { Alert.alert('Required', 'Medicine name is required'); return; }
    try {
      await medicinesApi.create(form);
      setAdding(false); fetch_();
      setForm({ name: '', dosage: '', times: ['08:00'], days_of_week: [0,1,2,3,4,5,6], start_date: new Date().toISOString().split('T')[0], notes: '' });
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const del = id => Alert.alert('Remove', 'Delete this reminder?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => medicinesApi.delete(id).then(fetch_) },
  ]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: 56, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: SPACING['2xl'], marginBottom: SPACING['2xl'] }}>
          <Text style={TYPE.h1}>Medicines</Text>
          <Text style={[TYPE.caption, { marginTop: 2 }]}>Track your medications and doses</Text>
        </View>

        {/* Add form */}
        {adding && (
          <View style={{ paddingHorizontal: SPACING.xl }}>
            <Card variant="elevated">
              <Text style={[TYPE.h3, { marginBottom: SPACING.lg }]}>New reminder</Text>
              <Input label="Medicine name" value={form.name} onChangeText={v => setForm({...form, name: v})} placeholder="e.g. Metformin" />
              <Input label="Dosage" value={form.dosage} onChangeText={v => setForm({...form, dosage: v})} placeholder="e.g. 500mg" />

              <Text style={[TYPE.label, { marginBottom: SPACING.sm }]}>Days</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: SPACING.xl }}>
                {DAYS.map((d, i) => (
                  <TouchableOpacity key={i} onPress={() => toggleDay(i)}
                    activeOpacity={0.7}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center',
                      backgroundColor: form.days_of_week.includes(i) ? COLORS.primary : COLORS.bg,
                      borderWidth: 1.5,
                      borderColor: form.days_of_week.includes(i) ? COLORS.primary : COLORS.border,
                    }}>
                    <Text style={{ fontSize: 12, fontWeight: FONT.bold, color: form.days_of_week.includes(i) ? '#fff' : COLORS.textMuted }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label="Notes" value={form.notes} onChangeText={v => setForm({...form, notes: v})} placeholder="Take with food…" />

              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
                <Button label="Save" onPress={save} style={{ flex: 1 }} />
              </View>
            </Card>
          </View>
        )}

        {/* Empty state */}
        {reminders.length === 0 && !adding && (
          <View style={{ paddingHorizontal: SPACING.xl }}>
            <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: SPACING['4xl'] }}>
              <View style={{
                width: 72, height: 72, borderRadius: RADIUS.xl,
                backgroundColor: COLORS.purpleBg,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: SPACING.xl,
              }}>
                <Text style={{ fontSize: 36 }}>💊</Text>
              </View>
              <Text style={[TYPE.h3, { marginBottom: SPACING.xs }]}>No reminders yet</Text>
              <Text style={[TYPE.caption, { textAlign: 'center', maxWidth: 240, marginBottom: SPACING.xl }]}>
                Add your medications and never miss a dose again.
              </Text>
              <Button label="Add your first reminder" onPress={() => setAdding(true)} />
            </Card>
          </View>
        )}

        {/* Reminder cards */}
        {reminders.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.xl }}>
            {reminders.map((r, idx) => {
              const accent = DAY_COLORS[idx % DAY_COLORS.length];
              return (
                <Card key={r.id} variant="elevated" style={{ flexDirection: 'row', overflow: 'hidden', padding: 0 }}>
                  <View style={{ width: 4, backgroundColor: accent }} />
                  <View style={{ flex: 1, padding: SPACING.lg }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[TYPE.bodyMedium, { fontSize: 16 }]}>{r.name}</Text>
                        {r.dosage ? <Text style={[TYPE.caption, { marginTop: 2 }]}>{r.dosage}</Text> : null}
                      </View>
                      <TouchableOpacity onPress={() => del(r.id)} hitSlop={12}
                        style={{ padding: SPACING.xs }}>
                        <Text style={{ color: COLORS.textMuted, fontSize: 20 }}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: SPACING.md }}>
                      {r.times.map(t => (
                        <View key={t} style={{ backgroundColor: accent + '15', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm }}>
                          <Text style={{ fontSize: 12, fontWeight: FONT.semibold, color: accent, fontFamily: 'monospace' }}>{t}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[TYPE.micro, { marginTop: SPACING.sm }]}>
                      {r.days_of_week.map(d => DAYS[d]).join(' · ')}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {!adding && reminders.length > 0 && (
        <TouchableOpacity
          onPress={() => setAdding(true)}
          activeOpacity={0.85}
          style={{
            position: 'absolute', bottom: 90, right: SPACING.xl,
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: COLORS.primary,
            alignItems: 'center', justifyContent: 'center',
            ...SHADOW.lg,
          }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 }}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
