// ============================================================================
// GITHUB HUB — Issues, PRs, and Commits for any repository
// ============================================================================

import {
  Component,
  createSignal,
  createMemo,
  createEffect,
  For,
  Show,
} from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell,
  DataList,
  Badge,
  StatGrid,
  usePolling,
  useAppletState,
} from '../../sdk';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'github-hub',
  name: 'GitHub Hub',
  description: 'Browse issues, pull requests, and commits for any GitHub repository',
  category: 'utility',
  icon: 'github',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  resizable: true,
  refreshInterval: 30_000,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GHLabel {
  name: string;
  color: string;
}

interface GHIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  isPR: boolean;
  author: string;
  authorAvatar: string;
  labels: GHLabel[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  url: string;
}

interface GHPull {
  id: number;
  number: number;
  title: string;
  state: string;
  draft: boolean;
  author: string;
  authorAvatar: string;
  labels: GHLabel[];
  reviewers: string[];
  additions: number;
  deletions: number;
  changedFiles: number;
  branch: string;
  baseBranch: string;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  url: string;
}

interface GHCommit {
  sha: string;
  shortSha: string;
  message: string;
  fullMessage: string;
  author: string;
  authorAvatar: string;
  date: string;
  url: string;
}

interface RepoInfo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  updatedAt: string;
  defaultBranch: string;
  url: string;
}

type Tab = 'issues' | 'pulls' | 'commits';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function prStateBadge(state: string, draft: boolean): { text: string; variant: 'success' | 'danger' | 'info' | 'warning' | 'default' } {
  if (draft) return { text: 'Draft', variant: 'default' };
  if (state === 'merged') return { text: 'Merged', variant: 'info' };
  if (state === 'closed') return { text: 'Closed', variant: 'danger' };
  return { text: 'Open', variant: 'success' };
}

function issueStateBadge(state: string): { text: string; variant: 'success' | 'danger' } {
  return state === 'open'
    ? { text: 'Open', variant: 'success' }
    : { text: 'Closed', variant: 'danger' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GitHubHub: Component<AppletProps> = (props) => {
  const [state, setState] = useAppletState(props, {
    owner: 'hakaitech',
    repo: 'netr',
    token: '',
  });

  const [tab, setTab] = createSignal<Tab>('issues');
  const [editing, setEditing] = createSignal(false);
  const [editOwner, setEditOwner] = createSignal(state().owner);
  const [editRepo, setEditRepo] = createSignal(state().repo);
  const [editToken, setEditToken] = createSignal(state().token);

  const owner = () => state().owner;
  const repo = () => state().repo;
  const token = () => state().token;

  const tokenHeaders = (): Record<string, string> | undefined =>
    token() ? { 'x-github-token': token() } : undefined;

  // -- Repo info ---------------------------------------------------------------

  const { data: repoInfo, loading: repoLoading } = usePolling<RepoInfo>(
    () =>
      props.services.http.get<RepoInfo>(
        `/api/github/repo?owner=${owner()}&repo=${repo()}`,
        { cacheTtl: 60_000, headers: tokenHeaders() },
      ),
    60_000,
  );

  // -- Issues ------------------------------------------------------------------

  const {
    data: issues,
    loading: issuesLoading,
    error: issuesError,
    refresh: refreshIssues,
  } = usePolling<GHIssue[], { items: GHIssue[] }>(
    () =>
      props.services.http.get<{ items: GHIssue[] }>(
        `/api/github/issues?owner=${owner()}&repo=${repo()}&state=all&per_page=30`,
        { cacheTtl: 30_000, headers: tokenHeaders() },
      ),
    30_000,
    { transform: (r) => r.items },
  );

  // -- Pulls -------------------------------------------------------------------

  const {
    data: pulls,
    loading: pullsLoading,
    error: pullsError,
    refresh: refreshPulls,
  } = usePolling<GHPull[], { items: GHPull[] }>(
    () =>
      props.services.http.get<{ items: GHPull[] }>(
        `/api/github/pulls?owner=${owner()}&repo=${repo()}&state=all&per_page=30`,
        { cacheTtl: 30_000, headers: tokenHeaders() },
      ),
    30_000,
    { transform: (r) => r.items },
  );

  // -- Commits -----------------------------------------------------------------

  const {
    data: commits,
    loading: commitsLoading,
    error: commitsError,
    refresh: refreshCommits,
  } = usePolling<GHCommit[], { items: GHCommit[] }>(
    () =>
      props.services.http.get<{ items: GHCommit[] }>(
        `/api/github/commits?owner=${owner()}&repo=${repo()}&per_page=30`,
        { cacheTtl: 30_000, headers: tokenHeaders() },
      ),
    30_000,
    { transform: (r) => r.items },
  );

  // -- Stats -------------------------------------------------------------------

  const openIssueCount = createMemo(
    () => (issues() ?? []).filter((i) => i.state === 'open' && !i.isPR).length,
  );
  const openPRCount = createMemo(
    () => (pulls() ?? []).filter((p) => p.state === 'open').length,
  );

  // -- Config save -------------------------------------------------------------

  function saveConfig() {
    setState({ owner: editOwner(), repo: editRepo(), token: editToken() });
    setEditing(false);
  }

  // Sync edit fields when state changes
  createEffect(() => {
    setEditOwner(state().owner);
    setEditRepo(state().repo);
    setEditToken(state().token);
  });

  // -- Status ------------------------------------------------------------------

  const currentLoading = () => {
    if (tab() === 'issues') return issuesLoading;
    if (tab() === 'pulls') return pullsLoading;
    return commitsLoading;
  };

  const currentError = () => {
    if (tab() === 'issues') return issuesError;
    if (tab() === 'pulls') return pullsError;
    return commitsError;
  };

  const currentRefresh = () => {
    if (tab() === 'issues') return refreshIssues;
    if (tab() === 'pulls') return refreshPulls;
    return refreshCommits;
  };

  const status = () => {
    if (currentLoading()()) return 'loading' as const;
    if (currentError()()) return 'error' as const;
    return 'connected' as const;
  };

  return (
    <AppletShell
      title="GitHub Hub"
      status={status()}
      statusText={currentError()() ?? `${owner()}/${repo()}`}
      headerRight={
        <button
          class="text-[10px] text-text-secondary hover:text-accent transition-colors px-1"
          onClick={() => setEditing((v) => !v)}
        >
          {editing() ? 'Cancel' : 'Config'}
        </button>
      }
      toolbar={
        <>
          {/* Config panel */}
          <Show when={editing()}>
            <div class="px-3 py-2 border-b border-border space-y-2 bg-surface-2/50">
              <div class="flex gap-2">
                <input
                  class="flex-1 bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-accent"
                  placeholder="Owner"
                  value={editOwner()}
                  onInput={(e) => setEditOwner(e.currentTarget.value)}
                />
                <input
                  class="flex-1 bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-accent"
                  placeholder="Repo"
                  value={editRepo()}
                  onInput={(e) => setEditRepo(e.currentTarget.value)}
                />
              </div>
              <div class="flex gap-2">
                <input
                  class="flex-1 bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-accent"
                  placeholder="Token (optional, for private repos)"
                  type="password"
                  value={editToken()}
                  onInput={(e) => setEditToken(e.currentTarget.value)}
                />
                <button
                  class="px-3 py-1 rounded bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
                  onClick={saveConfig}
                >
                  Save
                </button>
              </div>
            </div>
          </Show>

          {/* Stats row */}
          <Show when={repoInfo()}>
            <StatGrid
              columns={4}
              stats={[
                { label: 'Stars', value: String(repoInfo()!.stars) },
                { label: 'Forks', value: String(repoInfo()!.forks) },
                { label: 'Issues', value: String(openIssueCount()), color: 'text-emerald-400' },
                { label: 'PRs', value: String(openPRCount()), color: 'text-blue-400' },
              ]}
            />
          </Show>

          {/* Tab bar */}
          <div class="flex border-b border-border shrink-0">
            <For each={(['issues', 'pulls', 'commits'] as Tab[])}>
              {(t) => (
                <button
                  class={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    tab() === t
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  onClick={() => setTab(t)}
                >
                  {t === 'issues' ? 'Issues' : t === 'pulls' ? 'Pull Requests' : 'Commits'}
                </button>
              )}
            </For>
          </div>
        </>
      }
    >
      {/* Issues tab */}
      <Show when={tab() === 'issues'}>
        <DataList
          items={() => (issues() ?? []).filter((i) => !i.isPR)}
          loading={issuesLoading}
          error={issuesError}
          emptyMessage="No issues found"
          loadingMessage="Fetching issues..."
          onRetry={refreshIssues}
          renderItem={(issue) => (
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-start gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-0.5">
                  <Badge {...issueStateBadge(issue.state)} />
                  <span class="text-[10px] text-text-secondary">#{issue.number}</span>
                </div>
                <p class="text-sm text-text-primary truncate">{issue.title}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] text-text-secondary">{issue.author}</span>
                  <span class="text-[10px] text-text-secondary">{timeAgo(issue.updatedAt)}</span>
                  <Show when={issue.comments > 0}>
                    <span class="text-[10px] text-text-secondary">{issue.comments} comments</span>
                  </Show>
                </div>
                <Show when={issue.labels.length > 0}>
                  <div class="flex gap-1 mt-1 flex-wrap">
                    <For each={issue.labels}>
                      {(label) => (
                        <span
                          class="inline-block text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            'background-color': `#${label.color}33`,
                            color: `#${label.color}`,
                          }}
                        >
                          {label.name}
                        </span>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </a>
          )}
        />
      </Show>

      {/* PRs tab */}
      <Show when={tab() === 'pulls'}>
        <DataList
          items={() => pulls() ?? []}
          loading={pullsLoading}
          error={pullsError}
          emptyMessage="No pull requests found"
          loadingMessage="Fetching pull requests..."
          onRetry={refreshPulls}
          renderItem={(pr) => (
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-start gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-0.5">
                  <Badge {...prStateBadge(pr.state, pr.draft)} />
                  <span class="text-[10px] text-text-secondary">#{pr.number}</span>
                  <span class="text-[10px] text-text-secondary font-mono">{pr.branch}</span>
                </div>
                <p class="text-sm text-text-primary truncate">{pr.title}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] text-text-secondary">{pr.author}</span>
                  <span class="text-[10px] text-text-secondary">{timeAgo(pr.updatedAt)}</span>
                  <span class="text-[10px] text-emerald-400">+{pr.additions}</span>
                  <span class="text-[10px] text-red-400">-{pr.deletions}</span>
                  <span class="text-[10px] text-text-secondary">{pr.changedFiles} files</span>
                </div>
                <Show when={pr.reviewers.length > 0}>
                  <div class="flex items-center gap-1 mt-1">
                    <span class="text-[10px] text-text-secondary">Reviewers:</span>
                    <For each={pr.reviewers}>
                      {(r) => <span class="text-[10px] text-accent">{r}</span>}
                    </For>
                  </div>
                </Show>
              </div>
            </a>
          )}
        />
      </Show>

      {/* Commits tab */}
      <Show when={tab() === 'commits'}>
        <DataList
          items={() => commits() ?? []}
          loading={commitsLoading}
          error={commitsError}
          emptyMessage="No commits found"
          loadingMessage="Fetching commits..."
          onRetry={refreshCommits}
          renderItem={(commit) => (
            <a
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-start gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                    {commit.shortSha}
                  </span>
                  <span class="text-[10px] text-text-secondary">{timeAgo(commit.date)}</span>
                </div>
                <p class="text-sm text-text-primary truncate">{commit.message}</p>
                <span class="text-[10px] text-text-secondary mt-0.5">{commit.author}</span>
              </div>
            </a>
          )}
        />
      </Show>
    </AppletShell>
  );
};

export default GitHubHub;
