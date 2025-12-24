import { allPosts } from "content-collections";

/**
 * BlogList Component
 *
 * Displays all blog posts from Content Collections.
 * Posts are fully typed based on your Zod schema.
 */
export function BlogList() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>

      <ul className="space-y-6">
        {allPosts.map((post) => (
          <li key={post._meta.path} className="border-b pb-6">
            <a
              href={`/posts/${post._meta.path.replace('.md', '')}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <h2 className="text-2xl font-semibold mb-2">
                {post.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {post.description}
              </p>
              <time className="text-sm text-gray-500">
                {post.date}
              </time>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
