import {
  LayoutDashboard, AppWindow, KeyRound, Layers, Search,
  Rocket, LineChart, AlertTriangle, Brain, TrendingUp,
  Settings, Activity, Users
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', href: '/overview', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Apps',
    items: [
      { title: 'Applications', href: '/apps', icon: AppWindow },
      { title: 'Accounts', href: '/accounts', icon: Users },
    ],
  },
  {
    title: 'Keywords',
    items: [
      { title: 'Keywords', href: '/keywords', icon: KeyRound },
      { title: 'Niches', href: '/niches', icon: Layers },
      { title: 'Research', href: '/research', icon: Search },
    ],
  },
  {
    title: 'Push',
    items: [
      { title: 'Campaigns', href: '/campaigns', icon: Rocket },
      { title: 'Learning', href: '/learning', icon: Brain },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { title: 'Positions', href: '/positions', icon: LineChart },
      { title: 'Pessimizations', href: '/pessimizations', icon: AlertTriangle },
      { title: 'Trends', href: '/trends', icon: TrendingUp },
    ],
  },
  {
    title: 'System',
    items: [
      { title: 'Analytics', href: '/analytics', icon: Activity },
      { title: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];
