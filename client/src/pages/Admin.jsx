/**
 * Admin Landing Page
 *
 * Simple hub providing access to all admin areas.
 * Ultra-simplified design - just links to admin sections.
 */

import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Gift,
  Users,
  TrendingUp,
  Megaphone,
  ChevronRight,
  Shield
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

const adminSections = [
  {
    category: 'Dashboards & Analytics',
    sections: [
      {
        id: 'analytics',
        title: 'Analytics Dashboard',
        description: 'Conversion funnel, business metrics, and usage patterns',
        icon: TrendingUp,
        path: '/admin/analytics',
        available: true
      },
      {
        id: 'usage',
        title: 'Usage Dashboard',
        description: 'View anonymous vs authenticated usage statistics and activity',
        icon: BarChart3,
        path: '/admin/usage',
        available: true
      },
      {
        id: 'compliance',
        title: 'HIPAA Compliance',
        description: 'Audit logs, PHI detection monitoring, and compliance reporting',
        icon: Shield,
        path: '/admin/compliance',
        available: true
      }
    ]
  },
  {
    category: 'User Management',
    sections: [
      {
        id: 'users',
        title: 'User Management',
        description: 'Manage users, roles, and accounts',
        icon: Users,
        path: '/admin/users',
        available: true
      },
      {
        id: 'trials',
        title: 'Trial Management',
        description: 'View and manage user trials, extend or cancel trials',
        icon: Users,
        path: '/admin/trials',
        available: true
      },
      {
        id: 'invite-codes',
        title: 'Invite Codes',
        description: 'Create and manage trial invite codes',
        icon: Gift,
        path: '/admin/invite-codes',
        available: true
      },
      {
        id: 'campaigns',
        title: 'Trial Programs',
        description: 'Create and manage promotional campaigns for new user trials',
        icon: Megaphone,
        path: '/admin/trial-programs',
        available: true
      }
    ]
  }
];

export default function Admin() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Administration
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Manage your application settings and view analytics
          </p>
        </div>

        {/* Admin Sections */}
        <div className="space-y-8">
          {adminSections.map((group) => (
            <div key={group.category}>
              {/* Category Header */}
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                {group.category}
              </h2>

              {/* Category Sections */}
              <div className="space-y-3">
                {group.sections.map((section) => {
                  const Icon = section.icon;

                  if (!section.available) {
                    return (
                      <div
                        key={section.id}
                        className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed"
                      >
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                          <Icon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {section.title}
                          </h3>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {section.description}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          Coming Soon
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={section.id}
                      onClick={() => navigate(section.path)}
                      className="flex items-center gap-4 w-full p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left group"
                    >
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                        <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                          {section.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {section.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
