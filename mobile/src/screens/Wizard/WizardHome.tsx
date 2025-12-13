import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import Step1 from './Step1_Business';
import Step2 from './Step2_Owner';
import Step3 from './Step3_Plan';
import Step4 from './Step4_Assistant';
import Step5 from './Step5_Channels';
import Step6 from './Step6_Review';

export default function WizardHome({ navigation }: any) {
  const [step, setStep] = useState(1);
  const next = () => setStep(s => s+1);
  const back = () => setStep(s => s-1);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {step === 1 && <Step1 onNext={next} />}
      {step === 2 && <Step2 onNext={next} onBack={back} />}
      {step === 3 && <Step3 onNext={next} onBack={back} />}
      {step === 4 && <Step4 onNext={next} onBack={back} />}
      {step === 5 && <Step5 onNext={next} onBack={back} />}
      {step === 6 && <Step6 onBack={back} />}
    </View>
  );
}
