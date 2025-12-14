// Lightweight in-app mock API to run the app without a backend.
const wait = (ms = 250) => new Promise(res => setTimeout(res, ms));

export async function demoLogin() {
  await wait(200);
  return { token: 'demo-token', user: { name: 'مستخدم تجريبي', email: 'hello@faheemly.com', subscription: 'مجاني' } };
}

export async function login(email: string, password: string) {
  await wait(200);
  if (email && password) {
    return { token: 'token-' + Date.now(), user: { name: 'مستخدم', email } };
  }
  return { error: 'Invalid credentials' };
}

export async function getProfile() {
  await wait(120);
  return { user: { name: 'مستخدم تجريبي', email: 'hello@faheemly.com', subscription: 'مجاني' } };
}

export async function updateProfile(data: any) {
  await wait(120);
  return { user: { ...data } };
}

export async function getConversations() {
  await wait(150);
  return {
    data: [
      { id: 'conv-demo-1', name: 'مرحباً', lastMessage: 'أهلاً! كيف أساعدك؟', unread: 0 },
      { id: 'conv-demo-2', name: 'المدفوعات', lastMessage: 'يمكننا مساعدتك في إعداد الدفع', unread: 2 }
    ]
  };
}

export async function getMessages(conversationId: string) {
  await wait(120);
  return {
    data: [
      { id: 'm1', role: 'ASSISTANT', content: 'أهلاً بك! أنا فهمي، كيف أستطيع مساعدتك؟' },
      { id: 'm2', role: 'USER', content: 'أريد تجربة' }
    ]
  };
}

export async function sendMessage(message: string, businessId?: string, conversationId?: string) {
  await wait(400);
  const conv = conversationId || 'conv-demo-' + Math.floor(Math.random() * 1000);
  const response = `ردّ تجريبي للبوت: تلقيت رسالتك (${message})`;
  return { conversationId: conv, response };
}

export async function subscribeToPlan(plan: string) {
  await wait(200);
  return { success: true, plan };
}

export async function getOnboarding() {
  await wait(80);
  return { data: {} };
}

export async function saveOnboarding(data: any) {
  await wait(80);
  return { success: true, data };
}

export default {
  demoLogin,
  login,
  getProfile,
  updateProfile,
  getConversations,
  getMessages,
  sendMessage,
  subscribeToPlan,
  getOnboarding,
  saveOnboarding,
};
