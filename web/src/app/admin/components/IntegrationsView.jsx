import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function IntegrationsView() {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [messages, setMessages] = useState([]);

  const [whatsappConfig, setWhatsappConfig] = useState({ phoneNumberId: '', accessToken: '', apiUrl: '' });
  const [telegramConfig, setTelegramConfig] = useState({ botToken: '', webhookUrl: '' });
  const [infoseedConfig, setInfoseedConfig] = useState({ baseUrl: 'https://api.infoseed.com', apiKey: '' });
  const [facebookConfig, setFacebookConfig] = useState({ baseUrl: 'https://graph.facebook.com', apiKey: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await adminApi.getIntegrations();
        setIntegrations(resp.data || []);
        const businessesResp = await adminApi.getBusinesses({ limit: 200 });
        setBusinesses(businessesResp.data || businessesResp || []);
        if (businessesResp && businessesResp.data && businessesResp.data.length) setSelectedBusiness(businessesResp.data[0].id);
      } catch (e) {
        console.error('Failed to load integrations', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const fetchConfig = async (type) => {
    if (!selectedBusiness) return;
    try {
      const resp = await adminApi.getIntegration(type, selectedBusiness);
      if (type === 'whatsapp' && resp.data) setWhatsappConfig(resp.data);
      if (type === 'telegram' && resp.data) setTelegramConfig(resp.data);
      if (type === 'infoseed' && resp.data) setInfoseedConfig(resp.data);
      if (type === 'facebook' && resp.data) setFacebookConfig(resp.data);
    } catch (e) {
      console.error('Failed to fetch config', e);
    }
  };

  const submitConfig = async (type, config) => {
    if (!selectedBusiness) return setMessages(["Please select a business first"]);
    try {
      const payload = { businessId: selectedBusiness, config };
      const resp = await adminApi.upsertIntegration(type, payload);
      setMessages([resp.message || 'Saved']);
    } catch (e) {
      setMessages([e.message || 'Failed to save']);
    }
  };

  const testConfig = async (type, config) => {
    try {
      const resp = await adminApi.testIntegration(type, config);
      setMessages([resp.data && resp.data.message ? resp.data.message : JSON.stringify(resp.data)]);
    } catch (e) {
      setMessages([e.message || 'Test failed']);
    }
  };

  if (loading) return <div>Loading integrations...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Integrations</h2>

      <div className="p-4 bg-white dark:bg-gray-800 rounded">
        <label className="block mb-2">Select Business</label>
        <select className="w-full p-2 border rounded" value={selectedBusiness} onChange={e => setSelectedBusiness(e.target.value)}>
          {businesses && businesses.data && businesses.data.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <section className="p-4 bg-white dark:bg-gray-800 rounded">
        <h3 className="font-semibold">WhatsApp (Business API / Twilio)</h3>
        <p className="text-sm text-muted-foreground">Instructions: Create a WhatsApp Business account, obtain phone number id and access token. If using Twilio for WhatsApp, provide the Twilio API credentials instead and set API URL accordingly.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <Input placeholder="API URL" value={whatsappConfig.apiUrl || ''} onChange={e => setWhatsappConfig({ ...whatsappConfig, apiUrl: e.target.value })} />
          <Input placeholder="Phone Number ID" value={whatsappConfig.phoneNumberId || ''} onChange={e => setWhatsappConfig({ ...whatsappConfig, phoneNumberId: e.target.value })} />
          <Input placeholder="Access Token" value={whatsappConfig.accessToken || ''} onChange={e => setWhatsappConfig({ ...whatsappConfig, accessToken: e.target.value })} />
        </div>

        <div className="mt-4 space-x-2">
          <Button onClick={() => submitConfig('whatsapp', whatsappConfig)}>Save</Button>
          <Button onClick={() => testConfig('whatsapp', whatsappConfig)}>Test Connection</Button>
          <Button variant="ghost" onClick={() => fetchConfig('whatsapp')}>Load</Button>
        </div>
      </section>

      <section className="p-4 bg-white dark:bg-gray-800 rounded">
        <h3 className="font-semibold">Telegram</h3>
        <p className="text-sm text-muted-foreground">Instructions: Create a bot using @BotFather, get the bot token, and set webhook URL to your server webhook endpoint.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <Input placeholder="Bot Token" value={telegramConfig.botToken || ''} onChange={e => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })} />
          <Input placeholder="Webhook URL" value={telegramConfig.webhookUrl || ''} onChange={e => setTelegramConfig({ ...telegramConfig, webhookUrl: e.target.value })} />
        </div>

        <div className="mt-4 space-x-2">
          <Button onClick={() => submitConfig('telegram', telegramConfig)}>Save</Button>
          <Button onClick={() => testConfig('telegram', telegramConfig)}>Test Connection</Button>
          <Button variant="ghost" onClick={() => fetchConfig('telegram')}>Load</Button>
        </div>
      </section>

      <section className="p-4 bg-white dark:bg-gray-800 rounded">
        <h3 className="font-semibold">Infoseed</h3>
        <p className="text-sm text-muted-foreground">Instructions: Sign up at <a href="https://infoseed.com" className="underline">infoseed.com</a>. Obtain API Key and base URL (if custom).</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <Input placeholder="Base URL" value={infoseedConfig.baseUrl || ''} onChange={e => setInfoseedConfig({ ...infoseedConfig, baseUrl: e.target.value })} />
          <Input placeholder="API Key" value={infoseedConfig.apiKey || ''} onChange={e => setInfoseedConfig({ ...infoseedConfig, apiKey: e.target.value })} />
        </div>

        <div className="mt-4 space-x-2">
          <Button onClick={() => submitConfig('infoseed', infoseedConfig)}>Save</Button>
          <Button onClick={() => testConfig('infoseed', infoseedConfig)}>Test Connection</Button>
          <Button variant="ghost" onClick={() => fetchConfig('infoseed')}>Load</Button>
        </div>
      </section>

      <section className="p-4 bg-white dark:bg-gray-800 rounded">
        <h3 className="font-semibold">Facebook Messenger</h3>
        <p className="text-sm text-muted-foreground">Instructions: Create a Facebook App, add Messenger product, obtain Page Access Token and App Secret. Configure webhook in Facebook Developer Console.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <Input placeholder="Base URL" value={facebookConfig.baseUrl || ''} onChange={e => setFacebookConfig({ ...facebookConfig, baseUrl: e.target.value })} />
          <Input placeholder="API Key / Page Access Token" value={facebookConfig.apiKey || ''} onChange={e => setFacebookConfig({ ...facebookConfig, apiKey: e.target.value })} />
        </div>

        <div className="mt-4 space-x-2">
          <Button onClick={() => submitConfig('facebook', facebookConfig)}>Save</Button>
          <Button onClick={() => testConfig('facebook', facebookConfig)}>Test Connection</Button>
          <Button variant="ghost" onClick={() => fetchConfig('facebook')}>Load</Button>
        </div>
      </section>

      {messages.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded">
          {messages.map((m, i) => (
            <div key={i}>{m}</div>
          ))}
        </div>
      )}
    </div>
  );
}
