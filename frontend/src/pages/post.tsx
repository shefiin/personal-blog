import { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { FiBookmark, FiCopy, FiEdit2, FiMessageCircle, FiShare2, FiTrash2, FiX } from "react-icons/fi";
import { FaFacebookF, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { HiOutlineHeart, HiHeart } from "react-icons/hi2";
import { Link, useParams } from "react-router-dom";
import readingTime from "reading-time/lib/reading-time";
import { getGoogleAuthUrl, getSession } from "../api/auth.api";
import { addPostComment, deletePostComment, getPostEngagement, getPublishedPostBySlug, togglePostLike, togglePostSave, type PostResponse, updatePostComment } from "../api/blog.api";
import AuthForm from "../Components/auth/AuthForm";
import Spinner from "../Components/common/Spinner";

type ThemeMode = "light" | "dark" | "sepia" | "gray";

type PostPageProps = {
  themeMode: ThemeMode;
  isUserLoggedIn: boolean;
  userId: string;
  userName: string;
};

type AuthModalIntent = "like" | "comment" | "save";

const PostPage = ({ themeMode, isUserLoggedIn, userId, userName }: PostPageProps) => {
  const isDark = themeMode === "dark";
  const isSepia = themeMode === "sepia";
  const isGray = themeMode === "gray";
  const { slug } = useParams();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("Copy link");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authModalIntent, setAuthModalIntent] = useState<AuthModalIntent>("like");
  const [hasUserSession, setHasUserSession] = useState(isUserLoggedIn);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<PostResponse["comments"]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentActionLoadingId, setCommentActionLoadingId] = useState("");
  const [sessionUserId, setSessionUserId] = useState(userId);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const commentsRef = useRef<HTMLDivElement | null>(null);
  const readingStats = post ? readingTime(post.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()) : null;
  const publishedDate = post
    ? new Date(post.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "";
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = post ? `${post.title}` : "";
  const shareMenuClass = isDark
    ? "border-[#2a2a2a] bg-[#171717] shadow-[0_14px_34px_rgba(0,0,0,0.42)]"
    : isSepia
      ? "border-[#decfb3] bg-[#fbf4e8] shadow-[0_14px_34px_rgba(100,72,29,0.14)]"
      : isGray
        ? "border-[#7a7a7d] bg-[#676769] shadow-[0_14px_34px_rgba(0,0,0,0.24)]"
        : "border-[#e7e7e7] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.12)]";
  const shareButtonClass = isDark
    ? "text-[#B0B0B0] hover:text-white"
    : isSepia
      ? "text-[#6B6B6B] hover:text-[#2f2416]"
      : isGray
        ? "text-[#E4E4E4] hover:text-white"
        : "text-[#6B6B6B] hover:text-black";
  const shareItemClass = isDark
    ? "text-[#D5D5D5] hover:bg-[#202020]"
    : isSepia
      ? "text-[#5f5140] hover:bg-[#f3e8d4]"
      : isGray
        ? "text-[#F1F1F1] hover:bg-[#727275]"
        : "text-[#1f2937] hover:bg-[#f6f6f6]";
  const contentTextClass = isDark ? "text-[#B0B0B0]" : isGray ? "text-[#C9CACA]" : isSepia ? "text-[#6f5d48]" : "text-slate-700";
  const interactionButtonClass = isDark
    ? "text-[#B0B0B0] hover:text-white"
    : isSepia
      ? "text-[#5f5140] hover:text-[#2f2416]"
      : isGray
        ? "text-[#F1F1F1] hover:text-white"
        : "text-[#4b5563] hover:text-black";
  const modalPrompt = authModalIntent === "comment"
    ? "Create an account to comment for this story."
    : authModalIntent === "save"
      ? "Create an account to save this story."
      : "Create an account to like for this story.";

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (shareMenuRef.current && !shareMenuRef.current.contains(target)) {
        setShareMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback("Copied");
      setShareMenuOpen(false);
      window.setTimeout(() => setCopyFeedback("Copy link"), 1600);
    } catch {
      setCopyFeedback("Failed");
      window.setTimeout(() => setCopyFeedback("Copy link"), 1600);
    }
  };

  const handleShareWindow = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=640,height=720");
    setShareMenuOpen(false);
  };

  const handleGoogleAuth = () => {
    window.location.href = getGoogleAuthUrl(window.location.pathname);
  };

  const openAuthModal = (intent: AuthModalIntent, mode: "login" | "register" = "register") => {
    setAuthModalIntent(intent);
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    setHasUserSession(isUserLoggedIn);
  }, [isUserLoggedIn]);

  useEffect(() => {
    setSessionUserId(userId);
  }, [userId]);

  const ensureUserSession = async () => {
    if (hasUserSession || isUserLoggedIn || Boolean(sessionUserId)) {
      setHasUserSession(true);
      return true;
    }

    try {
      const response = await getSession();
      const authenticated = Boolean(response.data.user);
      setSessionUserId(response.data.user?.id || "");
      setHasUserSession(authenticated);
      return authenticated;
    } catch {
      setSessionUserId("");
      setHasUserSession(false);
      return false;
    }
  };

  const handleAuthSuccess = async () => {
    const authenticated = await ensureUserSession();
    if (authenticated) {
      setAuthModalOpen(false);
    }
  };

  useEffect(() => {
    if (!slug) {
      setError("Post not found.");
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await getPublishedPostBySlug(slug);
        setPost(response.data);
        setComments(response.data.comments || []);
        setLikeCount(response.data.likeCount || 0);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load article.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (!hasUserSession || !post?._id) {
      setLiked(false);
      setSaved(false);
      return;
    }

    const fetchEngagement = async () => {
      try {
        const response = await getPostEngagement(post._id);
        setLiked(response.data.liked);
        setSaved(response.data.saved);
        setLikeCount(response.data.likeCount);
        setComments(response.data.comments);
      } catch {
        setLiked(false);
        setSaved(false);
      }
    };

    fetchEngagement();
  }, [hasUserSession, post?._id]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;

    const codeBlocks = Array.from(root.querySelectorAll("pre"));
    codeBlocks.forEach((pre) => {
      if (pre.parentElement?.classList.contains("cc-code-wrap")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "cc-code-wrap is-collapsed";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "cc-code-toggle";
      toggle.setAttribute("aria-label", "Expand code block");
      toggle.innerHTML =
        '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';

      const parent = pre.parentElement;
      if (!parent) return;
      parent.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(toggle);

      toggle.addEventListener("click", () => {
        const collapsed = wrapper.classList.toggle("is-collapsed");
        toggle.setAttribute("aria-label", collapsed ? "Expand code block" : "Shrink code block");
        toggle.innerHTML = collapsed
          ? '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>'
          : '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 15 6-6 6 6"/></svg>';
      });
    });

    const figures = Array.from(root.querySelectorAll("figure"));
    figures.forEach((figure, figureIndex) => {
      if (figure.getAttribute("data-cc-slider") === "1") return;
      const images = Array.from(figure.querySelectorAll(":scope > img"));
      if (images.length <= 1) return;

      figure.setAttribute("data-cc-slider", "1");
      figure.classList.add("cc-slider-figure");

      const caption = figure.querySelector(":scope > figcaption");
      const viewport = document.createElement("div");
      viewport.className = "cc-slider-viewport";
      viewport.setAttribute("data-active-index", "0");

      images.forEach((image, imageIndex) => {
        const slide = document.createElement("div");
        slide.className = `cc-slider-slide${imageIndex === 0 ? " is-active" : ""}`;
        image.classList.add("cc-slider-image");
        slide.appendChild(image);
        viewport.appendChild(slide);
      });

      const prevButton = document.createElement("button");
      prevButton.type = "button";
      prevButton.className = "cc-slider-nav cc-slider-prev";
      prevButton.setAttribute("aria-label", "Previous image");
      prevButton.innerHTML =
        '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>';

      const nextButton = document.createElement("button");
      nextButton.type = "button";
      nextButton.className = "cc-slider-nav cc-slider-next";
      nextButton.setAttribute("aria-label", "Next image");
      nextButton.innerHTML =
        '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>';

      const updateSlide = (nextIndex: number) => {
        const slides = Array.from(viewport.querySelectorAll(".cc-slider-slide"));
        if (!slides.length) return;
        const safeIndex = (nextIndex + slides.length) % slides.length;
        viewport.setAttribute("data-active-index", String(safeIndex));
        slides.forEach((slide, idx) => {
          if (idx === safeIndex) slide.classList.add("is-active");
          else slide.classList.remove("is-active");
        });
      };

      prevButton.addEventListener("click", () => {
        const current = Number(viewport.getAttribute("data-active-index") || "0");
        updateSlide(current - 1);
      });

      nextButton.addEventListener("click", () => {
        const current = Number(viewport.getAttribute("data-active-index") || "0");
        updateSlide(current + 1);
      });

      figure.insertBefore(viewport, caption);
      figure.insertBefore(prevButton, caption);
      figure.insertBefore(nextButton, caption);

      if (!root.querySelector("#cc-slider-style")) {
        const style = document.createElement("style");
        style.id = "cc-slider-style";
        style.textContent = `
          .cc-slider-figure { position: relative; margin: 2.5rem 0; }
          .cc-slider-viewport { position: relative; min-height: 12rem; overflow: hidden; border-radius: 0.9rem; }
          .cc-slider-slide { display: none; }
          .cc-slider-slide.is-active { display: block; }
          .cc-slider-image { width: 100%; max-height: 32rem; object-fit: cover; border-radius: 0.9rem; display: block; }
          .cc-slider-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 2;
            height: 2rem;
            width: 2rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 9999px;
            border: 1px solid rgba(255,255,255,0.6);
            background: rgba(0,0,0,0.45);
            color: white;
            cursor: pointer;
          }
          .cc-slider-prev { left: 0.7rem; }
          .cc-slider-next { right: 0.7rem; }
        `;
        root.appendChild(style);
      }

      figure.setAttribute("data-cc-slider-id", `slider-${figureIndex}`);
    });
  }, [post, themeMode]);

  if (loading) {
    return (
      <main
        className={`min-h-[calc(100vh-4rem)] px-4 py-14 ${
          isDark
            ? "bg-[#121212]"
            : isSepia
              ? "bg-[#f8f1e3]"
              : isGray
                ? "bg-[#5a5a5c]"
                : "bg-[#FBFBFB]"
        }`}
      >
        <section className="mx-auto flex max-w-3xl items-center gap-2">
          <Spinner className={`h-5 w-5 ${isDark ? "text-[#B0B0B0]" : isGray ? "text-[#D2D3D4]" : isSepia ? "text-[#6f5d48]" : "text-slate-600"}`} />
          <p className={`${isDark ? "text-[#B0B0B0]" : isGray ? "text-[#D2D3D4]" : isSepia ? "text-[#6f5d48]" : "text-slate-600"}`}>Loading article</p>
        </section>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main
        className={`min-h-[calc(100vh-4rem)] px-4 py-14 ${
          isDark
            ? "bg-[#121212]"
            : isSepia
              ? "bg-[#f8f1e3]"
              : isGray
                ? "bg-[#5a5a5c]"
                : "bg-[#FBFBFB]"
        }`}
      >
        <section className="mx-auto max-w-3xl">
          <p className="text-red-600">{error || "Post not found."}</p>
          <Link
            to="/"
            className={`mt-4 inline-block text-sm font-medium underline ${
              isDark ? "text-[#B0B0B0]" : isGray ? "text-[#C9CACA]" : "text-black"
            }`}
          >
            Back to home
          </Link>
        </section>
      </main>
    );
  }

  const handleToggleLike = async () => {
    const hasSession = await ensureUserSession();
    if (!hasSession) {
      openAuthModal("like");
      return;
    }
    if (!post?._id) return;
    togglePostLike(post._id).then((response) => {
      setLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    }).catch(() => {});
  };

  const handleToggleSave = async () => {
    const hasSession = await ensureUserSession();
    if (!hasSession) {
      openAuthModal("save");
      return;
    }
    if (!post?._id) return;
    togglePostSave(post._id).then((response) => {
      setSaved(response.data.saved);
    }).catch(() => {});
  };

  const handleCommentAction = async () => {
    const hasSession = await ensureUserSession();
    if (!hasSession) {
      openAuthModal("comment");
      return;
    }
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmitComment = async () => {
    const hasSession = await ensureUserSession();
    if (!hasSession) {
      openAuthModal("comment");
      return;
    }
    if (!commentText.trim() || !post?._id || commentSubmitting) return;

    setCommentSubmitting(true);
    addPostComment(post._id, { text: commentText.trim() })
      .then((response) => {
        setComments(response.data.comments);
        setCommentText("");
      })
      .catch(() => {})
      .finally(() => setCommentSubmitting(false));
  };

  const handleStartEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(text);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId("");
    setEditingCommentText("");
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!post?._id || !editingCommentText.trim() || commentActionLoadingId) return;

    setCommentActionLoadingId(commentId);
    try {
      const response = await updatePostComment(post._id, commentId, { text: editingCommentText.trim() });
      setComments(response.data.comments);
      handleCancelEditComment();
    } catch (err) {
      if (isUnauthorizedError(err)) {
        setHasUserSession(false);
        setSessionUserId("");
        openAuthModal("comment");
      }
    } finally {
      setCommentActionLoadingId("");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post?._id || commentActionLoadingId) return;

    setCommentActionLoadingId(commentId);
    try {
      const response = await deletePostComment(post._id, commentId);
      setComments(response.data.comments);
      if (editingCommentId === commentId) {
        handleCancelEditComment();
      }
    } catch (err) {
      if (isUnauthorizedError(err)) {
        setHasUserSession(false);
        setSessionUserId("");
        openAuthModal("comment");
      }
    } finally {
      setCommentActionLoadingId("");
    }
  };

  const isUnauthorizedError = (err: unknown) => {
    const axiosErr = err as AxiosError;
    return axiosErr.response?.status === 401;
  };

  return (
    <main
      className={`min-h-[calc(100vh-4rem)] px-4 pb-36 pt-20 ${
        isDark
          ? "bg-[#121212]"
          : isSepia
            ? "bg-[#f8f1e3]"
            : isGray
              ? "bg-[#5a5a5c]"
              : "bg-[#FBFBFB]"
      }`}
    >
      {authModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="font-jakarta relative w-full max-w-[600px] rounded-lg border border-[#ece4d8] bg-white px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              aria-label="Close auth modal"
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6B6B6B] transition hover:bg-slate-100 hover:text-black"
            >
              <FiX className="h-4 w-4" />
            </button>
            <div className="px-10 text-center">
              <p className="text-lg font-semibold tracking-tight text-[#171717]">{modalPrompt}</p>
            </div>

            <div className="mt-5">
              <AuthForm
                key={authMode}
                mode={authMode}
                onModeChange={setAuthMode}
                variant="embedded"
                hideHeader
                hideGoogleButton
                redirectTo={window.location.pathname}
                stayOnSuccess
                onRegisterSuccess={handleAuthSuccess}
                onUserLoginSuccess={handleAuthSuccess}
              />
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-[280px] items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#6B6B6B]">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              className="mx-auto mt-4 flex h-[38px] w-full max-w-[280px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#171717] transition hover:bg-slate-50"
            >
              <img src="/images/google.svg" alt="Google" className="h-4 w-4" />
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      ) : null}

      <article className="mx-auto max-w-3xl">
        <h1 className={`font-jakarta mb-4 text-4xl font-bold tracking-tight ${isDark ? "text-[#B0B0B0]" : isGray ? "text-[#C9CACA]" : "text-black"}`}>
          {post.title}
        </h1>
        <p className="font-jakarta mb-4 text-sm font-light text-[#6B6B6B]">
          {publishedDate}{readingStats ? ` \u00b7 ${readingStats.text}` : ""}
        </p>
        <div className="mb-8 border-y border-[#e7e7e7] py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="group relative">
                <button
                  type="button"
                  aria-label="Like article"
                  onClick={handleToggleLike}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 transition ${interactionButtonClass}`}
                >
                  {liked ? <HiHeart className="h-4 w-4 text-red-500" /> : <HiOutlineHeart className="h-4 w-4" />}
                  <span className="font-jakarta text-sm">{likeCount || 0}</span>
                </button>
                <span className="font-jakarta pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  Like
                </span>
              </div>
              <div className="group relative">
                <button
                  type="button"
                  aria-label="Comment on article"
                  onClick={handleCommentAction}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 transition ${interactionButtonClass}`}
                >
                  <FiMessageCircle className="h-4 w-4" />
                  <span className="font-jakarta text-sm">{comments.length || 0}</span>
                </button>
                <span className="font-jakarta pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  Comment
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="group relative">
                <button
                  type="button"
                  aria-label="Save article"
                  onClick={handleToggleSave}
                  className={`inline-flex h-9 w-9 items-center justify-center transition ${interactionButtonClass}`}
                >
                  <FiBookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                </button>
                <span className="font-jakarta pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  Save
                </span>
              </div>
              <div ref={shareMenuRef} className="relative">
                <div className="group relative">
                  <button
                    type="button"
                    aria-label="Share article"
                    aria-expanded={shareMenuOpen}
                    onClick={() => setShareMenuOpen((prev) => !prev)}
                    className={`inline-flex h-9 w-9 items-center justify-center transition ${shareButtonClass}`}
                  >
                    <FiShare2 className="h-4 w-4" />
                  </button>
                  <span className="font-jakarta pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                    Share
                  </span>
                </div>

                {shareMenuOpen ? (
                  <div className={`font-jakarta absolute right-0 top-12 z-20 min-w-52 border p-2 ${shareMenuClass}`}>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition ${shareItemClass}`}
                    >
                      <FiCopy className="h-4 w-4" />
                      <span>{copyFeedback}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition ${shareItemClass}`}
                    >
                      <FaFacebookF className="h-4 w-4" />
                      <span>Share on Facebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition ${shareItemClass}`}
                    >
                      <FaLinkedinIn className="h-4 w-4" />
                      <span>Share on LinkedIn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWindow(`https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition ${shareItemClass}`}
                    >
                      <FaXTwitter className="h-4 w-4" />
                      <span>Share on X</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        {post.coverImage ? <img src={post.coverImage} alt={post.title} className="mb-8 block h-auto max-w-full shadow-sm" /> : null}
        <div
          ref={articleRef}
          className={`read-article prose mt-10 max-w-none text-xl leading-10 prose-headings:tracking-tight prose-img:rounded-xl prose-figure:my-12 ${
            isDark
              ? "prose-invert text-[#B0B0B0]"
              : isGray
                ? "prose-invert text-[#C9CACA]"
                : "prose-slate text-black"
          } ${isDark ? "theme-dark" : isSepia ? "theme-sepia" : isGray ? "theme-gray" : "theme-light"}`}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <section ref={commentsRef} className="mt-16 border-t border-slate-200 pt-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className={`font-jakarta text-xl font-semibold ${isDark ? "text-[#B0B0B0]" : isGray ? "text-[#C9CACA]" : "text-black"}`}>
              Comments
            </h2>
            <span className="font-jakarta text-sm text-[#6B6B6B]">{comments.length}</span>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? "border-[#2a2a2a] bg-[#171717]" : isSepia ? "border-[#decfb3] bg-[#fbf4e8]" : isGray ? "border-[#7a7a7d] bg-[#676769]" : "border-[#e7e7e7] bg-white"}`}>
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              onFocus={() => {
                if (!hasUserSession) {
                  openAuthModal("comment");
                }
              }}
              placeholder={hasUserSession ? "Share your thoughts..." : "Sign in to write a comment"}
              className={`font-jakarta min-h-28 w-full resize-none bg-transparent text-sm outline-none ${contentTextClass} placeholder:text-[#9c9c9c]`}
              readOnly={!hasUserSession}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSubmitComment}
                disabled={commentSubmitting}
                className="font-jakarta inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1f1f1f]"
              >
                {commentSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Post comment
              </button>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {comments.length > 0 ? (
              comments.map((comment) => {
                const isOwnComment = Boolean(sessionUserId) && comment.userId === sessionUserId;

                return (
                <div key={comment.id} className={`border-b pb-5 ${isDark ? "border-[#2a2a2a]" : isSepia ? "border-[#decfb3]" : isGray ? "border-[#7a7a7d]" : "border-[#ececec]"}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black font-jakarta text-sm font-semibold text-white">
                      {comment.userName?.charAt(0).toUpperCase() || "R"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-jakarta text-sm font-semibold ${isDark ? "text-[#B0B0B0]" : isGray ? "text-[#F1F1F1]" : "text-black"}`}>
                            {comment.userName}
                          </p>
                          <p className="mt-1 font-jakarta text-xs text-[#6B6B6B]">
                            {new Date(comment.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                        {isOwnComment ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleStartEditComment(comment.id, comment.text)}
                              className="font-jakarta inline-flex items-center gap-1 text-xs text-[#6B6B6B] transition hover:text-black"
                            >
                              <FiEdit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={commentActionLoadingId === comment.id}
                              className="font-jakarta inline-flex items-center gap-1 text-xs text-[#6B6B6B] transition hover:text-black disabled:cursor-not-allowed"
                            >
                              {commentActionLoadingId === comment.id ? <Spinner className="h-3.5 w-3.5" /> : <FiTrash2 className="h-3.5 w-3.5" />}
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="mt-3">
                          <textarea
                            value={editingCommentText}
                            onChange={(event) => setEditingCommentText(event.target.value)}
                            className={`font-jakarta min-h-24 w-full resize-none border px-3 py-2 text-sm outline-none ${isDark ? "border-[#2a2a2a] bg-[#171717] text-[#B0B0B0]" : isSepia ? "border-[#decfb3] bg-[#fbf4e8] text-[#6f5d48]" : isGray ? "border-[#7a7a7d] bg-[#676769] text-[#F1F1F1]" : "border-[#e7e7e7] bg-white text-slate-700"}`}
                          />
                          <div className="mt-3 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleUpdateComment(comment.id)}
                              disabled={commentActionLoadingId === comment.id || !editingCommentText.trim()}
                              className="font-jakarta inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:bg-[#c9caca]"
                            >
                              {commentActionLoadingId === comment.id ? <Spinner className="h-4 w-4" /> : null}
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditComment}
                              className="font-jakarta text-sm text-[#6B6B6B] underline underline-offset-4"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className={`mt-4 text-sm leading-7 ${contentTextClass}`}>{comment.text}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )})
            ) : (
              <p className={`font-jakarta text-sm ${contentTextClass}`}>No comments yet. Start the conversation.</p>
            )}
          </div>
        </section>
      </article>
    </main>
  );
};

export default PostPage;
