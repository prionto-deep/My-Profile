/**
 * api.js — External API module
 * ─────────────────────────────────────────────────────────────
 * Handles all client-side fetches for:
 *   • GitHub public API  → repos, total stars, language stats
 *   • Codeforces API     → user rating, max rating, solved count,
 *                          recent contest history
 *
 * Features:
 *   • sessionStorage caching (per key, with TTL)
 *   • Returns structured fallback data on any API error
 *   • Never throws — callers always get a usable object
 */

// ── Cache helpers ────────────────────────────────────────────
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function cacheSet(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // SessionStorage might be full or disabled — silently skip
  }
}

// ── Fetch with timeout ────────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ══════════════════════════════════════════════════════════════
// GitHub
// ══════════════════════════════════════════════════════════════

const GITHUB_CACHE_KEY = (username) => `gh_stats_${username}`;

/**
 * Fetch GitHub stats for a user.
 * Returns: { username, publicRepos, totalStars, topLanguages,
 *             recentRepos, isFallback }
 */
export async function fetchGitHubStats(username) {
  const cacheKey = GITHUB_CACHE_KEY(username);
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, isFallback: false, fromCache: true };

  try {
    // Fetch user profile + repos in parallel
    const [user, repos] = await Promise.all([
      fetchWithTimeout(`https://api.github.com/users/${username}`),
      fetchWithTimeout(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
    ]);

    // Total stars across all repos
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

    // Top languages (by repo count)
    const langMap = {};
    repos.forEach((r) => {
      if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1;
    });
    const topLanguages = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    // 5 most recently pushed repos
    const recentRepos = repos
      .filter((r) => !r.fork)
      .slice(0, 5)
      .map((r) => ({
        name: r.name,
        description: r.description,
        stars: r.stargazers_count,
        language: r.language,
        url: r.html_url,
        updatedAt: r.pushed_at,
      }));

    const result = {
      username,
      publicRepos: user.public_repos,
      followers: user.followers,
      totalStars,
      topLanguages,
      recentRepos,
      isFallback: false,
      fromCache: false,
    };

    cacheSet(cacheKey, result);
    return result;

  } catch (err) {
    console.warn('[api.js] GitHub fetch failed, using fallback:', err.message);
    return {
      username,
      publicRepos: '—',
      followers: '—',
      totalStars: '—',
      topLanguages: ['C++', 'Python', 'JavaScript'],
      recentRepos: [],
      isFallback: true,
      fromCache: false,
    };
  }
}

// ══════════════════════════════════════════════════════════════
// Codeforces
// ══════════════════════════════════════════════════════════════

const CF_CACHE_KEY = (handle) => `cf_stats_${handle}`;

// Codeforces rank name → CSS class
export function cfRankClass(rating) {
  if (!rating || rating === '—') return 'cf-rating-grey';
  const r = parseInt(rating, 10);
  if (r < 1200) return 'cf-rating-grey';
  if (r < 1400) return 'cf-rating-green';
  if (r < 1600) return 'cf-rating-cyan';
  if (r < 1900) return 'cf-rating-blue';
  if (r < 2100) return 'cf-rating-violet';
  if (r < 2400) return 'cf-rating-orange';
  return 'cf-rating-red';
}

// Codeforces rank label
function cfRankLabel(rating) {
  if (!rating || isNaN(rating)) return 'Unrated';
  const r = parseInt(rating, 10);
  if (r < 1200) return 'Newbie';
  if (r < 1400) return 'Pupil';
  if (r < 1600) return 'Specialist';
  if (r < 1900) return 'Expert';
  if (r < 2100) return 'Candidate Master';
  if (r < 2400) return 'Master';
  if (r < 2600) return 'International Master';
  if (r < 3000) return 'Grandmaster';
  return 'Legendary Grandmaster';
}

/**
 * Fetch Codeforces stats for a handle.
 * Returns: { handle, rating, maxRating, rankLabel, maxRankLabel,
 *             solvedCount, recentContests, isFallback }
 */
export async function fetchCodeforcesStats(handle) {
  const cacheKey = CF_CACHE_KEY(handle);
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, isFallback: false, fromCache: true };

  try {
    const [userRes, submissionsRes, ratingsRes] = await Promise.all([
      fetchWithTimeout(`https://codeforces.com/api/user.info?handles=${handle}`),
      fetchWithTimeout(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1000`),
      fetchWithTimeout(`https://codeforces.com/api/user.rating?handle=${handle}`)
    ]);

    const user = userRes.result[0];

    // Count unique solved problems
    const solvedSet = new Set();
    if (submissionsRes.status === 'OK') {
      submissionsRes.result.forEach((sub) => {
        if (sub.verdict === 'OK' && sub.problem) {
          solvedSet.add(`${sub.problem.contestId}-${sub.problem.index}`);
        }
      });
    }

    // Recent 5 contests
    const recentContests = [];
    if (ratingsRes.status === 'OK') {
      const ratings = ratingsRes.result;
      ratings.slice(-5).reverse().forEach((entry) => {
        recentContests.push({
          contestId: entry.contestId,
          contestName: entry.contestName,
          rank: entry.rank,
          ratingBefore: entry.oldRating,
          ratingAfter: entry.newRating,
          delta: entry.newRating - entry.oldRating,
        });
      });
    }

    const result = {
      handle,
      rating: user.rating ?? 0,
      maxRating: user.maxRating ?? 0,
      rankLabel: cfRankLabel(user.rating),
      maxRankLabel: cfRankLabel(user.maxRating),
      solvedCount: solvedSet.size,
      recentContests,
      isFallback: false,
      fromCache: false,
    };

    cacheSet(cacheKey, result);
    return result;

  } catch (err) {
    console.warn('[api.js] Codeforces fetch failed, using fallback:', err.message);
    return {
      handle,
      rating: '—',
      maxRating: '—',
      rankLabel: 'Specialist',
      maxRankLabel: 'Specialist',
      solvedCount: '500+',
      recentContests: [],
      isFallback: true,
      fromCache: false,
    };
  }
}
