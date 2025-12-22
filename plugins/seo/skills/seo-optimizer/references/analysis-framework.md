# SEO Analysis Framework - Detailed Instructions

## 1. Target Keywords Analysis (Detailed)

### Keyword Identification
- **Primary keyword**: Main search term (1-3 words typically)
- **Secondary keywords**: Related terms users might search
- **LSI keywords**: Latent Semantic Indexing - contextually related terms

### Placement Verification Checklist

```markdown
✅ Check keyword appears in:
- [ ] Page title (H1)
- [ ] Meta title tag
- [ ] First 100 words of content
- [ ] At least 1 H2 or H3 subheading
- [ ] URL slug
- [ ] Meta description
- [ ] Image alt text (where natural)
```

### Keyword Density Calculation

```javascript
function calculateKeywordDensity(content, keyword) {
  const totalWords = content.split(/\s+/).length;
  const keywordCount = (content.match(new RegExp(keyword, 'gi')) || []).length;
  const density = (keywordCount / totalWords) * 100;

  return {
    count: keywordCount,
    totalWords: totalWords,
    density: density.toFixed(2),
    status: density >= 1 && density <= 2 ? 'optimal' :
            density < 1 ? 'too low' : 'too high'
  };
}
```

**Density Guidelines:**
- **1-2%**: Optimal range
- **<1%**: Too low - add more natural mentions
- **>2%**: Risk of keyword stuffing - reduce mentions

### LSI Keyword Detection

Common LSI patterns for "project management":
- Related terms: "task management", "team collaboration", "workflow"
- Tools: "software", "tools", "platforms", "apps"
- Actions: "planning", "tracking", "organizing", "scheduling"
- Benefits: "productivity", "efficiency", "streamline"

## 2. Content Structure Evaluation (Detailed)

### Heading Hierarchy Rules

**Correct Structure:**
```html
<h1>Main Topic - Project Management Guide</h1>
  <h2>What is Project Management?</h2>
  <h2>Benefits of Project Management</h2>
    <h3>Improved Team Communication</h3>
    <h3>Better Resource Allocation</h3>
  <h2>Top Project Management Tools</h2>
    <h3>Tool Category 1</h3>
    <h3>Tool Category 2</h3>
```

**Incorrect Structure:**
```html
<h1>Title</h1>
<h1>Another H1</h1>  ❌ Only one H1 allowed
<h2>Section</h2>
<h4>Subsection</h4>  ❌ Skipped H3 - breaks hierarchy
```

### Paragraph Length Evaluation

```javascript
function analyzeParagraphs(content) {
  const paragraphs = content.split('\n\n');
  const analysis = paragraphs.map(p => {
    const wordCount = p.split(/\s+/).length;
    return {
      words: wordCount,
      status: wordCount <= 150 ? 'good' : 'too long',
      recommendation: wordCount > 150 ? 'Split into 2 paragraphs' : null
    };
  });

  const avgLength = analysis.reduce((sum, p) => sum + p.words, 0) / paragraphs.length;

  return {
    paragraphs: analysis,
    average: avgLength.toFixed(1),
    needsSplitting: analysis.filter(p => p.status === 'too long').length
  };
}
```

### Scannability Checklist

- [ ] Short paragraphs (<150 words)
- [ ] Descriptive subheadings every 300-400 words
- [ ] Bullet points or numbered lists
- [ ] Bold text for key points
- [ ] White space between sections
- [ ] Logical flow and progression

## 3. Readability Analysis (Detailed)

### Flesch Reading Ease Formula

```javascript
function calculateFleschScore(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.split(/\s+/).length;
  const syllables = countSyllables(text); // Implement syllable counter

  const avgSentenceLength = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

  return {
    score: Math.round(score),
    interpretation: getInterpretation(score)
  };
}

function getInterpretation(score) {
  if (score >= 90) return 'Very Easy (5th grade)';
  if (score >= 80) return 'Easy (6th grade)';
  if (score >= 70) return 'Fairly Easy (7th grade)';
  if (score >= 60) return 'Standard (8-9th grade)';
  if (score >= 50) return 'Fairly Difficult (10-12th grade)';
  if (score >= 30) return 'Difficult (College)';
  return 'Very Difficult (College graduate)';
}
```

**Target Scores by Content Type:**
- Blog posts: 60-70 (8th-9th grade)
- Technical documentation: 50-60 (10th-12th grade)
- Academic content: 40-50 (College level)
- General audience: 70-80 (6th-7th grade)

### Sentence Length Analysis

```javascript
function analyzeSentences(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const analysis = sentences.map(s => {
    const words = s.trim().split(/\s+/).length;
    return {
      words: words,
      status: words <= 20 ? 'good' : words <= 30 ? 'acceptable' : 'too long'
    };
  });

  const avgLength = analysis.reduce((sum, s) => sum + s.words, 0) / sentences.length;
  const tooLong = analysis.filter(s => s.status === 'too long').length;

  return {
    average: avgLength.toFixed(1),
    target: '<20 words',
    needsSplitting: tooLong,
    percentage: ((tooLong / sentences.length) * 100).toFixed(1) + '%'
  };
}
```

### Passive Voice Detection

Common passive voice patterns:
- "is/are/was/were + past participle"
- Examples: "was created", "is managed", "were implemented"

**Active vs Passive:**
- ❌ Passive: "The project was completed by the team"
- ✅ Active: "The team completed the project"

**Target**: <10% passive voice usage

### Transition Words

Important transition categories:
- **Addition**: also, furthermore, moreover, additionally
- **Contrast**: however, nevertheless, although, despite
- **Sequence**: first, next, then, finally
- **Example**: for instance, for example, specifically
- **Conclusion**: therefore, thus, in conclusion

**Target**: >30% of paragraphs contain transitions

## 4. Technical SEO Elements (Detailed)

### Meta Title Optimization

**Formula**: Primary Keyword | Secondary Keyword | Brand Name

**Good Examples:**
```
Project Management Tools | Team Collaboration Software | BrandName
Best SEO Practices 2024 | Complete Guide for Beginners | BrandName
How to Build APIs | REST & GraphQL Tutorial | BrandName
```

**Bad Examples:**
```
Welcome to Our Website ❌ (No keywords)
The Ultimate Super Amazing Guide to Everything About Project Management Tools ❌ (Too long - 81 chars)
project management ❌ (Too short, no value proposition)
```

**Character Count Tool:**
```javascript
function validateMetaTitle(title) {
  const length = title.length;
  return {
    length: length,
    status: length >= 50 && length <= 60 ? 'optimal' :
            length < 50 ? 'too short' : 'too long',
    recommendation: length < 50 ? 'Add descriptive keywords' :
                   length > 60 ? 'Shorten by ' + (length - 60) + ' chars' : null
  };
}
```

### Meta Description Best Practices

**Formula**: Value proposition + Primary keyword + Call to action

**Template:**
```
[Action verb] [primary keyword] with [unique benefit].
[Secondary benefit]. [CTA like "Learn more" or "Get started"].
```

**Example:**
```
Optimize your content for search engines with our comprehensive SEO guide.
Improve rankings, increase traffic, and boost conversions. Learn proven strategies now.
(159 characters)
```

### URL Slug Optimization

**Good URL Structure:**
```
✅ /project-management-tools-2024
✅ /best-seo-practices-beginners
✅ /how-to-build-rest-api
```

**Bad URL Structure:**
```
❌ /page?id=12345
❌ /blog/post_1/article_2/final
❌ /TheBestProjectManagementToolsForYourTeam (no hyphens)
❌ /pmt (not descriptive)
```

**URL Guidelines:**
- Use hyphens (-) not underscores (_)
- Include primary keyword
- Keep under 60 characters
- Use lowercase only
- Avoid stop words (a, the, and, or)
- Be descriptive and meaningful

### Image Alt Text

**Formula**: [What it is] + [Context] + [Keyword if natural]

**Good Examples:**
```
alt="Project management dashboard showing task completion metrics"
alt="Team collaboration tools comparison chart 2024"
alt="Gantt chart template for project planning"
```

**Bad Examples:**
```
alt="image123" ❌
alt="project management project management tools" ❌ (stuffing)
alt="" ❌ (empty)
```

## 5. Content Quality Assessment (Detailed)

### Word Count by Content Type

| Content Type | Minimum | Recommended | Competitive |
|--------------|---------|-------------|-------------|
| Blog post | 800 | 1500 | 2000+ |
| How-to guide | 1200 | 2000 | 2500+ |
| Listicle | 1000 | 1500 | 2000+ |
| Product page | 300 | 500 | 800+ |
| Landing page | 500 | 1000 | 1500+ |
| Ultimate guide | 2500 | 4000 | 5000+ |

### E-A-T Signal Checklist

**Expertise:**
- [ ] Author bio with credentials
- [ ] Relevant certifications or experience
- [ ] Industry-specific terminology used correctly
- [ ] Detailed, accurate information

**Authority:**
- [ ] Links from authoritative sites
- [ ] Author published on reputable platforms
- [ ] Brand mentioned by credible sources
- [ ] Awards or recognition

**Trustworthiness:**
- [ ] Contact information easily accessible
- [ ] Privacy policy and terms
- [ ] Secure website (HTTPS)
- [ ] Sources cited for statistics/claims
- [ ] Transparent about affiliations
- [ ] Regular content updates
- [ ] User reviews or testimonials

### Content Freshness Indicators

Add these to show recency:
- Current year in title: "Best Tools 2024"
- Recent statistics: "According to 2024 research..."
- Updated timestamps: "Last updated: January 2024"
- Current examples: Reference recent events/trends
- Latest version numbers: "React 18 guide"

### Competitor Analysis Framework

```markdown
## Competitor Content Analysis

**Top 3 Ranking Pages:**

### Competitor 1: [URL]
- Word count: XXXX
- Keywords used: [list]
- Unique angles: [what they cover]
- Weaknesses: [gaps we can exploit]

### Competitor 2: [URL]
- Word count: XXXX
- Unique features: [interactive tools, videos, etc.]
- Topics covered: [list]

### Competitor 3: [URL]
- Word count: XXXX
- Content depth: [surface-level / comprehensive]
- Unique value: [what makes it rank]

**Our Advantage:**
- [Unique angle or deeper coverage]
- [Better examples or more current data]
- [Additional topics they missed]
```

## 6. Featured Snippet Optimization

### Definition Box Format

```markdown
## What is [Topic]?

[Topic] is [concise 40-60 word definition that directly answers the question].

Key characteristics:
- Point 1
- Point 2
- Point 3
```

### List Format

```markdown
## How to [Do Something]

1. **[Step 1 Title]**: Brief explanation
2. **[Step 2 Title]**: Brief explanation
3. **[Step 3 Title]**: Brief explanation
```

### Table Format

```markdown
## [Comparison Topic]

| Feature | Option A | Option B |
|---------|----------|----------|
| Price | $X | $Y |
| Best For | [Use case] | [Use case] |
```

## 7. Schema Markup Suggestions

### FAQ Schema

When content has Q&A format:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is project management?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Project management is..."
    }
  }]
}
```

### How-To Schema

For step-by-step guides:
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to optimize SEO",
  "step": [{
    "@type": "HowToStep",
    "name": "Keyword research",
    "text": "Start by researching..."
  }]
}
```

### Article Schema

For blog posts:
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "SEO Best Practices",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "datePublished": "2024-01-01"
}
```
