import { writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const REPO_OWNER = 'selfishprimate'
const REPO_NAME = 'mossaique'

const outputPath = join(__dirname, '../src/data/github-stats.json')

// Unauthenticated GitHub API calls are limited to 60/hour per IP. CI runners share
// IPs, so those requests get rate-limited almost immediately. Send a token when one
// is available (GITHUB_TOKEN is provided automatically inside GitHub Actions).
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

const baseHeaders = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': `${REPO_OWNER}-${REPO_NAME}-stats-script`,
  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
}

async function githubFetch(url, extraHeaders = {}) {
  const response = await fetch(url, { headers: { ...baseHeaders, ...extraHeaders } })

  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    const reset = response.headers.get('x-ratelimit-reset')
    let detail = `${response.status} ${response.statusText}`

    if (remaining === '0') {
      const resetAt = reset ? new Date(Number(reset) * 1000).toISOString() : 'unknown'
      detail += ` - rate limit exhausted (resets at ${resetAt})`
      if (!token) {
        detail += '. No GITHUB_TOKEN was set, so this ran unauthenticated (60 req/hour).'
      }
    }

    throw new Error(`GitHub API request failed for ${url}: ${detail}`)
  }

  return response.json()
}

async function fetchGitHubData() {
  try {
    console.log('Fetching GitHub stats...')

    if (!token) {
      console.warn('⚠️  No GITHUB_TOKEN set - running unauthenticated (60 requests/hour limit)')
    }

    // Fetch repository data, contributors, and stargazers in parallel
    const [repoData, contributorsData, stargazersData] = await Promise.all([
      githubFetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`),
      githubFetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contributors`),
      githubFetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/stargazers?per_page=30`, {
        'Accept': 'application/vnd.github.v3.star+json'
      })
    ])

    // Filter out bot accounts from contributors
    const filteredContributors = contributorsData
      .filter(contributor =>
        contributor.type !== 'Bot' &&
        !contributor.login.includes('[bot]')
      )
      .map(contributor => ({
        id: contributor.id,
        login: contributor.login,
        avatar_url: contributor.avatar_url,
        html_url: contributor.html_url,
        contributions: contributor.contributions,
        type: 'contributor'
      }))

    // Filter out bot accounts from stargazers and format
    const filteredStargazers = stargazersData
      .filter(item =>
        item.user.type !== 'Bot' &&
        !item.user.login.includes('[bot]')
      )
      .map(item => ({
        id: item.user.id,
        login: item.user.login,
        avatar_url: item.user.avatar_url,
        html_url: item.user.html_url,
        starred_at: item.starred_at,
        type: 'stargazer'
      }))
      .sort((a, b) => new Date(b.starred_at) - new Date(a.starred_at)) // Sort by date, newest first

    // Combine and deduplicate (contributors take priority)
    const contributorIds = new Set(filteredContributors.map(c => c.id))
    const uniqueStargazers = filteredStargazers.filter(s => !contributorIds.has(s.id))

    // Combine all people (contributors first, then stargazers sorted by date)
    const allPeople = [...filteredContributors, ...uniqueStargazers]

    const githubStats = {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.watchers_count,
      people: allPeople, // All contributors and stargazers
      displayedPeople: allPeople.slice(0, 10), // First 10 for quick display
      totalPeople: allPeople.length,
      totalContributors: filteredContributors.length,
      totalStargazers: uniqueStargazers.length,
      lastUpdated: new Date().toISOString()
    }

    // Write to JSON file
    writeFileSync(outputPath, JSON.stringify(githubStats, null, 2), 'utf-8')

    console.log('✓ GitHub stats updated successfully')
    console.log(`  - Stars: ${githubStats.stars}`)
    console.log(`  - Contributors: ${filteredContributors.length}`)
    console.log(`  - Stargazers: ${uniqueStargazers.length}`)
    console.log(`  - Total people: ${githubStats.totalPeople}`)
    console.log(`  - Last updated: ${githubStats.lastUpdated}`)
  } catch (error) {
    console.error('Error fetching GitHub data:', error.message)

    // Stats are a nice-to-have. If we already have a previous snapshot, keep it and
    // let the build continue rather than breaking a deploy over a transient API error.
    if (existsSync(outputPath)) {
      console.warn('⚠️  Keeping the existing github-stats.json and continuing.')
      return
    }

    process.exit(1)
  }
}

fetchGitHubData()
