import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublishedPostBySlug, type PostResponse } from "../api/blog.api";

type ThemeMode = "light" | "dark" | "sepia" | "gray";

type PostPageProps = {
  themeMode: ThemeMode;
};

const PostPage = ({ themeMode }: PostPageProps) => {
  const isDark = themeMode === "dark";
  const isSepia = themeMode === "sepia";
  const isGray = themeMode === "gray";
  const { slug } = useParams();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const articleRef = useRef<HTMLDivElement | null>(null);

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
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load article.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

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
      />
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

  return (
    <main
      className={`min-h-[calc(100vh-4rem)] px-4 py-10 pb-36 ${
        isDark
          ? "bg-[#121212]"
          : isSepia
            ? "bg-[#f8f1e3]"
            : isGray
              ? "bg-[#5a5a5c]"
              : "bg-[#FBFBFB]"
      }`}
    >
      <article className="mx-auto max-w-3xl">
        {post.coverImage ? <img src={post.coverImage} alt={post.title} className="mb-8 h-72 w-full rounded-2xl object-cover shadow-sm" /> : null}
        <h1 className={`mb-10 text-4xl font-bold tracking-tight ${isDark ? "text-[#B0B0B0]" : isGray ? "text-[#C9CACA]" : "text-black"}`}>
          {post.title}
        </h1>
        <div
          ref={articleRef}
          className={`read-article prose max-w-none text-xl leading-10 prose-headings:tracking-tight prose-img:rounded-xl prose-figure:my-12 ${
            isDark
              ? "prose-invert text-[#B0B0B0]"
              : isGray
                ? "prose-invert text-[#C9CACA]"
                : "prose-slate text-black"
          } ${isDark ? "theme-dark" : isSepia ? "theme-sepia" : isGray ? "theme-gray" : "theme-light"}`}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
};

export default PostPage;
