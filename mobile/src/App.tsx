import './patches/expoUuidPatch';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import ChatScreen from './screens/ChatScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import ConversationsScreen from './screens/ConversationsScreen';
import WidgetWebView from './screens/WidgetWebView';
import WizardHome from './screens/Wizard/WizardHome';
import Profile from './screens/ProfileScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Chat: undefined;
  Widget: { businessId?: string } | undefined;
  Wizard: undefined;
  Profile: undefined;
  Register: undefined;
  Forgot: undefined;
  Reset: { token?: string } | undefined;
  Conversations: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Conversations" component={ConversationsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Widget" component={WidgetWebView} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Wizard" component={WizardHome} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Forgot" component={ForgotPasswordScreen} />
        <Stack.Screen name="Reset" component={ResetPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
