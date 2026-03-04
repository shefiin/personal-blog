import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteAdminPost,
  listAdminPosts,
  type PostResponse
} from "../api/blog.api";

const AdminBlogsPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const publishedCount = useMemo(() => posts.filter((post) => post.status === "published").length, [posts]);
  const draftCount = useMemo(() => posts.filter((post) => post.status === "draft").length, [posts]);

  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listAdminPosts({ page: 1, limit: 100 });
      setPosts(response.data.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (post: PostResponse) => {
    const confirmed = window.confirm(`Delete "${post.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(post._id);
    setError("");
    try {
      await deleteAdminPost(post._id);
      setPosts((prev) => prev.filter((item) => item._id !== post._id));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete post.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#FBFBFB] px-4 py-10">
      <section className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-black">Admin Panel</h1>
            <p className="mt-1 text-sm text-slate-600">Manage all blogs, edit content, and remove posts.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              Total {posts.length}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              Published {publishedCount}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              Drafts {draftCount}
            </span>
          </div>
        </header>

        {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <div className="px-4 py-8 text-sm text-slate-600">Loading blogs...</div>
          ) : posts.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-600">No blogs found.</div>
          ) : (
            <ul>
              {posts.map((post) => {
                const isDeleting = deletingId === post._id;
                return (
                  <li key={post._id} className="border-b border-slate-100 last:border-b-0">
                    <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-base font-semibold text-black">{post.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {post.status === "published" ? "Published" : "Draft"} • Updated{" "}
                          {new Date(post.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/write?edit=${post._id}`)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(post)}
                          disabled={isDeleting}
                          className="rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
};

export default AdminBlogsPage;
