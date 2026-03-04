import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPublishedPosts, type PostResponse } from "../api/blog.api";

const ReadPage = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await listPublishedPosts({ page: 1, limit: 12 });
        setPosts(response.data.items || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#FBFBFB] px-4 py-16">
      <section className="mx-auto max-w-3xl">
        {loading ? <p className="text-sm text-slate-600">Loading articles...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          posts.length > 0 ? (
            <div>
              {posts.map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug}`}
                  className="group flex items-center gap-5 border-b border-[#e7e7e7] py-5 transition"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-xl font-bold tracking-tight text-black transition group-hover:text-[#222]">
                      {post.title}
                    </h2>
                  </div>

                  <div className="h-24 w-40 flex-none overflow-hidden rounded-md border border-[#e2e2e2] bg-[#f2f2f2] sm:h-28 sm:w-48">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#9b9b9b]">
                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <circle cx="9" cy="10" r="1.5" />
                          <path d="m21 16-5-5-6 6-2-2-5 5" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No published articles yet.</p>
          )
        ) : null}
      </section>
    </main>
  );
};

export default ReadPage;
