// Calculate popularity score based on various factors
export const calculatePopularity = (resource) => {
  let score = 0
  const link = resource.link.toLowerCase()
  const title = resource.title.toLowerCase()
  const description = resource.description.toLowerCase()

  // Big tech/popular platforms get higher scores
  const popularDomains = {
    'figma.com': 100,
    'github.com': 90,
    'google.com': 100,
    'fonts.google.com': 95,
    'adobe.com': 95,
    'microsoft.com': 90,
    'apple.com': 90,
    'openai.com': 95,
    'anthropic.com': 90,
    'notion.so': 85,
    'miro.com': 80,
    'dribbble.com': 85,
    'behance.net': 85,
    'awwwards.com': 80,
    'smashingmagazine.com': 85,
    'nngroup.com': 90,
    'material.io': 90,
    'tailwindcss.com': 90,
    'reactjs.org': 95
  }

  // Check domain popularity
  for (const [domain, domainScore] of Object.entries(popularDomains)) {
    if (link.includes(domain)) {
      score += domainScore
      break
    }
  }

  // Keywords in title boost popularity
  const popularKeywords = ['google', 'github', 'figma', 'adobe', 'react', 'material', 'tailwind', 'notion', 'ai', 'gpt', 'claude']
  for (const keyword of popularKeywords) {
    if (title.includes(keyword)) {
      score += 30
      break
    }
  }

  // Description keywords
  if (description.includes('popular') || description.includes('leading') || description.includes('best')) {
    score += 20
  }

  // Position in category (earlier = more popular)
  if (resource.globalIndex !== undefined) {
    score += Math.max(0, 50 - resource.globalIndex * 0.1)
  }

  return score
}

// Sort resources based on sort type
export const sortResources = (resources, sortBy) => {
  return [...resources].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.popularityScore || 0) - (a.popularityScore || 0)
      case 'recent':
        // Newest first by the date the resource was added to README.md. Entries
        // added on the same day fall back to README order.
        if (a.addedAt !== b.addedAt) return (b.addedAt || '').localeCompare(a.addedAt || '')
        return (b.globalIndex || 0) - (a.globalIndex || 0)
      case 'alphabetic':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })
}
