import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';

import { emergencyApi } from '../lib/api';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

// 💎 Premium Icons
import { HeartHandshake, Phone, User, Trash2 } from 'lucide-react-native';

export default function EmergencyScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    blood_type: '',
    allergies: [],
    conditions: [],
    medications: [],
    emergency_contacts: [],
    organ_donor: false,
    notes: '',
    _contactName: '',
    _contactPhone: '',
    _contactRel: '',
  });

  const fetch_ = () =>
    emergencyApi
      .get()
      .then(r => {
        const p = r.data.profile;
        if (p) {
          setForm(f => ({
            ...f,
            ...p,
            _contactName: '',
            _contactPhone: '',
            _contactRel: '',
          }));
        }
        setProfile(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    fetch_();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await emergencyApi.upsert(form);
      Alert.alert('Saved', 'Emergency profile updated successfully');
      fetch_();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeContact = index =>
    setForm(f => ({
      ...f,
      emergency_contacts: f.emergency_contacts.filter((_, i) => i !== index),
    }));

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.bg,
        }}
      >
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{
        padding: SPACING.lg,
        paddingBottom: 120,
      }}
    >
      <Card variant="elevated" style={{ marginBottom: SPACING.xl }}>
        
        {/* Header */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={[TYPE.title, { marginBottom: 4 }]}>
            Emergency Profile
          </Text>
          <Text style={[TYPE.caption, { color: COLORS.textMuted }]}>
            Critical health information for emergencies
          </Text>
        </View>

        {/* Organ Donor */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.xl,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: RADIUS.full,
                backgroundColor: form.organ_donor
                  ? COLORS.primaryLight
                  : COLORS.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HeartHandshake
                size={18}
                color={
                  form.organ_donor
                    ? COLORS.primary
                    : COLORS.textMuted
                }
              />
            </View>

            <Text
              style={[
                TYPE.bodyMedium,
                {
                  color: form.organ_donor
                    ? COLORS.primary
                    : COLORS.text,
                },
              ]}
            >
              Organ Donor
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              setForm(f => ({
                ...f,
                organ_donor: !f.organ_donor,
              }))
            }
            activeOpacity={0.8}
            style={{
              width: 50,
              height: 28,
              borderRadius: 14,
              backgroundColor: form.organ_donor
                ? COLORS.primary
                : COLORS.border,
              justifyContent: 'center',
              paddingHorizontal: 3,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#fff',
                alignSelf: form.organ_donor
                  ? 'flex-end'
                  : 'flex-start',
                ...SHADOW.sm,
              }}
            />
          </TouchableOpacity>
        </View>

        {/* Inputs */}
        <Input
          label="Blood Type"
          value={form.blood_type}
          onChangeText={v => setForm({ ...form, blood_type: v })}
          placeholder="e.g. O+"
        />

        <Input
          label="Allergies"
          value={form.allergies.join(', ')}
          onChangeText={v =>
            setForm({
              ...form,
              allergies: v
                .split(',')
                .map(s => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Peanuts, Penicillin"
        />

        {/* Contacts */}
        <Text
          style={[
            TYPE.label,
            { marginTop: SPACING.lg, marginBottom: SPACING.sm },
          ]}
        >
          Emergency Contacts
        </Text>

        <View
          style={{
            backgroundColor: COLORS.bg,
            padding: SPACING.md,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: SPACING.md,
          }}
        >
          <Input
            label="Name"
            value={form._contactName}
            onChangeText={v =>
              setForm({ ...form, _contactName: v })
            }
          />

          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Phone"
                value={form._contactPhone}
                onChangeText={v =>
                  setForm({ ...form, _contactPhone: v })
                }
                keyboardType="phone-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Relation"
                value={form._contactRel}
                onChangeText={v =>
                  setForm({ ...form, _contactRel: v })
                }
                placeholder="Spouse"
              />
            </View>
          </View>

          <Button
            label="Add Contact"
            variant="secondary"
            onPress={() => {
              if (form._contactName && form._contactPhone) {
                setForm(f => ({
                  ...f,
                  emergency_contacts: [
                    ...f.emergency_contacts,
                    {
                      name: f._contactName,
                      phone: f._contactPhone,
                      relationship: f._contactRel,
                    },
                  ],
                  _contactName: '',
                  _contactPhone: '',
                  _contactRel: '',
                }));
              }
            }}
          />
        </View>

        {/* Contact List */}
        {form.emergency_contacts.map((c, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff',
              padding: SPACING.md,
              borderRadius: RADIUS.lg,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: COLORS.border,
              ...SHADOW.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: COLORS.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <User size={18} color={COLORS.primary} />
              </View>

              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: FONT.bold,
                    color: COLORS.text,
                  }}
                >
                  {c.name}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.textSecondary,
                  }}
                >
                  {c.relationship}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 2,
                  }}
                >
                  <Phone size={12} color={COLORS.textMuted} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      fontFamily: 'monospace',
                    }}
                  >
                    {c.phone}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => removeContact(i)}
              hitSlop={10}
            >
              <Trash2 size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      <Button
        label="Save Emergency Profile"
        onPress={save}
        loading={saving}
        fullWidth
        size="lg"
      />
    </ScrollView>
  );
}