import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Step1 from './Step1_Business';
import Step2 from './Step2_Owner';
import Step3 from './Step3_Plan';
import Step4 from './Step4_Assistant';
import Step5 from './Step5_Channels';
import Step6 from './Step6_Review';
import { getOnboarding } from '../../services/onboardingService';
import BackButton from '../../components/BackButton';
import { useNavigation } from '@react-navigation/native';

export default function WizardHome({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [onboarding, setOnboarding] = useState<any>({});
  const nav = navigation || useNavigation();

  useEffect(() => {
    (async () => {
      const res = await getOnboarding();
      if (res && !res.error && res.data) setOnboarding(res.data);
    })();
  }, []);
  const next = () => setStep(s => s+1);
  const back = () => setStep(s => s-1);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <BackButton onPress={() => (step === 1 ? nav.goBack() : back())} label={step === 1 ? 'العودة' : 'السابق'} />
      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontWeight: '700' }}>خطوة {step} من 6</Text>
      </View>
      {step === 1 && <Step1 onboarding={onboarding} setOnboarding={setOnboarding} onNext={next} />}
      {step === 2 && <Step2 onboarding={onboarding} setOnboarding={setOnboarding} onNext={next} onBack={back} />}
      {step === 3 && <Step3 onboarding={onboarding} setOnboarding={setOnboarding} onNext={next} onBack={back} />}
      {step === 4 && <Step4 onboarding={onboarding} setOnboarding={setOnboarding} onNext={next} onBack={back} />}
      {step === 5 && <Step5 onboarding={onboarding} setOnboarding={setOnboarding} onNext={next} onBack={back} />}
      {step === 6 && <Step6 onboarding={onboarding} setOnboarding={setOnboarding} onBack={back} navigation={navigation} />}
    </View>
  );
}
