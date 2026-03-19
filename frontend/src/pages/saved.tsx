import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listSavedPosts, type PostResponse } from "../api/blog.api";
import Spinner from "../Components/common/Spinner";

const SavedArticlesPage = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        const response = await listSavedPosts();
        setPosts(response.data.items || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load saved articles.");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPosts();
  }, []);

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[linear-gradient(180deg,#fbfaf7_0%,#f6efe4_55%,#fbfaf7_100%)] px-4 pb-16 pt-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-12 h-72 w-72 rounded-full bg-[#eadfcd] blur-3xl" />
        <div className="absolute right-[-10rem] top-24 h-96 w-96 rounded-full bg-[#dfe8f6] blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-[#efe0ca] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(120,104,82,0.18),transparent)]" />
      </div>

      <section className="relative mx-auto max-w-3xl">
        <h1 className="font-jakarta text-3xl font-bold tracking-tight text-black">Saved articles</h1>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
            <Spinner className="h-4 w-4" />
            <span>Loading saved articles</span>
          </div>
        ) : null}

        {error ? <p className="font-jakarta mt-6 text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          posts.length > 0 ? (
            <div className="mt-6">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug}`}
                  className="group flex items-center gap-5 border-b border-[#e7e0d5] py-5 transition"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="font-jakarta line-clamp-2 text-xl font-bold tracking-tight text-black transition group-hover:text-[#222]">
                      {post.title}
                    </h2>
                    <p className="font-jakarta mt-2 text-sm font-light text-[#6B6B6B]">
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                  </div>

                  <div className="flex-none overflow-hidden border border-[#e2d8c8] bg-[#f6efe4]">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="block max-h-28 w-auto max-w-40 object-contain sm:max-h-32 sm:max-w-48"
                      />
                    ) : (
                      <div className="flex h-24 w-40 items-center justify-center text-[#9b9b9b] sm:h-28 sm:w-48">
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
            <p className="font-jakarta mt-6 text-sm text-[#6B6B6B]">No saved articles yet.</p>
          )
        ) : null}
      </section>
    </main>
  );
};

export default SavedArticlesPage;
