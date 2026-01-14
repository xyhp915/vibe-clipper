import { useState } from 'preact/hooks'
import { clip } from '../lib/clipper-core'

export function ClipperPage () {
  const [htmlInput, setHtmlInput] = useState(`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Sample Article</title>
    <meta name="author" content="John Doe">
    <meta name="description" content="This is a sample article demonstrating the clipper library">
  </head>
  <body>
    <article>
      <h1>Welcome to Clipper Demo</h1>
      <p>This is a <strong>powerful</strong> web content extraction library.</p>
      <h2>Features</h2>
      <ul>
        <li>Extract main content from HTML</li>
        <li>Convert to clean Markdown</li>
        <li>Support for <em>rich formatting</em></li>
        <li>Task lists and tables</li>
      </ul>
      <h2>Code Example</h2>
      <pre><code data-lang="javascript">const result = clip(html, { url: 'https://example.com' });
console.log(result.markdown);</code></pre>
      <blockquote>
        <p>Clipper makes web scraping easy and efficient!</p>
      </blockquote>
    </article>
  </body>
</html>`)

  const [url, setUrl] = useState('https://example.com/article')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleClip = () => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const clipResult = clip(htmlInput, { url })
      setResult(clipResult)
      setSuccessMessage('✅ Content extracted successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadExample = (example: string) => {
    switch (example) {
      case 'blog':
        setHtmlInput(`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>My Blog Post</title>
    <meta name="author" content="Jane Smith">
  </head>
  <body>
    <article>
      <h1>10 Tips for Better Code</h1>
      <p>Writing clean code is essential for maintainability.</p>
      <ol>
        <li>Use meaningful variable names</li>
        <li>Keep functions small and focused</li>
        <li>Write tests for your code</li>
      </ol>
    </article>
  </body>
</html>`)
        setUrl('https://blog.example.com/better-code')
        break
      case 'news':
        setHtmlInput(`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Breaking News</title>
  </head>
  <body>
    <article>
      <h1>Breaking News: Technology Advances</h1>
      <p>The tech industry continues to innovate with <mark>groundbreaking</mark> discoveries.</p>
      <p>Check out the original article at <a href="https://news.example.com">News Site</a>.</p>
    </article>
  </body>
</html>`)
        setUrl('https://news.example.com/tech-advances')
        break
      case 'recipe':
        setHtmlInput(`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Chocolate Cake Recipe</title>
  </head>
  <body>
    <article>
      <h1>Delicious Chocolate Cake</h1>
      <h2>Ingredients</h2>
      <ul>
        <li>2 cups flour</li>
        <li>1 cup sugar</li>
        <li>3/4 cup cocoa powder</li>
      </ul>
      <h2>Instructions</h2>
      <ol>
        <li>Preheat oven to 350°F</li>
        <li>Mix dry ingredients</li>
        <li>Add wet ingredients</li>
        <li>Bake for 30 minutes</li>
      </ol>
    </article>
  </body>
</html>`)
        setUrl('https://recipes.example.com/chocolate-cake')
        break
      case 'table':
        setHtmlInput(`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Product Comparison</title>
  </head>
  <body>
    <article>
      <h1>Product Comparison</h1>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Product A</td>
            <td>$99</td>
            <td>⭐⭐⭐⭐⭐</td>
          </tr>
          <tr>
            <td>Product B</td>
            <td>$149</td>
            <td>⭐⭐⭐⭐</td>
          </tr>
        </tbody>
      </table>
    </article>
  </body>
</html>`)
        setUrl('https://shop.example.com/comparison')
        break
    }
    setResult(null)
    setError(null)
    setSuccessMessage(null)
  }

  return (
      <>
        <section class="hero is-info">
          <div class="hero-body">
            <h1 class="title">Clipper Core Demo</h1>
            <h2 class="subtitle">Extract and convert web content to Markdown</h2>
          </div>
        </section>

        <div class="section">
          <div class="columns">
            <div class="column">
              <div class="box">
                <h3 class="title is-4">Quick Examples</h3>
                <div class="buttons">
                  <button
                      class="button is-link is-light"
                      onClick={() => loadExample('blog')}
                  >
                    📝 Blog Post
                  </button>
                  <button
                      class="button is-success is-light"
                      onClick={() => loadExample('news')}
                  >
                    📰 News Article
                  </button>
                  <button
                      class="button is-warning is-light"
                      onClick={() => loadExample('recipe')}
                  >
                    🍰 Recipe
                  </button>
                  <button
                      class="button is-info is-light"
                      onClick={() => loadExample('table')}
                  >
                    📊 Table
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="columns">
            <div class="column is-half">
              <div class="box">
                <h3 class="title is-5">Input HTML</h3>

                <div class="field">
                  <label class="label">Page URL</label>
                  <div class="control">
                    <input
                        class="input"
                        type="text"
                        value={url}
                        onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
                        placeholder="https://example.com/article"
                    />
                  </div>
                </div>

                <div class="field">
                  <label class="label">HTML Content</label>
                  <div class="control">
                  <textarea
                      class="textarea is-family-code"
                      rows={15}
                      value={htmlInput}
                      onInput={(e) => setHtmlInput((e.target as HTMLTextAreaElement).value)}
                      placeholder="Paste HTML content here..."
                      style={{ fontSize: '0.85rem' }}
                  />
                  </div>
                </div>

                <div class="field">
                  <div class="control">
                    <button
                        class={`button is-primary is-fullwidth ${loading ? 'is-loading' : ''}`}
                        onClick={handleClip}
                        disabled={loading}
                    >
                      🚀 Extract & Convert
                    </button>
                  </div>
                </div>

                {successMessage && (
                    <div class="notification is-success is-light">
                      {successMessage}
                    </div>
                )}

                {error && (
                    <div class="notification is-danger is-light">
                      <strong>Error:</strong> {error}
                    </div>
                )}
              </div>
            </div>

            <div class="column is-half">
              <div class="box">
                <h3 class="title is-5">Output</h3>

                {result ? (
                    <div>
                      <div class="tabs is-boxed">
                        <ul>
                          <li class="is-active"><a>Markdown</a></li>
                        </ul>
                      </div>

                      <div class="field">
                        <label class="label">Markdown Content</label>
                        <div class="control">
                      <textarea
                          class="textarea is-family-code"
                          rows={10}
                          value={result.markdown}
                          readOnly
                          style={{ fontSize: '0.85rem', backgroundColor: '#f5f5f5' }}
                      />
                        </div>
                      </div>

                      <div class="box" style={{ backgroundColor: '#fafafa' }}>
                        <h4 class="title is-6">Metadata</h4>
                        <table class="table is-fullwidth is-striped">
                          <tbody>
                          <tr>
                            <td><strong>Title</strong></td>
                            <td>{result.metadata.title}</td>
                          </tr>
                          <tr>
                            <td><strong>Author</strong></td>
                            <td>{result.metadata.author || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td><strong>Description</strong></td>
                            <td>{result.metadata.description || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td><strong>Domain</strong></td>
                            <td>{result.metadata.domain}</td>
                          </tr>
                          <tr>
                            <td><strong>Word Count</strong></td>
                            <td>{result.metadata.wordCount}</td>
                          </tr>
                          <tr>
                            <td><strong>Filename</strong></td>
                            <td>
                              <code>{result.suggestedFilename}.md</code>
                            </td>
                          </tr>
                          </tbody>
                        </table>
                      </div>

                      <div class="field is-grouped">
                        <div class="control">
                          <button
                              class="button is-success"
                              onClick={() => {
                                navigator.clipboard.writeText(result.markdown)
                              }}
                          >
                            📋 Copy Markdown
                          </button>
                        </div>
                        <div class="control">
                          <button
                              class="button is-info"
                              onClick={() => {
                                const blob = new Blob([result.markdown], { type: 'text/markdown' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `${result.suggestedFilename}.md`
                                a.click()
                                URL.revokeObjectURL(url)
                              }}
                          >
                            💾 Download
                          </button>
                        </div>
                      </div>
                    </div>
                ) : (
                    <div class="notification is-light">
                      <p>👆 Click "Extract & Convert" to see the results</p>
                    </div>
                )}
              </div>
            </div>
          </div>

          <div class="box">
            <h3 class="title is-5">📚 Features</h3>
            <div class="content">
              <div class="columns">
                <div class="column">
                  <ul>
                    <li>✅ Extract main content from HTML pages</li>
                    <li>✅ Convert to clean Markdown format</li>
                    <li>✅ Support for rich formatting (bold, italic, etc.)</li>
                    <li>✅ Tables and lists</li>
                  </ul>
                </div>
                <div class="column">
                  <ul>
                    <li>✅ Code blocks with syntax highlighting</li>
                    <li>✅ Blockquotes and citations</li>
                    <li>✅ Image and link handling</li>
                    <li>✅ Metadata extraction (title, author, etc.)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
  )
}

