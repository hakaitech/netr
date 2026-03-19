// ============================================================================
// GITHUB API PROXY — Issues, PRs, and Commits
// ============================================================================

import { Hono } from 'hono';

const GITHUB_API = 'https://api.github.com';

export const github = new Hono();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ghHeaders(c: { req: { header: (k: string) => string | undefined } }): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'netr-dashboard',
  };
  // Forward auth token from client if present
  const token = c.req.header('x-github-token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function ghFetch<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// GET /issues?owner=x&repo=y&state=open&per_page=30
// ---------------------------------------------------------------------------

interface GHIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  user: { login: string; avatar_url: string };
  labels: { name: string; color: string }[];
  comments: number;
  pull_request?: { url: string };
  html_url: string;
}

github.get('/issues', async (c) => {
  const owner = c.req.query('owner');
  const repo = c.req.query('repo');
  if (!owner || !repo) {
    return c.json({ error: 'owner and repo query params required' }, 400);
  }

  const state = c.req.query('state') || 'open';
  const perPage = c.req.query('per_page') || '30';
  const page = c.req.query('page') || '1';

  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}&page=${page}&sort=updated&direction=desc`;
    const issues = await ghFetch<GHIssue[]>(url, ghHeaders(c));

    const mapped = issues.map((i) => ({
      id: i.id,
      number: i.number,
      title: i.title,
      state: i.state,
      isPR: !!i.pull_request,
      author: i.user.login,
      authorAvatar: i.user.avatar_url,
      labels: i.labels.map((l) => ({ name: l.name, color: l.color })),
      comments: i.comments,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      url: i.html_url,
    }));

    c.header('x-cache-ttl', '30000');
    return c.json({ items: mapped, count: mapped.length, fetchedAt: Date.now() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 502);
  }
});

// ---------------------------------------------------------------------------
// GET /pulls?owner=x&repo=y&state=open&per_page=30
// ---------------------------------------------------------------------------

interface GHPull {
  id: number;
  number: number;
  title: string;
  state: string;
  draft: boolean;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  user: { login: string; avatar_url: string };
  labels: { name: string; color: string }[];
  requested_reviewers: { login: string }[];
  additions: number;
  deletions: number;
  changed_files: number;
  html_url: string;
  head: { ref: string };
  base: { ref: string };
}

github.get('/pulls', async (c) => {
  const owner = c.req.query('owner');
  const repo = c.req.query('repo');
  if (!owner || !repo) {
    return c.json({ error: 'owner and repo query params required' }, 400);
  }

  const state = c.req.query('state') || 'open';
  const perPage = c.req.query('per_page') || '30';

  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}&sort=updated&direction=desc`;
    const pulls = await ghFetch<GHPull[]>(url, ghHeaders(c));

    const mapped = pulls.map((p) => ({
      id: p.id,
      number: p.number,
      title: p.title,
      state: p.merged_at ? 'merged' : p.state,
      draft: p.draft,
      author: p.user.login,
      authorAvatar: p.user.avatar_url,
      labels: p.labels.map((l) => ({ name: l.name, color: l.color })),
      reviewers: p.requested_reviewers.map((r) => r.login),
      additions: p.additions,
      deletions: p.deletions,
      changedFiles: p.changed_files,
      branch: p.head.ref,
      baseBranch: p.base.ref,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      mergedAt: p.merged_at,
      url: p.html_url,
    }));

    c.header('x-cache-ttl', '30000');
    return c.json({ items: mapped, count: mapped.length, fetchedAt: Date.now() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 502);
  }
});

// ---------------------------------------------------------------------------
// GET /commits?owner=x&repo=y&per_page=30
// ---------------------------------------------------------------------------

interface GHCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  author: { login: string; avatar_url: string } | null;
  html_url: string;
  stats?: { additions: number; deletions: number; total: number };
}

github.get('/commits', async (c) => {
  const owner = c.req.query('owner');
  const repo = c.req.query('repo');
  if (!owner || !repo) {
    return c.json({ error: 'owner and repo query params required' }, 400);
  }

  const perPage = c.req.query('per_page') || '30';
  const branch = c.req.query('branch') || '';
  const branchParam = branch ? `&sha=${branch}` : '';

  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=${perPage}${branchParam}`;
    const commits = await ghFetch<GHCommit[]>(url, ghHeaders(c));

    const mapped = commits.map((cm) => ({
      sha: cm.sha,
      shortSha: cm.sha.substring(0, 7),
      message: cm.commit.message.split('\n')[0],
      fullMessage: cm.commit.message,
      author: cm.author?.login ?? cm.commit.author.name,
      authorAvatar: cm.author?.avatar_url ?? '',
      date: cm.commit.author.date,
      url: cm.html_url,
    }));

    c.header('x-cache-ttl', '30000');
    return c.json({ items: mapped, count: mapped.length, fetchedAt: Date.now() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 502);
  }
});

// ---------------------------------------------------------------------------
// GET /repo?owner=x&repo=y  — repo summary stats
// ---------------------------------------------------------------------------

github.get('/repo', async (c) => {
  const owner = c.req.query('owner');
  const repo = c.req.query('repo');
  if (!owner || !repo) {
    return c.json({ error: 'owner and repo query params required' }, 400);
  }

  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}`;
    const data = await ghFetch<Record<string, unknown>>(url, ghHeaders(c));

    c.header('x-cache-ttl', '60000');
    return c.json({
      name: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      language: data.language,
      updatedAt: data.updated_at,
      defaultBranch: data.default_branch,
      url: data.html_url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 502);
  }
});
