"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

import { useGamification } from '@/context/GamificationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProgressService, User } from '@/services/progress';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const COUNTRY_CODES = [
  { code: '+55', country: 'Brazil' },
  { code: '+1', country: 'USA/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'India' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+81', country: 'Japan' },
  { code: '+61', country: 'Australia' },
  { code: '+86', country: 'China' },
  { code: '+971', country: 'UAE' },
  { code: '+234', country: 'Nigeria' },
  { code: '+84', country: 'Vietnam' },
];

export default function SettingsPage() {
  const { publicKey, connected } = useWallet();
  const { refreshUser } = useGamification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    telegram: '',
    discord: '',
  });
  
  // Split phone state
  const [countryCode, setCountryCode] = useState('+55');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (connected && publicKey) {
      setLoading(true);
      ProgressService.login(publicKey.toString())
        .then((user: User) => {
          setFormData({
            username: user.username || '',
            email: user.email || '',
            telegram: user.telegram || '',
            discord: user.discord || '',
          });
          
          // Parse phone number if exists
          if (user.phoneNumber) {
            // Simple space separation check first
            const parts = user.phoneNumber.split(' ');
            if (parts.length > 1 && parts[0].startsWith('+')) {
               setCountryCode(parts[0]);
               setPhoneNumber(parts.slice(1).join(' '));
            } else {
               // Fallback: try to find a known prefix
               const foundCode = COUNTRY_CODES.find(c => user.phoneNumber?.startsWith(c.code));
               if (foundCode) {
                   setCountryCode(foundCode.code);
                   setPhoneNumber(user.phoneNumber.replace(foundCode.code, '').trim());
               } else {
                   setPhoneNumber(user.phoneNumber);
               }
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [connected, publicKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setSaving(true);
    try {
      const fullPhoneNumber = phoneNumber ? `${countryCode} ${phoneNumber}` : '';
      
      await ProgressService.updateProfile(publicKey.toString(), {
          ...formData,
          phoneNumber: fullPhoneNumber
      });
      await refreshUser(); // Refresh global state (dashboard, navbar, etc.)
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!connected) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Settings</h1>
        <p className="text-gray-400">Please connect your wallet to manage your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#14F195]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Card className="bg-[#0A0A0F] border-[#2E2E36]">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details and contact information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username / Display Name</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="bg-[#1E1E24] border-[#2E2E36]"
                placeholder="Solanaut"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-[#1E1E24] border-[#2E2E36]"
                placeholder="you@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="telegram">Telegram Handle</Label>
                <Input
                    id="telegram"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    className="bg-[#1E1E24] border-[#2E2E36]"
                    placeholder="@username"
                />
                </div>

                <div className="space-y-2">
                <Label htmlFor="discord">Discord Handle</Label>
                <Input
                    id="discord"
                    name="discord"
                    value={formData.discord}
                    onChange={handleChange}
                    className="bg-[#1E1E24] border-[#2E2E36]"
                    placeholder="username#0000"
                />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[140px] bg-[#1E1E24] border-[#2E2E36]">
                        <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1E24] border-[#2E2E36] text-white">
                        {COUNTRY_CODES.map((item) => (
                            <SelectItem key={item.code} value={item.code} className="focus:bg-[#2E2E36] focus:text-white cursor-pointer">
                                <span className="flex items-center justify-between w-full gap-2">
                                    <span>{item.code}</span>
                                    <span className="text-xs text-gray-400 opacity-50">{item.country}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-[#1E1E24] border-[#2E2E36] flex-1"
                    placeholder="123 456 7890"
                  />
              </div>
            </div>

            <Button 
                type="submit" 
                disabled={saving}
                className="w-full bg-[#9945FF] hover:bg-[#7e37d0] text-white"
            >
                {saving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                    </>
                )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
