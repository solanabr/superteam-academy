'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const t = useTranslations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      console.log('Newsletter signup:', email);
    }
  };

  if (subscribed) {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
        <p className="text-sm text-primary font-medium">Thanks for subscribing!</p>
      </div>
    );
  }

  return (
    <div>
      <span className="text-sm font-medium text-foreground">Newsletter</span>
      <p className="text-xs text-muted-foreground mt-1 mb-3">Get updates on new courses and features</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
