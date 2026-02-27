'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  RefreshCw,
  Zap,
  Globe,
  Key,
  Server,
  ShieldCheck,
  AlertCircle,
  Clock,
  Users,
  Signal,
  Copy,
  Check,
  ArrowLeft,
} from 'lucide-react';

// ==================== Types ====================

type IndexerProvider = 'custom' | 'helius' | 'alchemy';

interface SettingsState {
  activeProvider: IndexerProvider;
  heliusApiKey: string;
  heliusRpcUrl: string;
  alchemyApiKey: string;
  alchemyRpcUrl: string;
  customRpcUrl: string;
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  entriesReturned?: number;
  responseTimeMs?: number;
}

const PROVIDERS: {
  value: IndexerProvider;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}[] = [
  {
    value: 'custom',
    label: 'Custom Indexer (RPC)',
    icon: <Server className="h-5 w-5" />,
    description:
      'Queries Solana RPC directly for Token-2022 accounts. No third-party API key needed. Best for devnet or when you have a dedicated RPC provider.',
    color: 'text-emerald-500',
  },
  {
    value: 'helius',
    label: 'Helius DAS API',
    icon: <Zap className="h-5 w-5" />,
    description:
      'Uses Helius getTokenHolders for fast indexed queries. Requires an API key from dev.helius.xyz.',
    color: 'text-orange-500',
  },
  {
    value: 'alchemy',
    label: 'Alchemy Enhanced API',
    icon: <Globe className="h-5 w-5" />,
    description:
      'Uses Alchemy enhanced Solana RPC for reliable holder queries. Requires an API key from alchemy.com.',
    color: 'text-blue-500',
  },
];

const DEFAULT_SETTINGS: SettingsState = {
  activeProvider: 'custom',
  heliusApiKey: '',
  heliusRpcUrl: '',
  alchemyApiKey: '',
  alchemyRpcUrl: '',
  customRpcUrl: '',
};

// ==================== Component ====================

export default function AdminIndexerSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<IndexerProvider | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ---------- Load settings ----------

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/indexer-settings');
      if (res.ok) {
        const data = await res.json();
        const loaded: SettingsState = {
          activeProvider: data.activeProvider || 'custom',
          heliusApiKey: data.heliusApiKey || '',
          heliusRpcUrl: data.heliusRpcUrl || '',
          alchemyApiKey: data.alchemyApiKey || '',
          alchemyRpcUrl: data.alchemyRpcUrl || '',
          customRpcUrl: data.customRpcUrl || '',
        };
        setSettings(loaded);
        setOriginalSettings(loaded);
      }
    } catch (err) {
      console.error('Failed to load indexer settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ---------- Save ----------

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/admin/indexer-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setOriginalSettings({ ...settings });
        setSaveMessage({
          type: 'success',
          text: 'Settings saved successfully. Indexer cache flushed.',
        });
      } else {
        const data = await res.json();
        setSaveMessage({ type: 'error', text: data.error || 'Failed to save settings.' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Network error. Could not save settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 6000);
    }
  };

  // ---------- Test connection ----------

  const handleTest = async (provider: IndexerProvider) => {
    setTesting(provider);
    setTestResults((prev: Record<string, TestResult>) => ({
      ...prev,
      [provider]: undefined as unknown as TestResult,
    }));

    // Build payload for the selected provider
    const payload: Record<string, string> = { provider };
    if (provider === 'helius') {
      payload.apiKey = settings.heliusApiKey;
      payload.rpcUrl = settings.heliusRpcUrl;
    } else if (provider === 'alchemy') {
      payload.apiKey = settings.alchemyApiKey;
      payload.rpcUrl = settings.alchemyRpcUrl;
    } else {
      payload.rpcUrl = settings.customRpcUrl;
    }

    try {
      const res = await fetch('/api/admin/indexer-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: TestResult = await res.json();
      setTestResults((prev: Record<string, TestResult>) => ({ ...prev, [provider]: data }));
    } catch {
      setTestResults((prev: Record<string, TestResult>) => ({
        ...prev,
        [provider]: { success: false, error: 'Network error during test' },
      }));
    } finally {
      setTesting(null);
    }
  };

  // ---------- Helpers ----------

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const updateField = (field: keyof SettingsState, value: string) => {
    setSettings((prev: SettingsState) => ({ ...prev, [field]: value }));
  };

  const onInputChange =
    (field: keyof SettingsState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField(field, e.target.value);
    };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getProviderStatus = (provider: IndexerProvider): 'active' | 'configured' | 'empty' => {
    if (settings.activeProvider === provider) return 'active';

    if (provider === 'custom') {
      return settings.customRpcUrl ? 'configured' : 'empty';
    } else if (provider === 'helius') {
      return settings.heliusApiKey ? 'configured' : 'empty';
    } else if (provider === 'alchemy') {
      return settings.alchemyApiKey ? 'configured' : 'empty';
    }
    return 'empty';
  };

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const activeProviderConfig = PROVIDERS.find((p) => p.value === settings.activeProvider);
  const testResult = testResults[settings.activeProvider];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b pb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2">
            <Database className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Indexer Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure which blockchain indexer powers the XP Token leaderboard
            </p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {testResult && testResult.success ? (
                <CheckCircle2 className="mt-1 h-5 w-5 text-green-500" />
              ) : (
                <Signal className="mt-1 h-5 w-5 text-orange-500" />
              )}
              <div>
                <p className="font-semibold">Active Provider Configuration</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {activeProviderConfig?.label}: {activeProviderConfig?.description}
                </p>
                {testResult && (
                  <p
                    className={`mt-2 text-xs font-medium ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}
                  >
                    {testResult.success
                      ? `✓ Connected — ${testResult.entriesReturned} holder(s) found in ${testResult.responseTimeMs}ms`
                      : `⚠ Test pending or failed — ${testResult.error || 'Run a test to verify'}`}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={testResult?.success ? 'default' : 'outline'}>
              {settings.activeProvider.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Provider Overview */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Available Providers</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PROVIDERS.map((p) => {
            const status = getProviderStatus(p.value);
            const isActive = settings.activeProvider === p.value;
            const result = testResults[p.value];

            return (
              <Card
                key={p.value}
                className={`cursor-pointer transition-all ${
                  isActive
                    ? 'ring-primary bg-primary/5 border-primary ring-2'
                    : status === 'configured'
                      ? 'border-green-500/50 bg-green-50/30 dark:bg-green-950/20'
                      : 'hover:border-primary/50'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`flex items-center gap-2 ${p.color}`}>
                      {p.icon}
                      <CardTitle className="text-sm">{p.label}</CardTitle>
                    </div>
                    {isActive && (
                      <Badge className="bg-primary text-primary-foreground text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-xs leading-relaxed">{p.description}</p>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant={isActive ? 'default' : 'outline'}
                      className="min-w-0 flex-1"
                      onClick={() => updateField('activeProvider', p.value)}
                    >
                      {isActive ? 'Active' : 'Select'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={testing === p.value || (status === 'empty' && p.value !== 'custom')}
                      onClick={() => handleTest(p.value)}
                      className="min-w-0 flex-1 gap-2"
                      title="Test connection"
                    >
                      {testing === p.value ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="truncate">Testing...</span>
                        </span>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span className="truncate">Test</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {result && (
                    <div
                      className={`flex items-start gap-2 rounded-md p-2 text-xs ${
                        result.success
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      )}
                      <span>
                        {result.success
                          ? `${result.entriesReturned} holder(s) in ${result.responseTimeMs}ms`
                          : result.error || 'Test failed'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Configuration Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Configuration</CardTitle>
          <CardDescription>Configure credentials and endpoints for each provider</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={settings.activeProvider} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {PROVIDERS.map((p) => (
                <TabsTrigger key={p.value} value={p.value}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Custom Provider */}
            <TabsContent value="custom" className="mt-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customRpcUrl" className="mb-2 flex items-center gap-2">
                    <Server className="h-4 w-4 text-emerald-500" />
                    RPC Endpoint URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="customRpcUrl"
                      placeholder="https://api.devnet.solana.com"
                      value={settings.customRpcUrl}
                      onChange={onInputChange('customRpcUrl')}
                      className="flex-1"
                    />
                    {settings.customRpcUrl && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(settings.customRpcUrl, 'customRpcUrl')}
                      >
                        {copiedField === 'customRpcUrl' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Use your Solana RPC endpoint URL. If empty, defaults to
                    NEXT_PUBLIC_SOLANA_RPC_URL environment variable.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Helius Provider */}
            <TabsContent value="helius" className="mt-6 space-y-4">
              <div className="mb-4 flex gap-2 rounded-lg bg-blue-50/50 p-4 dark:bg-blue-950/30">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Get your API key from{' '}
                  <a
                    href="https://dev.helius.xyz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:no-underline"
                  >
                    dev.helius.xyz
                  </a>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="heliusApiKey" className="mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4 text-orange-500" />
                    API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="heliusApiKey"
                      type="password"
                      placeholder="Enter your Helius API key"
                      value={settings.heliusApiKey}
                      onChange={onInputChange('heliusApiKey')}
                      className="flex-1"
                    />
                    {settings.heliusApiKey && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(settings.heliusApiKey, 'heliusApiKey')}
                      >
                        {copiedField === 'heliusApiKey' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="heliusRpcUrl" className="mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-orange-500" />
                    RPC URL (Optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="heliusRpcUrl"
                      placeholder="https://devnet.helius-rpc.com/?api-key=..."
                      value={settings.heliusRpcUrl}
                      onChange={onInputChange('heliusRpcUrl')}
                      className="flex-1"
                    />
                    {settings.heliusRpcUrl && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(settings.heliusRpcUrl, 'heliusRpcUrl')}
                      >
                        {copiedField === 'heliusRpcUrl' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Auto-built from API key if left empty
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Alchemy Provider */}
            <TabsContent value="alchemy" className="mt-6 space-y-4">
              <div className="mb-4 flex gap-2 rounded-lg bg-blue-50/50 p-4 dark:bg-blue-950/30">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Get your API key from{' '}
                  <a
                    href="https://www.alchemy.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:no-underline"
                  >
                    alchemy.com
                  </a>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="alchemyApiKey" className="mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-500" />
                    API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="alchemyApiKey"
                      type="password"
                      placeholder="Enter your Alchemy API key"
                      value={settings.alchemyApiKey}
                      onChange={onInputChange('alchemyApiKey')}
                      className="flex-1"
                    />
                    {settings.alchemyApiKey && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(settings.alchemyApiKey, 'alchemyApiKey')}
                      >
                        {copiedField === 'alchemyApiKey' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="alchemyRpcUrl" className="mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    RPC URL (Optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="alchemyRpcUrl"
                      placeholder="https://solana-devnet.g.alchemy.com/v2/..."
                      value={settings.alchemyRpcUrl}
                      onChange={onInputChange('alchemyRpcUrl')}
                      className="flex-1"
                    />
                    {settings.alchemyRpcUrl && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(settings.alchemyRpcUrl, 'alchemyRpcUrl')}
                      >
                        {copiedField === 'alchemyRpcUrl' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Auto-built from API key if left empty
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Bar */}
      <div className="bg-background rounded-lg border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {hasChanges ? (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <p className="text-sm font-medium">You have unsaved changes</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-muted-foreground text-sm font-medium">All settings saved</p>
              </>
            )}
            {saveMessage && (
              <p
                className={`ml-2 text-xs ${
                  saveMessage.type === 'success'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {saveMessage.text}
              </p>
            )}
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Button
              variant="outline"
              disabled={!hasChanges || saving}
              onClick={() => {
                setSettings({ ...originalSettings });
                setSaveMessage(null);
              }}
              className="flex-1 md:flex-none"
            >
              Discard
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving} className="flex-1 md:flex-none">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
