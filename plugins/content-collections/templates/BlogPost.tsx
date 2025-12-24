import { MDXContent } from "@content-collections/mdx/react";

/**
 * BlogPost Component (MDX version)
 *
 * Renders a single blog post with MDX support.
 * Requires @content-collections/mdx package.
 */

interface BlogPostProps {
  post: {
    title: string;
    date: string;
    description: string;
    author?: string;
    readingTime?: number;
    mdx: string; // Compiled MDX code
  };
}

export function BlogPost({ post }: BlogPostProps) {
  return (
    <article className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
          {post.description}
        </p>
        <div className="flex gap-4 text-sm text-gray-500">
          <time>{post.date}</time>
          {post.author && <span>by {post.author}</span>}
          {post.readingTime && <span>{post.readingTime} min read</span>}
        </div>
      </header>

      <div className="prose dark:prose-invert max-w-none">
        <MDXContent code={post.mdx} />
      </div>
    </article>
  );
}
