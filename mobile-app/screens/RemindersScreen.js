import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { remindersApi } from '../lib/api';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

// 💎 Premium Icons (Lucide)
import { Pill, Building2, Stethoscope, ClipboardList, CheckCircle2, Trash2, Plus } from 'lucide-react-native';

const TYPE_CONFIG = {
  medicine: { icon: Pill, color: COLORS.purple, label: 'Medicine' },
  appointment: { icon: Building2, color: COLORS.blue, label: 'Appointment' },
  checkup: { icon: Stethoscope, color: COLORS.primary, label: 'Check-up' },
  custom: { icon: ClipboardList, color: COLORS.orange, label: 'Custom' },
};

export default function RemindersScreen() {
  const [data, setData] = useState({ pending: [], overdue: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [form, setForm] = useState({
    title: '',
    type: 'medicine',
    due_datetime: '',
    notes: '',
    repeat: 'none',
  });

  const fetch_ = () =>
    remindersApi.list()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetch_(); }, []);

  const save = async () => {
    if (!form.title || !form.due_datetime) {
      Alert.alert('Required', 'Title and Due Date required');
      return;
    }
    try {
      await remindersApi.create(form);
      setAdding(false);
      fetch_();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const complete = async (id) => {
    try {
      await remindersApi.complete(id);
      fetch_();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const del = (id) => {
    Alert.alert('Delete Reminder', 'Are you sure you want to remove this?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await remindersApi.delete(id);
        fetch_();
      }}
    ]);
  };

  const activeList = data[activeTab] || [];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}>

        {/* Tabs */}
        {!adding && (
          <View style={{
            flexDirection: 'row',
            backgroundColor: COLORS.border,
            borderRadius: RADIUS.lg,
            padding: 4,
            marginBottom: SPACING.xl,
          }}>
            {['pending', 'overdue', 'completed'].map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: RADIUS.md,
                  backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                  alignItems: 'center',
                  ...SHADOW.sm,
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: activeTab === tab ? FONT.bold : FONT.medium,
                  color: activeTab === tab ? COLORS.text : COLORS.textSecondary,
                  textTransform: 'capitalize'
                }}>
                  {tab} ({data[tab]?.length || 0})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Add Form */}
        {adding && (
          <Card variant="elevated" style={{ marginBottom: SPACING.xl }}>
            
            {/* Type Selector */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md }}>
              {Object.keys(TYPE_CONFIG).map(key => {
                const cfg = TYPE_CONFIG[key];
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setForm({ ...form, type: key })}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: RADIUS.md,
                      backgroundColor: form.type === key ? cfg.color + '20' : COLORS.bg,
                      borderWidth: 1,
                      borderColor: form.type === key ? cfg.color : COLORS.border,
                    }}
                  >
                    <Text style={{
                      color: form.type === key ? cfg.color : COLORS.textSecondary,
                      fontSize: 12,
                      fontWeight: FONT.bold
                    }}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input label="Title" value={form.title} onChangeText={v => setForm({ ...form, title: v })} />
            <Input label="Due Date & Time" value={form.due_datetime} onChangeText={v => setForm({ ...form, due_datetime: v })} />
            <Input label="Notes" value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} />

            {/* Repeat */}
            <Text style={[TYPE.label, { marginBottom: SPACING.xs }]}>Repeat</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.lg }}>
              {['none', 'daily', 'weekly', 'monthly'].map(r => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setForm({ ...form, repeat: r })}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: RADIUS.full,
                    backgroundColor: form.repeat === r ? COLORS.text : COLORS.border
                  }}
                >
                  <Text style={{
                    color: form.repeat === r ? '#fff' : COLORS.textSecondary,
                    fontSize: 12,
                    fontWeight: FONT.semibold,
                    textTransform: 'capitalize'
                  }}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
              <Button label="Save Reminder" onPress={save} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        {/* List */}
        <View style={{ gap: SPACING.md }}>
          {activeList.length === 0 && !adding ? (
            <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
              <Text style={[TYPE.body, { color: COLORS.textMuted }]}>
                No {activeTab} reminders
              </Text>
            </View>
          ) : (
            activeList.map(item => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.custom;
              const Icon = cfg.icon;

              return (
                <Card key={item.id} variant="elevated">
                  <View style={{ flexDirection: 'row' }}>

                    {/* Icon */}
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: RADIUS.xl,
                      backgroundColor: cfg.color + '15',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={22} color={cfg.color} />
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1, marginLeft: SPACING.md }}>
                      <Text style={[TYPE.bodyMedium]}>{item.title}</Text>
                      <Text style={[TYPE.micro, { color: cfg.color, marginTop: 2 }]}>
                        {cfg.label} · {item.due_datetime?.replace('T', ' ')}
                      </Text>

                      {item.notes && (
                        <Text style={[TYPE.caption, { marginTop: 4 }]}>
                          {item.notes}
                        </Text>
                      )}
                    </View>

                    {/* Actions */}
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      {item.status !== 'completed' && (
                        <TouchableOpacity onPress={() => complete(item.id)}>
                          <CheckCircle2 size={22} color={COLORS.success} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => del(item.id)}>
                        <Trash2 size={20} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>

                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      {!adding && (
        <TouchableOpacity
          onPress={() => setAdding(true)}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            bottom: 90,
            right: SPACING.xl,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...SHADOW.lg
          }}
        >
          <Plus size={28} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}