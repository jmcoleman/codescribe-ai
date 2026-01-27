/**
 * Repository Picker Component
 * Two-step picker: Select owner/org -> Select repository
 */

import { useState, useEffect } from 'react';
import { Loader2, Building2, User, GitBranch, Lock, Globe, Search, ChevronRight } from 'lucide-react';
import { Listbox } from '@headlessui/react';
import {
  fetchUserOrganizations,
  fetchUserRepositories,
  fetchOrganizationRepositories
} from '../../services/githubService';

export function RepositoryPicker({ onRepositorySelect, onError }) {
  const [step, setStep] = useState('owner'); // 'owner' or 'repos'
  const [loading, setLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [owners, setOwners] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasGitHubOAuth, setHasGitHubOAuth] = useState(true);
  const [manualOwnerInput, setManualOwnerInput] = useState(''); // For entering any GitHub user/org

  // Fetch owners (user + orgs) on mount
  useEffect(() => {
    async function loadOwners() {
      setLoading(true);
      try {
        // Fetch orgs and user repos in parallel
        const [orgsResponse, userReposResponse] = await Promise.all([
          fetchUserOrganizations(),
          fetchUserRepositories()
        ]);

        // Check if user has GitHub OAuth (indicated by requiresGitHub flag)
        const hasGitHub = !orgsResponse.requiresGitHub && !userReposResponse.requiresGitHub;
        setHasGitHubOAuth(hasGitHub);

        if (hasGitHub) {
          // User has GitHub OAuth - show their repos and orgs
          // Extract user login from first repo (if any)
          const userLogin = userReposResponse.repositories[0]?.owner;

          // Build owners list: user first, then orgs
          const ownersList = [];

          if (userLogin) {
            ownersList.push({
              login: userLogin,
              name: userLogin,
              type: 'user',
              avatarUrl: `https://github.com/${userLogin}.png`
            });
          }

          ownersList.push(...orgsResponse.organizations);

          setOwners(ownersList);
        } else {
          // User doesn't have GitHub OAuth - they'll enter owner manually
          setOwners([]);
        }
      } catch (error) {
        console.error('Failed to load owners:', error);
        if (onError) {
          onError(error.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadOwners();
  }, [onError]);

  // Fetch repositories when owner is selected
  useEffect(() => {
    if (!selectedOwner) return;

    async function loadRepositories() {
      setLoading(true);
      // Clear any previous errors
      if (onError) {
        onError(null);
      }

      try {
        let repos;
        if (selectedOwner.type === 'user') {
          const response = await fetchUserRepositories();
          repos = response.repositories || [];
        } else {
          repos = await fetchOrganizationRepositories(selectedOwner.login);
        }
        setRepositories(repos);
        setStep('repos');
      } catch (error) {
        console.error('Failed to load repositories:', error);
        if (onError) {
          onError(error.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadRepositories();
  }, [selectedOwner, onError]);

  // Filter repositories by search term
  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle owner selection
  const handleOwnerSelect = (owner) => {
    setSelectedOwner(owner);
    setSearchTerm('');
  };

  // Handle manual owner input (for users without GitHub OAuth)
  const handleManualOwnerSubmit = async (e) => {
    e.preventDefault();
    if (!manualOwnerInput.trim()) return;

    // Clear any previous errors when submitting new owner
    if (onError) {
      onError(null);
    }

    const ownerName = manualOwnerInput.trim();
    setSelectedOwner({
      login: ownerName,
      name: ownerName,
      type: 'unknown', // Could be user or org
      avatarUrl: `https://github.com/${ownerName}.png`
    });
    setManualOwnerInput('');
  };

  // Handle repository selection
  const handleRepositorySelect = (repo) => {
    if (onRepositorySelect) {
      onRepositorySelect({
        owner: repo.owner,
        repo: repo.name,
        branch: repo.defaultBranch,
        isPrivate: repo.isPrivate
      });
    }
  };

  // Handle back to owner selection
  const handleBack = () => {
    setStep('owner');
    setSelectedOwner(null);
    setRepositories([]);
    setSearchTerm('');
    // Clear any errors when going back
    if (onError) {
      onError(null);
    }
  };

  if (loading && step === 'owner') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading your repositories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Owner Selection */}
      {step === 'owner' && (
        <div>
          {hasGitHubOAuth && owners.length > 0 ? (
            // GitHub OAuth users: Show their accounts and orgs
            <>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select owner
              </label>
              <div className="space-y-2">
                {owners.map((owner) => (
                  <button
                    key={owner.login}
                    type="button"
                    onClick={() => handleOwnerSelect(owner)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
                  >
                    <img
                      src={owner.avatarUrl}
                      alt={owner.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {owner.name}
                        </span>
                        {owner.type === 'user' ? (
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      {owner.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {owner.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            // Non-GitHub OAuth users: Allow entering any user/org
            <>
              <label htmlFor="manual-owner-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Enter a GitHub username or organization
              </label>
              <form onSubmit={handleManualOwnerSubmit} className="space-y-3">
                <input
                  id="manual-owner-input"
                  type="text"
                  value={manualOwnerInput}
                  onChange={(e) => setManualOwnerInput(e.target.value)}
                  placeholder="e.g., facebook, vercel, your-username"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors text-sm"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !manualOwnerInput.trim()}
                  className="w-full px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Browse Public Repositories
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Step 2: Repository Selection */}
      {step === 'repos' && (
        <div>
          {/* Header with back button */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>/</span>
              <span className="font-medium">{selectedOwner?.name}</span>
            </div>
          </div>

          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search repositories..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Repository List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" />
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              {searchTerm ? 'No repositories match your search' : 'No repositories found'}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredRepos.map((repo) => (
                <button
                  key={repo.fullName}
                  type="button"
                  onClick={() => handleRepositorySelect(repo)}
                  className="w-full flex items-start gap-3 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
                >
                  <div className="flex-shrink-0 pt-0.5">
                    {repo.isPrivate ? (
                      <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    ) : (
                      <Globe className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {repo.name}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {repo.isPrivate ? 'Private' : 'Public'}
                      </span>
                      {repo.language && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {repo.language}
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {repo.defaultBranch}
                      </span>
                      {repo.stars > 0 && (
                        <span>★ {repo.stars}</span>
                      )}
                      <span>
                        Updated {new Date(repo.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
