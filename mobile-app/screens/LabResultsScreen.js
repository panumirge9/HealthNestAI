import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { labApi } from '../lib/api';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

// 💎 Premium Icons
import {
  CheckCircle2,
  ArrowDown,
  ArrowUp,
  BrainCircuit,
  Trash2,
  ChevronDown,
  ChevronUp,
  PlusCircle
} from 'lucide-react-native';

const STATUS_COLOR = {
  normal: COLORS.success,
  low: COLORS.blue,
  high: COLORS.danger
};

const STATUS_BG = {
  normal: COLORS.successBg,
  low: COLORS.blueBg,
  high: COLORS.dangerBg
};

export default function LabResultsScreen() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const [form, setForm] = useState({
    test_name: '',
    test_date: new Date().toISOString().split('T')[0],
    lab_name: '',
    items: [{ name: '', value: '', unit: '', normal_min: '', normal_max: '' }]
  });

  const fetch_ = () =>
    labApi.list()
      .then(r => setResults(r.data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetch_(); }, []);

  const addItem = () =>
    setForm(f => ({
      ...f,
      items: [...f.items, { name: '', value: '', unit: '', normal_min: '', normal_max: '' }]
    }));

  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i][field] = value;
    setForm({ ...form, items });
  };

  const save = async () => {
    if (!form.test_name) {
      Alert.alert('Required', 'Test name is required');
      return;
    }

    try {
      const payload = {
        ...form,
        results: form.items.map(i => ({
          ...i,
          value: parseFloat(i.value) || 0,
          normal_min: i.normal_min ? parseFloat(i.normal_min) : null,
          normal_max: i.normal_max ? parseFloat(i.normal_max) : null
        }))
      };

      await labApi.create(payload);
      setAdding(false);
      fetch_();

      setForm({
        test_name: '',
        test_date: new Date().toISOString().split('T')[0],
        lab_name: '',
        items: [{ name: '', value: '', unit: '', normal_min: '', normal_max: '' }]
      });

    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const del = (id) => {
    Alert.alert('Delete Report', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await labApi.delete(id);
        fetch_();
      }}
    ]);
  };

  const getStatusIcon = (status) => {
    if (status === 'normal') return <CheckCircle2 size={16} color={STATUS_COLOR.normal} />;
    if (status === 'low') return <ArrowDown size={16} color={STATUS_COLOR.low} />;
    if (status === 'high') return <ArrowUp size={16} color={STATUS_COLOR.high} />;
    return null;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}>
      
      {adding ? (
        <Card variant="elevated" style={{ marginBottom: SPACING.xl }}>
          
          <Input label="Test Name" value={form.test_name} onChangeText={v => setForm({...form, test_name: v})} />

          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <Input label="Date" value={form.test_date} onChangeText={v => setForm({...form, test_date: v})} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Lab Name" value={form.lab_name} onChangeText={v => setForm({...form, lab_name: v})} />
            </View>
          </View>

          <Text style={[TYPE.label, { marginTop: SPACING.md }]}>Test Items</Text>

          {form.items.map((item, idx) => (
            <View key={idx} style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: RADIUS.md,
              padding: SPACING.sm,
              marginTop: SPACING.sm
            }}>
              <Input label="Item Name" value={item.name} onChangeText={v => updateItem(idx, 'name', v)} />

              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <View style={{ flex: 1 }}>
                  <Input label="Value" value={item.value} onChangeText={v => updateItem(idx, 'value', v)} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Unit" value={item.unit} onChangeText={v => updateItem(idx, 'unit', v)} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <View style={{ flex: 1 }}>
                  <Input label="Min" value={item.normal_min} onChangeText={v => updateItem(idx, 'normal_min', v)} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Max" value={item.normal_max} onChangeText={v => updateItem(idx, 'normal_max', v)} keyboardType="numeric" />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity onPress={addItem} style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md }}>
            <PlusCircle size={18} color={COLORS.primary} />
            <Text style={{ marginLeft: 6, color: COLORS.primary, fontWeight: FONT.bold }}>
              Add Item
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg }}>
            <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
            <Button label="Save & Analyze" onPress={save} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <>
          {results.length === 0 && (
            <View style={{ alignItems: 'center', padding: SPACING.xl }}>
              <Text style={[TYPE.body, { color: COLORS.textMuted }]}>
                No lab results found
              </Text>
            </View>
          )}

          {results.map(r => {
            const isOpen = expanded === r.id;

            return (
              <Card key={r.id} variant="elevated" style={{ padding: 0, overflow: 'hidden' }}>
                
                {/* Header */}
                <TouchableOpacity
                  onPress={() => setExpanded(isOpen ? null : r.id)}
                  style={{
                    padding: SPACING.md,
                    backgroundColor: STATUS_BG[r.overall_status] || COLORS.bg,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <View>
                    <Text style={[TYPE.bodyMedium, { color: STATUS_COLOR[r.overall_status] || COLORS.text }]}>
                      {r.test_name}
                    </Text>
                    <Text style={[TYPE.micro, { color: COLORS.textSecondary }]}>
                      {r.test_date} {r.lab_name ? `· ${r.lab_name}` : ''}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    
                    <Text style={{
                      fontSize: 10,
                      fontWeight: FONT.bold,
                      color: STATUS_COLOR[r.overall_status],
                      textTransform: 'uppercase'
                    }}>
                      {r.overall_status}
                    </Text>

                    {isOpen ? (
                      <ChevronUp size={18} color={COLORS.textSecondary} />
                    ) : (
                      <ChevronDown size={18} color={COLORS.textSecondary} />
                    )}

                    <TouchableOpacity onPress={() => del(r.id)}>
                      <Trash2 size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* Expanded */}
                {isOpen && (
                  <View style={{ padding: SPACING.md }}>
                    
                    {r.results.map((item, i) => (
                      <View key={i} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 6
                      }}>
                        <Text style={{ flex: 2 }}>{item.name}</Text>
                        <Text style={{ flex: 1, textAlign: 'right', color: STATUS_COLOR[item.status] }}>
                          {item.value} {item.unit}
                        </Text>
                        <Text style={{ flex: 1.5, textAlign: 'right', color: COLORS.textMuted }}>
                          {item.normal_min ?? '—'}–{item.normal_max ?? '—'}
                        </Text>
                        <View style={{ flex: 0.5, alignItems: 'center' }}>
                          {getStatusIcon(item.status)}
                        </View>
                      </View>
                    ))}

                    {r.ai_summary && (
                      <View style={{
                        marginTop: SPACING.md,
                        padding: SPACING.md,
                        borderRadius: RADIUS.md,
                        backgroundColor: COLORS.primaryLight,
                        borderWidth: 1,
                        borderColor: COLORS.primary + '30'
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <BrainCircuit size={16} color={COLORS.primaryDark} />
                          <Text style={{ marginLeft: 6, color: COLORS.primaryDark, fontWeight: FONT.bold }}>
                            AI Insight
                          </Text>
                        </View>
                        <Text style={{ color: COLORS.primaryDark }}>
                          {r.ai_summary}
                        </Text>
                      </View>
                    )}

                  </View>
                )}
              </Card>
            );
          })}

          {!adding && (
            <TouchableOpacity
              onPress={() => setAdding(true)}
              style={{
                marginTop: SPACING.lg,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <PlusCircle size={20} color={COLORS.primary} />
              <Text style={{ marginLeft: 6, color: COLORS.primary, fontWeight: FONT.bold }}>
                Add Lab Report
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}