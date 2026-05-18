import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { medicalApi } from '../lib/api';
import { COLORS, SPACING, RADIUS, FONT, TYPE } from '../lib/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

import {
  HeartPulse,
  Scissors,
  Syringe,
  AlertTriangle,
  Building2,
  User,
  CheckCircle2,
  Check,
  X
} from 'lucide-react-native';

/* =========================
   Categories (Clean Icons)
========================= */
const CATEGORIES = [
  { key: 'condition', label: 'Condition', icon: HeartPulse, color: COLORS.danger },
  { key: 'surgery', label: 'Surgery', icon: Scissors, color: '#7C3AED' },
  { key: 'vaccination', label: 'Vaccine', icon: Syringe, color: COLORS.primary },
  { key: 'allergy', label: 'Allergy', icon: AlertTriangle, color: COLORS.orange },
  { key: 'hospitalization', label: 'Hospital', icon: Building2, color: COLORS.blue },
];

export default function MedicalHistoryScreen() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('all');

  const [form, setForm] = useState({
    category: 'condition',
    title: '',
    description: '',
    date_occurred: new Date().toISOString().split('T')[0],
    doctor: '',
    hospital: '',
    severity: 'moderate',
    resolved: false
  });

  const fetch_ = () =>
    medicalApi.list()
      .then(r => setRecords(r.data.records || []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetch_(); }, []);

  const save = async () => {
    if (!form.title) {
      Alert.alert('Required', 'Title is required');
      return;
    }
    try {
      await medicalApi.create(form);
      setAdding(false);
      fetch_();
      setForm({
        category: 'condition',
        title: '',
        description: '',
        date_occurred: new Date().toISOString().split('T')[0],
        doctor: '',
        hospital: '',
        severity: 'moderate',
        resolved: false
      });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const del = (id) => {
    Alert.alert('Delete', 'Remove this record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await medicalApi.delete(id); fetch_(); } }
    ]);
  };

  const filtered = records.filter(r => filter === 'all' ? true : r.category === filter);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}
    >

      {/* =========================
         FILTERS
      ========================= */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: RADIUS.full,
            backgroundColor: filter === 'all' ? COLORS.text : COLORS.border,
            marginRight: SPACING.sm
          }}
        >
          <Text style={{ color: filter === 'all' ? '#fff' : COLORS.textSecondary, fontWeight: FONT.bold, fontSize: 13 }}>
            All
          </Text>
        </TouchableOpacity>

        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.key}
            onPress={() => setFilter(c.key)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: RADIUS.full,
              backgroundColor: filter === c.key ? c.color : COLORS.card,
              borderWidth: 1,
              borderColor: filter === c.key ? c.color : COLORS.border,
              marginRight: SPACING.sm
            }}
          >
            <Text style={{ color: filter === c.key ? '#fff' : c.color, fontWeight: FONT.bold, fontSize: 13 }}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* =========================
         FORM
      ========================= */}
      {adding && (
        <Card variant="elevated" style={{ marginBottom: SPACING.xl }}>

          {/* Category Selector */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md }}>
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setForm({ ...form, category: c.key })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: RADIUS.md,
                    backgroundColor: form.category === c.key ? c.color + '15' : COLORS.bg,
                    borderWidth: 1,
                    borderColor: form.category === c.key ? c.color : COLORS.border
                  }}
                >
                  <Icon size={14} color={form.category === c.key ? c.color : COLORS.textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: FONT.bold, color: form.category === c.key ? c.color : COLORS.textSecondary }}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input label="Title / Diagnosis" value={form.title} onChangeText={v => setForm({ ...form, title: v })} />
          <Input label="Date" value={form.date_occurred} onChangeText={v => setForm({ ...form, date_occurred: v })} />
          <Input label="Doctor" value={form.doctor} onChangeText={v => setForm({ ...form, doctor: v })} />
          <Input label="Hospital" value={form.hospital} onChangeText={v => setForm({ ...form, hospital: v })} />
          <Input label="Notes" value={form.description} onChangeText={v => setForm({ ...form, description: v })} multiline />

          {/* Checkbox */}
          <TouchableOpacity
            onPress={() => setForm(f => ({ ...f, resolved: !f.resolved }))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.lg }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: form.resolved ? COLORS.success : COLORS.borderMuted,
                backgroundColor: form.resolved ? COLORS.success : 'transparent',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {form.resolved && <Check size={14} color="#fff" />}
            </View>

            <Text style={[TYPE.bodyMedium]}>
              Mark as resolved / cured
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
            <Button label="Save" onPress={save} style={{ flex: 1 }} />
          </View>
        </Card>
      )}

      {/* =========================
         LIST
      ========================= */}
      <View style={{ gap: SPACING.md }}>
        {filtered.length === 0 && !adding ? (
          <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
            <Text style={[TYPE.body, { color: COLORS.textMuted }]}>
              No medical records found
            </Text>
          </View>
        ) : (
          <>
            {filtered.map(r => {
              const cat = CATEGORIES.find(c => c.key === r.category) || CATEGORIES[0];
              const Icon = cat.icon;

              return (
                <View key={r.id} style={{ flexDirection: 'row' }}>

                  {/* Icon */}
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: RADIUS.xl,
                    backgroundColor: cat.color + '15',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={22} color={cat.color} />
                  </View>

                  {/* Card */}
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <Card variant="elevated">
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>

                        <View style={{ flex: 1 }}>
                          <Text style={[TYPE.bodyMedium]}>{r.title}</Text>

                          <Text style={[TYPE.micro, { color: cat.color, marginTop: 2 }]}>
                            {cat.label} · {r.date_occurred}
                          </Text>

                          {r.description && (
                            <Text style={[TYPE.caption, { marginTop: 4 }]}>
                              {r.description}
                            </Text>
                          )}

                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>

                            {r.doctor && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <User size={12} color={COLORS.textSecondary} />
                                <Text style={[TYPE.micro, { color: COLORS.textSecondary }]}>
                                  {r.doctor}
                                </Text>
                              </View>
                            )}

                            {r.resolved && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <CheckCircle2 size={12} color={COLORS.success} />
                                <Text style={[TYPE.micro, { color: COLORS.success }]}>
                                  Resolved
                                </Text>
                              </View>
                            )}

                          </View>
                        </View>

                        <TouchableOpacity onPress={() => del(r.id)}>
                          <X size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>

                      </View>
                    </Card>
                  </View>

                </View>
              );
            })}

            {!adding && (
              <Button
                label="+ Add Record"
                variant="ghost"
                onPress={() => setAdding(true)}
                fullWidth
              />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}