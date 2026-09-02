const https = require('https');

// GitHub API helper function
function makeGitHubRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'User-Agent': 'Netlify-Function',
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonBody);
          } else {
            reject(new Error(`GitHub API error: ${res.statusCode} - ${JSON.stringify(jsonBody)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const {
      category,
      resourceName,
      resourceUrl,
      description,
      submitterName,
      submitterEmail,
      submitterGithub
    } = JSON.parse(event.body);

    // Validate required fields
    if (!category || !resourceName || !resourceUrl || !description) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const REPO_OWNER = 'selfishprimate';
    const REPO_NAME = 'mossaique';
    const BASE_BRANCH = 'main';

    // 1. Get the base branch reference
    const baseBranchRef = await makeGitHubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${BASE_BRANCH}`,
      'GET'
    );
    const baseSha = baseBranchRef.object.sha;

    // 2. Create a new branch
    const branchName = `add-resource-${Date.now()}`;
    await makeGitHubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
      'POST',
      {
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      }
    );

    // 3. Get current README.md content
    const readmeFile = await makeGitHubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/README.md?ref=${branchName}`,
      'GET'
    );
    const currentContent = Buffer.from(readmeFile.content, 'base64').toString('utf-8');

    // 4. Find the category section and add the new resource
    const categoryHeaders = {
      'accessibility': '## Accessibility',
      'ai': '## AI',
      'articles': '## Articles',
      'blogs': '## Blogs',
      'books': '## Books',
      'color': '## Color',
      'design-news': '## Design News',
      'design-systems': '## Design Systems',
      'figma-plugins': '## Figma Plugins',
      'frontend-design': '## Frontend Design',
      'graphic-design': '## Graphic Design',
      'icons': '## Icons',
      'inspiration': '## Inspiration',
      'mockup': '## Mockup',
      'productivity': '## Productivity',
      'prototyping': '## Prototyping',
      'stock-photos': '## Stock Photos',
      'stock-videos': '## Stock Videos',
      'tutorials': '## Tutorials',
      'typography': '## Typography',
      'ui-animation': '## UI Animation',
      'ui-design': '## UI Design',
      'ux-design': '## UX Design',
      'wireframing': '## Wireframing',
      'others': '## Others'
    };

    const categoryHeader = categoryHeaders[category];
    if (!categoryHeader) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid category' })
      };
    }

    // Find the category section
    const categoryIndex = currentContent.indexOf(categoryHeader);
    if (categoryIndex === -1) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Category section not found in README' })
      };
    }

    // Find the next category header (or end of file)
    let nextCategoryIndex = currentContent.length;
    const allHeaders = Object.values(categoryHeaders);
    for (const header of allHeaders) {
      const headerIndex = currentContent.indexOf(header, categoryIndex + categoryHeader.length);
      if (headerIndex !== -1 && headerIndex < nextCategoryIndex) {
        nextCategoryIndex = headerIndex;
      }
    }

    // Create the new resource line
    const newResourceLine = `- [${resourceName}](${resourceUrl}) - ${description}\n`;

    // Insert the new resource at the end of the category section
    const beforeCategory = currentContent.substring(0, nextCategoryIndex);
    const afterCategory = currentContent.substring(nextCategoryIndex);
    const newContent = beforeCategory.trimEnd() + '\n' + newResourceLine + '\n' + afterCategory;

    // 5. Update the README.md file
    await makeGitHubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/README.md`,
      'PUT',
      {
        message: `Add ${resourceName} to ${categoryHeader.replace('## ', '')}${submitterName ? ` (submitted by ${submitterName})` : ''}`,
        content: Buffer.from(newContent).toString('base64'),
        branch: branchName,
        sha: readmeFile.sha
      }
    );

    // 6. Create a pull request
    const submitterInfo = [];
    if (submitterName) submitterInfo.push(`**Name:** ${submitterName}`);
    if (submitterEmail) submitterInfo.push(`**Email:** ${submitterEmail}`);
    if (submitterGithub) submitterInfo.push(`**GitHub:** @${submitterGithub}`);

    const prBody = `## New Resource Submission

**Resource:** ${resourceName}
**Category:** ${categoryHeader.replace('## ', '')}
**URL:** ${resourceUrl}
**Description:** ${description}

${submitterInfo.length > 0 ? '## Submitted by\n\n' + submitterInfo.join('\n') : ''}

---
*This PR was automatically created via the website submission form.*`;

    const pr = await makeGitHubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
      'POST',
      {
        title: `Add ${resourceName}`,
        head: branchName,
        base: BASE_BRANCH,
        body: prBody
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        prNumber: pr.number,
        prUrl: pr.html_url
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create pull request',
        message: error.message
      })
    };
  }
};
