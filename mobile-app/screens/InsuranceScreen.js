import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { insuranceApi } from '../lib/api';
import { COLORS, SPACING, RADIUS, FONT, TYPE, SHADOW } from '../lib/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

export default function InsuranceScreen() {
  const [data, setData] = useState({ insurance: null, claims: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [addingInsurance, setAddingInsurance] = useState(false);
  const [addingClaim, setAddingClaim] = useState(false);
  const [form, setForm] = useState({ provider: '', plan_name: '', policy_number: '', deductible: '', copay: '', out_of_pocket_max: '', expiry_date: '' });
  const [claimForm, setClaimForm] = useState({ description: '', date: new Date().toISOString().split('T')[0], amount_billed: '', amount_covered: '', status: 'pending' });

  const fetch_ = () => insuranceApi.get().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { fetch_(); }, []);

  const saveInsurance = async () => {
    if (!form.provider) { Alert.alert('Required', 'Provider name required'); return; }
    try {
      await insuranceApi.create({ ...form, deductible: Number(form.deductible||0), copay: Number(form.copay||0), out_of_pocket_max: Number(form.out_of_pocket_max||0) });
      setAddingInsurance(false); fetch_();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const saveClaim = async () => {
    if (!claimForm.description) { Alert.alert('Required', 'Description required'); return; }
    try {
      await insuranceApi.addClaim(data.insurance.id, { ...claimForm, amount_billed: Number(claimForm.amount_billed||0), amount_covered: Number(claimForm.amount_covered||0) });
      setAddingClaim(false); fetch_();
      setClaimForm({ description: '', date: new Date().toISOString().split('T')[0], amount_billed: '', amount_covered: '', status: 'pending' });
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const ProgressBar = ({ pct, color }) => (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginTop: 6 }}>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: color, width: `${Math.min(100, pct)}%` }} />
    </View>
  );

  const ClaimStatus = ({ status }) => {
    const cfg = { pending: { color: COLORS.orange, bg: COLORS.warningBg }, approved: { color: COLORS.success, bg: COLORS.successBg }, denied: { color: COLORS.danger, bg: COLORS.dangerBg }, processing: { color: COLORS.blue, bg: COLORS.blueBg } };
    const c = cfg[status] || cfg.pending;
    return <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, backgroundColor: c.bg }}><Text style={{ fontSize: 10, fontWeight: FONT.bold, color: c.color, textTransform: 'uppercase' }}>{status}</Text></View>;
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ paddingTop: 52, paddingBottom: 40 }}>
      <View style={{ paddingHorizontal: SPACING['2xl'], marginBottom: SPACING.xl }}>
        <Text style={TYPE.h1}>Insurance</Text>
        <Text style={[TYPE.caption, { marginTop: 2 }]}>Track coverage & claims</Text>
      </View>

      <View style={{ paddingHorizontal: SPACING.xl }}>
        {!data.insurance && !addingInsurance && (
          <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: SPACING.lg }}>🛡️</Text>
            <Text style={[TYPE.h3, { marginBottom: SPACING.xs }]}>No insurance added</Text>
            <Text style={[TYPE.caption, { textAlign: 'center', marginBottom: SPACING.xl }]}>Track your deductibles, copays, and claims in one place.</Text>
            <Button label="Add insurance plan" onPress={() => setAddingInsurance(true)} />
          </Card>
        )}

        {addingInsurance && (
          <Card variant="elevated">
            <Text style={[TYPE.h3, { marginBottom: SPACING.md }]}>Add Insurance Plan</Text>
            <Input label="Provider *" value={form.provider} onChangeText={v => setForm(f => ({...f, provider: v}))} placeholder="e.g. Star Health" />
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <View style={{ flex: 1 }}><Input label="Plan name" value={form.plan_name} onChangeText={v => setForm(f => ({...f, plan_name: v}))} placeholder="Family Floater" /></View>
              <View style={{ flex: 1 }}><Input label="Policy #" value={form.policy_number} onChangeText={v => setForm(f => ({...f, policy_number: v}))} placeholder="XXXXXXXX" /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <View style={{ flex: 1 }}><Input label="Deductible (₹)" value={form.deductible} onChangeText={v => setForm(f => ({...f, deductible: v}))} keyboardType="numeric" placeholder="5000" /></View>
              <View style={{ flex: 1 }}><Input label="Copay (₹)" value={form.copay} onChangeText={v => setForm(f => ({...f, copay: v}))} keyboardType="numeric" placeholder="200" /></View>
            </View>
            <Input label="OOP max (₹)" value={form.out_of_pocket_max} onChangeText={v => setForm(f => ({...f, out_of_pocket_max: v}))} keyboardType="numeric" placeholder="100000" />
            <Input label="Expiry date" value={form.expiry_date} onChangeText={v => setForm(f => ({...f, expiry_date: v}))} placeholder="2027-03-31" />
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <Button label="Cancel" variant="ghost" onPress={() => setAddingInsurance(false)} style={{ flex: 1 }} />
              <Button label="Save" onPress={saveInsurance} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        {data.insurance && (
          <>
            {/* Insurance card */}
            <Card variant="elevated" style={{ backgroundColor: '#1E3A5F', borderWidth: 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: FONT.bold, color: '#fff' }}>{data.insurance.provider}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{data.insurance.plan_name} · #{data.insurance.policy_number}</Text>
                </View>
                <Text style={{ fontSize: 32 }}>🛡️</Text>
              </View>
              {data.insurance.expiry_date && <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: SPACING.lg }}>Expires: {data.insurance.expiry_date}</Text>}
              <View style={{ flexDirection: 'row', gap: SPACING.xl }}>
                <View>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Copay</Text>
                  <Text style={{ fontSize: 20, fontWeight: FONT.bold, color: '#fff' }}>₹{data.insurance.copay}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Deductible</Text>
                  <Text style={{ fontSize: 20, fontWeight: FONT.bold, color: '#fff' }}>₹{data.insurance.deductible}</Text>
                </View>
              </View>
            </Card>

            {/* Summary */}
            {data.summary && (
              <Card variant="elevated">
                <Text style={[TYPE.h3, { marginBottom: SPACING.lg }]}>Coverage Summary</Text>
                <View style={{ marginBottom: SPACING.lg }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={TYPE.caption}>Deductible met</Text><Text style={[TYPE.captionBold, { color: COLORS.primary }]}>{data.summary.deductible_pct}%</Text></View>
                  <ProgressBar pct={data.summary.deductible_pct} color={COLORS.primary} />
                </View>
                {data.insurance.out_of_pocket_max > 0 && (
                  <View style={{ marginBottom: SPACING.lg }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={TYPE.caption}>Out-of-pocket max</Text><Text style={[TYPE.captionBold, { color: COLORS.orange }]}>{data.summary.oop_pct}%</Text></View>
                    <ProgressBar pct={data.summary.oop_pct} color={COLORS.orange} />
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                  {[{ label: 'Total billed', val: `₹${data.summary.total_billed}` }, { label: 'Covered', val: `₹${data.summary.total_covered}` }, { label: 'You owe', val: `₹${data.summary.out_of_pocket}` }].map(s => (
                    <View key={s.label} style={{ flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' }}>
                      <Text style={{ fontSize: 15, fontWeight: FONT.bold, color: COLORS.text }}>{s.val}</Text>
                      <Text style={[TYPE.micro]}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Claims */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
              <Text style={TYPE.h3}>Claims</Text>
              <TouchableOpacity onPress={() => setAddingClaim(!addingClaim)}>
                <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: FONT.semibold }}>+ Add claim</Text>
              </TouchableOpacity>
            </View>

            {addingClaim && (
              <Card variant="elevated">
                <Input label="Description *" value={claimForm.description} onChangeText={v => setClaimForm(f => ({...f, description: v}))} placeholder="e.g. GP consultation" />
                <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                  <View style={{ flex: 1 }}><Input label="Billed (₹)" value={claimForm.amount_billed} onChangeText={v => setClaimForm(f => ({...f, amount_billed: v}))} keyboardType="numeric" placeholder="0" /></View>
                  <View style={{ flex: 1 }}><Input label="Covered (₹)" value={claimForm.amount_covered} onChangeText={v => setClaimForm(f => ({...f, amount_covered: v}))} keyboardType="numeric" placeholder="0" /></View>
                </View>
                <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                  <Button label="Cancel" variant="ghost" onPress={() => setAddingClaim(false)} style={{ flex: 1 }} />
                  <Button label="Add" onPress={saveClaim} style={{ flex: 1 }} />
                </View>
              </Card>
            )}

            {data.claims?.map(c => (
              <Card key={c.id} variant="elevated">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPE.bodyMedium]}>{c.description}</Text>
                    <Text style={[TYPE.micro, { marginTop: 2 }]}>{c.date}</Text>
                    <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm }}>
                      <Text style={[TYPE.caption]}>Billed: ₹{c.amount_billed}</Text>
                      <Text style={[TYPE.caption, { color: COLORS.primary }]}>Covered: ₹{c.amount_covered}</Text>
                    </View>
                  </View>
                  <ClaimStatus status={c.status} />
                </View>
              </Card>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}
