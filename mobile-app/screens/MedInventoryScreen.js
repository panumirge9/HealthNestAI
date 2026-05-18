import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { inventoryApi } from '../lib/api';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

// 💎 Clean Icons
import { Archive, Plus, X, AlertTriangle, Clock3, CheckCircle } from 'lucide-react-native';

export default function MedInventoryScreen() {
  const [data, setData] = useState({ medications: [], alerts: [] });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [form, setForm] = useState({
    name: '',
    dosage: '',
    quantity: '30',
    low_stock_threshold: '5',
    expiry_date: '',
    refill_reminder_days: '7',
    notes: '',
  });

  const fetch_ = () =>
    inventoryApi.list()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetch_(); }, []);

  const save = async () => {
    if (!form.name) {
      Alert.alert('Required', 'Medicine name is required');
      return;
    }
    try {
      await inventoryApi.create({
        ...form,
        quantity: Number(form.quantity),
        low_stock_threshold: Number(form.low_stock_threshold),
        refill_reminder_days: Number(form.refill_reminder_days),
      });
      setAdding(false);
      fetch_();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const restock = (id, name) => {
    Alert.prompt(
      'Restock',
      `Add quantity for ${name}`,
      async (qty) => {
        if (qty && !isNaN(qty)) {
          await inventoryApi.restock(id, qty);
          fetch_();
        }
      },
      'plain-text',
      '30',
      'numeric'
    );
  };

  const del = (id) => {
    Alert.alert('Delete', 'Remove from inventory?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await inventoryApi.delete(id);
          fetch_();
        }
      }
    ]);
  };

  const getStatus = (m) => {
    if (m.low_stock) return { label: 'Low Stock', color: COLORS.danger, icon: AlertTriangle };
    if (m.expiring_soon) return { label: 'Expiring', color: COLORS.orange, icon: Clock3 };
    return { label: 'Good', color: COLORS.success, icon: CheckCircle };
  };

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

        {/* ADD FORM */}
        {adding ? (
          <Card variant="elevated" style={{ marginBottom: SPACING.xl }}>
            <Text style={[TYPE.label, { marginBottom: SPACING.md }]}>Add Medicine</Text>

            <Input
              label="Medicine Name"
              value={form.name}
              onChangeText={v => setForm({ ...form, name: v })}
              placeholder="e.g. Paracetamol"
            />

            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Dosage"
                  value={form.dosage}
                  onChangeText={v => setForm({ ...form, dosage: v })}
                  placeholder="500mg"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Quantity"
                  value={form.quantity}
                  onChangeText={v => setForm({ ...form, quantity: v })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Input
              label="Expiry Date"
              value={form.expiry_date}
              onChangeText={v => setForm({ ...form, expiry_date: v })}
              placeholder="YYYY-MM-DD"
            />

            <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md }}>
              <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
              <Button label="Save" onPress={save} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <View style={{ gap: SPACING.md }}>

            {/* EMPTY STATE */}
            {data.medications?.length === 0 && (
              <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
                <Archive size={40} color={COLORS.textLight} style={{ marginBottom: SPACING.sm }} />
                <Text style={[TYPE.body, { color: COLORS.textMuted }]}>
                  No medicines added yet
                </Text>
              </View>
            )}

            {/* LIST */}
            {data.medications?.map(m => {
              const status = getStatus(m);
              const StatusIcon = status.icon;

              return (
                <Card key={m.id} variant="elevated" style={{ padding: 0 }}>
                  <View style={{ flexDirection: 'row', padding: SPACING.md }}>

                    {/* ICON */}
                    <View style={{
                      width: 46,
                      height: 46,
                      borderRadius: RADIUS.lg,
                      backgroundColor: COLORS.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Archive size={22} color={COLORS.primaryDark} />
                    </View>

                    {/* CONTENT */}
                    <View style={{ flex: 1, marginLeft: SPACING.md }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={[TYPE.bodyMedium]}>
                          {m.name}
                          <Text style={[TYPE.caption]}> {m.dosage}</Text>
                        </Text>

                        <TouchableOpacity onPress={() => del(m.id)}>
                          <X size={18} color={COLORS.textLight} />
                        </TouchableOpacity>
                      </View>

                      {/* STATUS */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
                        <StatusIcon size={12} color={status.color} />
                        <Text style={{ fontSize: 11, color: status.color, fontWeight: FONT.semibold }}>
                          {status.label}
                        </Text>
                      </View>

                      {/* INFO */}
                      <View style={{ marginTop: 6 }}>
                        <Text style={[TYPE.caption]}>
                          Stock: <Text style={{ fontWeight: FONT.bold }}>{m.quantity}</Text>
                        </Text>

                        {m.expiry_date && (
                          <Text style={[TYPE.micro, { color: COLORS.textMuted }]}>
                            Expiry: {m.expiry_date}
                          </Text>
                        )}
                      </View>

                      {/* ACTION */}
                      <TouchableOpacity
                        onPress={() => restock(m.id, m.name)}
                        style={{
                          marginTop: SPACING.sm,
                          alignSelf: 'flex-start',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: RADIUS.full,
                          backgroundColor: COLORS.primaryLight
                        }}
                      >
                        <Text style={{
                          fontSize: 11,
                          fontWeight: FONT.bold,
                          color: COLORS.primaryDark
                        }}>
                          Restock
                        </Text>
                      </TouchableOpacity>
                    </View>

                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {!adding && (
        <TouchableOpacity
          onPress={() => setAdding(true)}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            bottom: 90,
            right: SPACING.xl,
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...SHADOW.lg
          }}
        >
          <Plus size={26} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}