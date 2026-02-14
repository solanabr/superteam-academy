'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  User, Wallet, Award, Settings, Camera, Shield, CheckCircle,
  Copy, ExternalLink, AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'João Silva',
    email: 'joao.silva@email.com',
    bio: 'Blockchain enthusiast learning Solana development',
    twitter: '@joaosilva',
    github: 'github.com/joaosilva',
  });

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      toast.success('Wallet address copied!');
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: User },
    { id: 'wallet', name: 'Wallet', icon: Wallet },
    { id: 'achievements', name: 'Achievements', icon: Award },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const achievements = [
    { id: 1, name: 'First Steps', description: 'Completed first course', icon: '🎓', unlocked: true },
    { id: 2, name: 'Speed Learner', description: 'Completed 3 courses in 30 days', icon: '⚡', unlocked: true },
    { id: 3, name: 'Certificate Collector', description: 'Earned 5 certificates', icon: '🏆', unlocked: false },
    { id: 4, name: 'Community Helper', description: 'Answered 10 questions in discussions', icon: '🤝', unlocked: false },
    { id: 5, name: 'Master Builder', description: 'Built and deployed a dApp', icon: '🔨', unlocked: false },
  ];

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-8">
            Please connect your wallet to view and edit your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {formData.name.charAt(0)}
              </div>
              <button className="absolute bottom-0 right-0 bg-gray-100 hover:bg-gray-200 p-2 rounded-full shadow-md">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{formData.name}</h1>
              <p className="text-gray-600 mb-2">{formData.bio}</p>
              <div className="flex items-center justify-center md:justify-start space-x-2 text-sm">
                <Wallet className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-gray-600">
                  {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </span>
                <button 
                  onClick={handleCopyAddress}
                  className="text-primary-600 hover:text-primary-800"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                View Public Profile
              </button>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={formData.twitter}
                      onChange={(e) => setFormData({...formData, twitter: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub
                    </label>
                    <input
                      type="text"
                      value={formData.github}
                      onChange={(e) => setFormData({...formData, github: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Connected Wallet</h3>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-1" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Wallet Address</p>
                        <p className="font-mono text-gray-900">{publicKey?.toString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={handleCopyAddress}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <a 
                          href={`https://explorer.solana.com/address/${publicKey?.toString()}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Security Tip</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Never share your private key or seed phrase. Superteam Brazil LMS will never ask for these details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`p-4 rounded-lg border ${
                      achievement.unlocked 
                        ? 'bg-white border-gray-200' 
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">{achievement.name}</h3>
                          {achievement.unlocked && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'course_updates', label: 'Course updates', checked: true },
                      { id: 'achievements', label: 'Achievement unlocks', checked: true },
                      { id: 'community', label: 'Community replies', checked: false },
                      { id: 'marketing', label: 'Marketing emails', checked: false },
                    ].map((setting) => (
                      <label key={setting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{setting.label}</span>
                        <input 
                          type="checkbox" 
                          defaultChecked={setting.checked}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">Danger Zone</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">Delete Account</p>
                        <p className="text-sm text-red-600">This action cannot be undone</p>
                      </div>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}