'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, Award, Users, Code, TrendingUp, Shield } from 'lucide-react';

export function FeaturesSection() {
  const t = useTranslations('home.features');

  const features = [
    {
      icon: BookOpen,
      title: t('blockchain'),
      description: t('blockchainDesc'),
      color: 'bg-primary-500'
    },
    {
      icon: Award,
      title: t('certificates'),
      description: t('certificatesDesc'),
      color: 'bg-secondary-500'
    },
    {
      icon: Users,
      title: t('community'),
      description: t('communityDesc'),
      color: 'bg-green-500'
    },
    {
      icon: Code,
      title: 'Hands-on Projects',
      description: 'Build real dApps and smart contracts with guided projects',
      color: 'bg-purple-500'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Advance your Web3 career with industry-recognized skills',
      color: 'bg-blue-500'
    },
    {
      icon: Shield,
      title: 'Secure Learning',
      description: 'Learn security best practices and auditing techniques',
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Superteam Brazil LMS?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join the most comprehensive Solana education platform designed for Brazilian developers and Web3 enthusiasts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-20 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-12 text-center">
          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Ready to Start Your Web3 Journey?
          </h3>
          <p className="text-primary-100 text-lg mb-8">
            Join thousands of developers building the future on Solana
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div>
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-primary-200">Community Support</div>
            </div>
            <div>
              <div className="text-3xl font-bold">100%</div>
              <div className="text-primary-200">Practical Learning</div>
            </div>
            <div>
              <div className="text-3xl font-bold">90%</div>
              <div className="text-primary-200">Job Placement Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}