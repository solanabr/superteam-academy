import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { COURSES } from '@/lib/mockData';
import { CourseCard } from '@/components/CourseCard';
import { ArrowRight, Code2, Zap, Trophy, Shield, Globe, GitFork, ChevronRight, Star, Users } from 'lucide-react';

const STATS = [
  { value: '33K+', label: 'Developers', icon: Users },
  { value: '4', label: 'Courses', icon: Code2 },
  { value: '50+', label: 'Challenges', icon: Zap },
  { value: '3', label: 'Languages', icon: Globe },
];

const FEATURES = [
  {
    icon: Code2,
    title: 'Interactive Code Challenges',
    description: 'Learn by doing. Write real Solana code in your browser with instant feedback and test validation.',
    gradient: 'from-purple-500/20 to-purple-600/5',
    border: 'border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: Trophy,
    title: 'Gamified Learning',
    description: 'Earn XP, unlock achievements, and level up from Newbie Node to Solana Grandmaster.',
    gradient: 'from-yellow-500/20 to-yellow-600/5',
    border: 'border-yellow-500/20',
    iconColor: 'text-yellow-400',
  },
  {
    icon: Shield,
    title: 'On-Chain Credentials',
    description: 'Prove your skills with verifiable certificates minted on the Solana blockchain.',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: GitFork,
    title: 'Open Source & Forkable',
    description: 'Fully open source. Fork, customize, and deploy your own academy for any community.',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    border: 'border-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
];

const TESTIMONIALS = [
  { name: 'Maria S.', role: 'DeFi Developer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', quote: 'Best Solana learning resource. Went from zero to deploying my first Anchor program in 2 weeks.' },
  { name: 'João P.', role: 'Smart Contract Auditor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao', quote: 'The DeFi course is incredible. Learned more here than in months of reading docs.' },
  { name: 'Carlos M.', role: 'Web3 Founder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos', quote: 'Finally a platform that teaches Solana the right way — project-based, interactive, and in depth.' },
];

export default function Landing() {
  const { user } = useAuth();
  const featuredCourses = COURSES.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 px-4">
        {/* Background effects */}
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-glow-purple opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gradient-glow-green opacity-30 pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium text-primary mb-8 animate-fade-in">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>Powered by Superteam — The Solana Ecosystem</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 animate-slide-up">
            Master{' '}
            <span className="gradient-text">Solana</span>
            <br />
            Development
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            The most comprehensive, project-based learning platform for Solana developers.
            Build real programs, earn on-chain credentials, and join 33,000+ builders.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {user ? (
              <Link to="/dashboard" className="btn-solana px-8 py-3.5 rounded-xl text-base font-bold flex items-center gap-2">
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <Link to="/login" className="btn-solana px-8 py-3.5 rounded-xl text-base font-bold flex items-center gap-2">
                Start Learning Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
            <Link to="/courses" className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold border border-card-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
              Browse Courses
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="glass-card rounded-xl p-4 text-center animate-slide-up" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-background-secondary border-y border-card-border">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Superteam Academy?</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Built by Solana developers, for Solana developers. No fluff, just the skills you need.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(feature => (
              <div key={feature.title} className={`rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.gradient} p-6 transition-all duration-300 hover:scale-105`}>
                <div className={`w-10 h-10 rounded-xl bg-card/50 flex items-center justify-center mb-4 ${feature.iconColor}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">Featured Courses</h2>
              <p className="text-muted-foreground">Curated paths from fundamentals to DeFi protocols</p>
            </div>
            <Link to="/courses" className="flex items-center gap-1.5 text-primary font-semibold hover:gap-2.5 transition-all">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {featuredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-background-secondary border-y border-card-border">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Loved by Builders</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />)}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-9 w-9 rounded-full border border-card-border" />
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow-purple opacity-20" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Build on Solana?</h2>
          <p className="text-muted-foreground text-lg mb-8">Join thousands of developers shipping production apps on the fastest chain.</p>
          <Link to={user ? '/courses' : '/login'} className="btn-solana px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 animate-pulse-glow">
            {user ? 'Continue Learning' : 'Start for Free'} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border py-10 px-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="font-bold gradient-text">Superteam Academy</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Open source · MIT License · Built with ❤️ by Superteam
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            {['EN', 'PT', 'ES'].map(lang => (
              <button key={lang} className="hover:text-primary transition-colors">{lang}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
