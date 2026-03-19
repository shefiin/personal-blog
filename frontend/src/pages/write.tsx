import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createAdminPost, getAdminPostById, updateAdminPost, uploadAdminBlogImage } from "../api/blog.api";

type ParagraphStyle = "normal" | "title" | "subtitle";
type ParagraphBlock = { id: string; type: "paragraph"; html: string; style: ParagraphStyle };
type ImageBlock = {
  id: string;
  type: "image";
  urls: string[];
  activeIndex: number;
  caption: string;
  completed: boolean;
};
type QuoteBlock = {
  id: string;
  type: "quote";
  html: string;
  expanded: boolean;
  completed: boolean;
  editingAfterComplete: boolean;
};
type CodeBlock = {
  id: string;
  type: "code";
  code: string;
  language: string;
  expanded: boolean;
  completed: boolean;
  editingAfterComplete: boolean;
};
type Block = ParagraphBlock | ImageBlock | QuoteBlock | CodeBlock;
type DraftSaveState = "idle" | "saving" | "saved";
type FormatAction = "bold" | "italic" | "link" | "title" | "subtitle" | "quote";
type ToolbarActiveState = Record<FormatAction, boolean>;

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
const hasMarkdownPattern = (text: string) => /\*\*[^*]+\*\*|\*[^*]+\*/.test(text);
const markdownToHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
const htmlToText = (value: string) => stripHtml(value).replace(/\s+/g, " ").trim();
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const WRITE_DRAFT_KEY = "code-context-write-draft-v1";
const isLocalMediaUrl = (url: string) => url.startsWith("blob:") || url.startsWith("data:");
const buildDraftStorageKey = (editPostId: string | null) =>
  editPostId ? `${WRITE_DRAFT_KEY}:edit:${editPostId}` : WRITE_DRAFT_KEY;
const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });

const defaultToolbarState: ToolbarActiveState = {
  bold: false,
  italic: false,
  link: false,
  title: false,
  subtitle: false,
  quote: false
};

const htmlToBlocks = (content: string): Block[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="cc-content-root">${content || ""}</div>`, "text/html");
  const root = doc.getElementById("cc-content-root");
  if (!root) return [{ id: uid(), type: "paragraph", html: "", style: "normal" }];

  const parsedBlocks: Block[] = [];
  const children = Array.from(root.children);

  children.forEach((element) => {
    const tag = element.tagName.toLowerCase();
    if (tag === "p" || tag === "h2" || tag === "h3") {
      parsedBlocks.push({
        id: uid(),
        type: "paragraph",
        html: element.innerHTML || "",
        style: tag === "h2" ? "title" : tag === "h3" ? "subtitle" : "normal"
      });
      return;
    }

    if (tag === "blockquote") {
      const paragraph = element.querySelector("p");
      parsedBlocks.push({
        id: uid(),
        type: "quote",
        html: paragraph?.innerHTML || element.innerHTML || "",
        expanded: false,
        completed: true,
        editingAfterComplete: false
      });
      return;
    }

    if (tag === "figure") {
      const urls = Array.from(element.querySelectorAll(":scope > img"))
        .map((image) => image.getAttribute("src") || "")
        .filter(Boolean);
      const caption = element.querySelector("figcaption")?.textContent?.trim() || "";

      parsedBlocks.push({
        id: uid(),
        type: "image",
        urls,
        activeIndex: 0,
        caption,
        completed: true
      });
      return;
    }

    if (tag === "pre") {
      const codeEl = element.querySelector("code");
      const className = codeEl?.className || "";
      const languageMatch = className.match(/language-([a-zA-Z0-9_-]+)/);
      parsedBlocks.push({
        id: uid(),
        type: "code",
        code: codeEl?.textContent || element.textContent || "",
        language: languageMatch?.[1] || "text",
        expanded: false,
        completed: true,
        editingAfterComplete: false
      });
      return;
    }
  });

  return parsedBlocks.length > 0 ? parsedBlocks : [{ id: uid(), type: "paragraph", html: "", style: "normal" }];
};

type ThemeMode = "light" | "dark" | "sepia" | "gray";

type WritePageProps = {
  themeMode: ThemeMode;
  onRegisterPublish: ((handler: (() => Promise<void>) | null) => void);
  onPublishAvailabilityChange: (enabled: boolean) => void;
  onDraftSaveStateChange: (state: DraftSaveState) => void;
};

const WritePage = ({ themeMode, onRegisterPublish, onPublishAvailabilityChange, onDraftSaveStateChange }: WritePageProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editPostId = searchParams.get("edit");
  const isEditMode = Boolean(editPostId);
  const draftStorageKey = buildDraftStorageKey(editPostId);
  const isDark = themeMode === "dark";
  const isBeige = themeMode === "sepia";
  const isGray = themeMode === "gray";
  const [coverImage, setCoverImage] = useState("");
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([{ id: uid(), type: "paragraph", html: "", style: "normal" }]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showMenuForId, setShowMenuForId] = useState<string | null>(null);
  const [pendingImageInsertAfterId, setPendingImageInsertAfterId] = useState<string | null>(null);
  const [toolbar, setToolbar] = useState<{ blockId: string; x: number; y: number } | null>(null);
  const [toolbarActive, setToolbarActive] = useState<ToolbarActiveState>(defaultToolbarState);
  const [linkPopover, setLinkPopover] = useState<{ x: number; y: number; url: string } | null>(null);
  const [publishError, setPublishError] = useState("");
  const [draftSaveState, setDraftSaveState] = useState<DraftSaveState>("idle");
  const [editorLoading, setEditorLoading] = useState(isEditMode);
  const [postStatus, setPostStatus] = useState<"draft" | "published">("published");
  const [postTags, setPostTags] = useState<string[]>([]);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const editorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const selectedRangeRef = useRef<Range | null>(null);
  const draftReadyRef = useRef(false);
  const latestDraftRef = useRef<{ title: string; coverImage: string; blocks: Block[] }>({
    title: "",
    coverImage: "",
    blocks: []
  });
  const hasInitializedDraftRef = useRef(false);
  const hasPendingDraftChangesRef = useRef(false);
  const lastSavedSnapshotRef = useRef("");

  useEffect(() => {
    let cancelled = false;

    const hydrateDraftBlocks = (rawBlocks: unknown[]): Block[] => {
      return rawBlocks
        .map((item: any): Block | null => {
          if (!item || typeof item !== "object" || typeof item.id !== "string" || typeof item.type !== "string") {
            return null;
          }
          if (item.type === "paragraph") {
            return {
              id: item.id,
              type: "paragraph",
              html: typeof item.html === "string" ? item.html : "",
              style: item.style === "title" || item.style === "subtitle" ? item.style : "normal"
            };
          }
          if (item.type === "quote") {
            return {
              id: item.id,
              type: "quote",
              html: typeof item.html === "string" ? item.html : "",
              expanded: Boolean(item.expanded),
              completed: Boolean(item.completed),
              editingAfterComplete: Boolean(item.editingAfterComplete)
            };
          }
          if (item.type === "code") {
            return {
              id: item.id,
              type: "code",
              code: typeof item.code === "string" ? item.code : "",
              language: typeof item.language === "string" ? item.language : "Javascript",
              expanded: Boolean(item.expanded),
              completed: Boolean(item.completed),
              editingAfterComplete: Boolean(item.editingAfterComplete)
            };
          }
          if (item.type === "image") {
            const urls = Array.isArray(item.urls)
              ? item.urls.filter((url: unknown) => typeof url === "string")
              : typeof item.url === "string"
                ? [item.url]
                : [];
            return {
              id: item.id,
              type: "image",
              urls,
              activeIndex: Math.max(0, Math.min(Number(item.activeIndex || 0), Math.max(0, urls.length - 1))),
              caption: typeof item.caption === "string" ? item.caption : "",
              completed: Boolean(item.completed)
            };
          }
          return null;
        })
        .filter(Boolean) as Block[];
    };

    const bootstrap = async () => {
      setEditorLoading(isEditMode);

      try {
        let hasLocalDraft = false;
        const raw = localStorage.getItem(draftStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            title?: string;
            coverImage?: string;
            blocks?: unknown[];
            status?: "draft" | "published";
            tags?: string[];
          };
          hasLocalDraft = true;

          if (!cancelled && typeof parsed.title === "string") setTitle(parsed.title);
          if (!cancelled && typeof parsed.coverImage === "string") setCoverImage(parsed.coverImage);
          if (!cancelled && (parsed.status === "draft" || parsed.status === "published")) setPostStatus(parsed.status);
          if (!cancelled && Array.isArray(parsed.tags)) {
            setPostTags(parsed.tags.filter((tag): tag is string => typeof tag === "string"));
          }
          if (!cancelled && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
            const hydrated = hydrateDraftBlocks(parsed.blocks);
            if (hydrated.length > 0) setBlocks(hydrated);
          }
        }

        if (isEditMode && editPostId && !hasLocalDraft) {
          const response = await getAdminPostById(editPostId);
          if (cancelled) return;
          const post = response.data;
          setTitle(post.title || "");
          setCoverImage(post.coverImage || "");
          setPostStatus(post.status === "draft" ? "draft" : "published");
          setPostTags(post.tags || []);
          setBlocks(htmlToBlocks(post.content || ""));
        }
      } catch (error: any) {
        if (!cancelled && isEditMode) {
          setPublishError(error?.response?.data?.message || "Failed to load post for editing.");
        }
      } finally {
        if (!cancelled) {
          draftReadyRef.current = true;
          setEditorLoading(false);
          titleInputRef.current?.focus();
        }
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [draftStorageKey, editPostId, isEditMode]);

  useEffect(() => {
    const el = titleInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 64)}px`;
  }, [title]);

  useEffect(() => {
    onDraftSaveStateChange(draftSaveState);
  }, [draftSaveState, onDraftSaveStateChange]);

  const clearSelectionUi = () => {
    setToolbar(null);
    setLinkPopover(null);
    setToolbarActive(defaultToolbarState);
    selectedRangeRef.current = null;
  };

  const blockHasContent = (block: Block) => {
    if (block.type === "image") return block.urls.length > 0 || block.caption.trim().length > 0;
    if (block.type === "code") return block.code.trim().length > 0;
    return stripHtml(block.html).length > 0;
  };

  const insertBlockAfter = (afterId: string, block: Block) => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === afterId);
      if (index === -1) return [...prev, block];
      const next = [...prev];
      next.splice(index + 1, 0, block);
      return next;
    });
  };

  const focusEditorAtEnd = (id: string) => {
    const el = editorRefs.current[id];
    if (!el) return;
    el.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const syncBlockHtml = (blockId: string) => {
    const node = editorRefs.current[blockId];
    if (!node) return;
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId && (b.type === "paragraph" || b.type === "quote")
          ? ({ ...b, html: node.innerHTML } as Block)
          : b
      )
    );
  };

  const handleAddParagraphAfter = (afterId: string) => {
    const nextId = uid();
    insertBlockAfter(afterId, { id: nextId, type: "paragraph", html: "", style: "normal" });
    setShowMenuForId(null);
    clearSelectionUi();
    setTimeout(() => {
      focusEditorAtEnd(nextId);
      setActiveBlockId(nextId);
    }, 0);
  };

  const completeCodeBlock = (codeBlockId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === codeBlockId && b.type === "code" ? { ...b, completed: true, editingAfterComplete: false } : b
      )
    );

    const currentIndex = blocks.findIndex((b) => b.id === codeBlockId);
    if (currentIndex === -1) return;

    const nextBlock = blocks[currentIndex + 1];
    if (nextBlock && nextBlock.type === "paragraph") {
      setShowMenuForId(null);
      clearSelectionUi();
      setTimeout(() => {
        focusEditorAtEnd(nextBlock.id);
        setActiveBlockId(nextBlock.id);
      }, 0);
      return;
    }

    const nextId = uid();
    insertBlockAfter(codeBlockId, { id: nextId, type: "paragraph", html: "", style: "normal" });
    setShowMenuForId(null);
    clearSelectionUi();
    setTimeout(() => {
      focusEditorAtEnd(nextId);
      setActiveBlockId(nextId);
    }, 0);
  };

  const completeImageBlock = (imageBlockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === imageBlockId && b.type === "image" ? { ...b, completed: true } : b))
    );

    const currentIndex = blocks.findIndex((b) => b.id === imageBlockId);
    if (currentIndex === -1) return;

    const nextBlock = blocks[currentIndex + 1];
    if (nextBlock && nextBlock.type === "paragraph") {
      setShowMenuForId(null);
      clearSelectionUi();
      setTimeout(() => {
        focusEditorAtEnd(nextBlock.id);
        setActiveBlockId(nextBlock.id);
      }, 0);
      return;
    }

    const nextId = uid();
    insertBlockAfter(imageBlockId, { id: nextId, type: "paragraph", html: "", style: "normal" });
    setShowMenuForId(null);
    clearSelectionUi();
    setTimeout(() => {
      focusEditorAtEnd(nextId);
      setActiveBlockId(nextId);
    }, 0);
  };

  const completeQuoteBlock = (quoteBlockId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === quoteBlockId && b.type === "quote" ? { ...b, completed: true, editingAfterComplete: false } : b
      )
    );

    const currentIndex = blocks.findIndex((b) => b.id === quoteBlockId);
    if (currentIndex === -1) return;

    const nextBlock = blocks[currentIndex + 1];
    if (nextBlock && nextBlock.type === "paragraph") {
      setShowMenuForId(null);
      clearSelectionUi();
      setTimeout(() => {
        focusEditorAtEnd(nextBlock.id);
        setActiveBlockId(nextBlock.id);
      }, 0);
      return;
    }

    const nextId = uid();
    insertBlockAfter(quoteBlockId, { id: nextId, type: "paragraph", html: "", style: "normal" });
    setShowMenuForId(null);
    clearSelectionUi();
    setTimeout(() => {
      focusEditorAtEnd(nextId);
      setActiveBlockId(nextId);
    }, 0);
  };

  const markCodeAsEditing = (codeBlockId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === codeBlockId && b.type === "code" && (b.completed || b.editingAfterComplete)
          ? { ...b, completed: false, editingAfterComplete: true }
          : b
      )
    );
  };

  const markQuoteAsEditing = (quoteBlockId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === quoteBlockId && b.type === "quote" && (b.completed || b.editingAfterComplete)
          ? { ...b, completed: false, editingAfterComplete: true }
          : b
      )
    );
  };

  const isCaretAtStart = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    return selection.isCollapsed && range.startOffset === 0;
  };

  const handleBackspaceInEmptyParagraph = (blockId: string, event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Backspace") return;
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.type !== "paragraph") return;
    if (stripHtml(block.html).length > 0) return;
    if (!isCaretAtStart()) return;

    const currentIndex = blocks.findIndex((b) => b.id === blockId);
    if (currentIndex <= 0) return;

    event.preventDefault();
    const prevEditable = [...blocks]
      .slice(0, currentIndex)
      .reverse()
      .find((b) => b.type === "paragraph" || b.type === "quote" || b.type === "code");
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    clearSelectionUi();

    if (!prevEditable) return;
    setTimeout(() => {
      focusEditorAtEnd(prevEditable.id);
      setActiveBlockId(prevEditable.id);
    }, 0);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setShowMenuForId(null);
    clearSelectionUi();
  };

  const removeCoverImage = () => {
    setCoverImage("");
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPublishError("");
    try {
      const previewUrl = await fileToDataUrl(file);
      setCoverImage(previewUrl);
    } catch {
      setPublishError("Failed to read selected cover image.");
    }
  };

  const handleInlineImagePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !pendingImageInsertAfterId) return;
    try {
      setPublishError("");
      const urls = await Promise.all(files.map((file) => fileToDataUrl(file)));
      insertBlockAfter(pendingImageInsertAfterId, {
        id: uid(),
        type: "image",
        urls,
        activeIndex: 0,
        caption: "",
        completed: false
      });
      setShowMenuForId(null);
      setPendingImageInsertAfterId(null);
      if (inlineImageInputRef.current) {
        inlineImageInputRef.current.value = "";
      }
    } catch {
      setPublishError("Failed to read selected images.");
    }
  };

  const handleSelection = (blockId: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      clearSelectionUi();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      clearSelectionUi();
      return;
    }

    const block = blocks.find((b) => b.id === blockId);
    const headingMode = block?.type === "paragraph" && (block.style === "title" || block.style === "subtitle");
    const formatValue = (document.queryCommandValue("formatBlock") || "").toString().toLowerCase().replace(/[<>]/g, "");

    selectedRangeRef.current = range.cloneRange();
    setToolbarActive({
      bold: headingMode ? false : document.queryCommandState("bold"),
      italic: headingMode ? false : document.queryCommandState("italic"),
      link: headingMode ? false : document.queryCommandState("createLink"),
      title: block?.type === "paragraph" && block.style === "title",
      subtitle: block?.type === "paragraph" && block.style === "subtitle",
      quote: formatValue === "blockquote"
    });
    setLinkPopover(null);
    setToolbar({ blockId, x: rect.left + rect.width / 2, y: rect.top - 10 });
  };

  const applyParagraphStyle = (blockId: string, style: ParagraphStyle) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId && b.type === "paragraph" ? { ...b, style } : b)));
  };

  const collapseSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const applyLink = () => {
    if (!toolbar || !selectedRangeRef.current || !linkPopover?.url.trim()) return;
    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(selectedRangeRef.current);
    const range = selection.getRangeAt(0);

    const anchor = document.createElement("a");
    const normalizedUrl = linkPopover.url.trim();
    anchor.href = normalizedUrl;
    anchor.target = "_blank";
    anchor.rel = "noreferrer noopener";
    anchor.className = "underline";
    anchor.title = normalizedUrl;

    try {
      range.surroundContents(anchor);
    } catch {
      const fragment = range.extractContents();
      anchor.appendChild(fragment);
      range.insertNode(anchor);
    }

    collapseSelection();
    clearSelectionUi();
    syncBlockHtml(toolbar.blockId);
  };

  const applyFormat = (action: FormatAction) => {
    if (!toolbar || !selectedRangeRef.current) return;
    const block = blocks.find((b) => b.id === toolbar.blockId);
    const headingMode = block?.type === "paragraph" && (block.style === "title" || block.style === "subtitle");
    if ((action === "bold" || action === "italic" || action === "link") && headingMode) return;

    if (action === "title") {
      if (block?.type !== "paragraph") return;
      const nextStyle: ParagraphStyle = block.style === "title" ? "normal" : "title";
      applyParagraphStyle(toolbar.blockId, nextStyle);
      setToolbarActive((prev) => ({
        ...prev,
        title: nextStyle === "title",
        subtitle: false,
        bold: false,
        italic: false,
        link: false
      }));
      return;
    }
    if (action === "subtitle") {
      if (block?.type !== "paragraph") return;
      const nextStyle: ParagraphStyle = block.style === "subtitle" ? "normal" : "subtitle";
      applyParagraphStyle(toolbar.blockId, nextStyle);
      setToolbarActive((prev) => ({
        ...prev,
        title: false,
        subtitle: nextStyle === "subtitle",
        bold: false,
        italic: false,
        link: false
      }));
      return;
    }
    if (action === "link") {
      setLinkPopover({ x: toolbar.x, y: toolbar.y - 48, url: "https://" });
      return;
    }

    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(selectedRangeRef.current);

    if (action === "quote") {
      const range = selection.getRangeAt(0);
      const fragment = range.extractContents();
      const quoted = document.createElement("em");
      quoted.className = "italic";
      quoted.appendChild(document.createTextNode('"'));
      quoted.appendChild(fragment);
      quoted.appendChild(document.createTextNode('"'));
      range.insertNode(quoted);
    } else {
      document.execCommand(action, false);
    }

    collapseSelection();
    clearSelectionUi();
    syncBlockHtml(toolbar.blockId);
  };

  const handleEditorInput = (blockId: string, blockType: "paragraph" | "quote", event: React.FormEvent<HTMLDivElement>) => {
    setToolbar(null);
    const editor = event.currentTarget;
    const plainText = editor.innerText ?? "";

    if (plainText.trim().length === 0) {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== blockId || b.type !== blockType) return b;
          if (b.type === "quote") {
            return {
              ...b,
              html: "",
              completed: false,
              editingAfterComplete: b.editingAfterComplete || b.completed
            };
          }
          return { ...b, html: "" };
        })
      );
      return;
    }

    if (hasMarkdownPattern(plainText)) {
      const convertedHtml = markdownToHtml(plainText);
      if (convertedHtml !== editor.innerHTML) {
        editor.innerHTML = convertedHtml;
        focusEditorAtEnd(blockId);
      }
    }

    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId || b.type !== blockType) return b;
        if (b.type === "quote") {
          return {
            ...b,
            html: editor.innerHTML,
            completed: false,
            editingAfterComplete: b.editingAfterComplete || b.completed
          };
        }
        return { ...b, html: editor.innerHTML };
      })
    );
  };

  const canPublish =
    title.trim().length > 0 &&
    blocks.some((block) => {
      if (block.type === "paragraph" || block.type === "quote") {
        return htmlToText(block.html).length > 0;
      }
      if (block.type === "code") {
        return block.code.trim().length > 0;
      }
      return block.urls.length > 0;
    });

  const buildContentHtml = useCallback((sourceBlocks: Block[]) => {
    return sourceBlocks
      .map((block) => {
        if (block.type === "paragraph") {
          const content = block.html.trim();
          if (!content) return "";
          if (block.style === "title") return `<h2>${content}</h2>`;
          if (block.style === "subtitle") return `<h3>${content}</h3>`;
          return `<p>${content}</p>`;
        }
        if (block.type === "quote") {
          const content = block.html.trim();
          if (!content) return "";
          return `<blockquote><p>${content}</p></blockquote>`;
        }
        if (block.type === "image") {
          const validUrls = block.urls.filter((url) => !isLocalMediaUrl(url));
          if (!validUrls.length) return "";
          const safeCaption = escapeHtml(block.caption || "");
          const imagesHtml = validUrls
            .map((url) => `<img src="${escapeHtml(url)}" alt="${safeCaption}" />`)
            .join("");
          return safeCaption
            ? `<figure>${imagesHtml}<figcaption>${safeCaption}</figcaption></figure>`
            : `<figure>${imagesHtml}</figure>`;
        }
        const safeCode = escapeHtml(block.code || "");
        if (!safeCode.trim()) return "";
        return `<pre><code class="language-${escapeHtml(block.language || "text")}">${safeCode}</code></pre>`;
      })
      .filter(Boolean)
      .join("\n");
  }, []);

  const uploadLocalUrlToCloudinary = async (localUrl: string, fallbackName: string) => {
    const response = await fetch(localUrl);
    if (!response.ok) {
      throw new Error("Failed to read selected image for upload.");
    }
    const blob = await response.blob();
    const mime = blob.type || "image/jpeg";
    const extension = mime.split("/")[1] || "jpg";
    const file = new File([blob], `${fallbackName}.${extension}`, { type: mime });
    const uploadResponse = await uploadAdminBlogImage(file);
    return uploadResponse.data.url;
  };

  const persistDraftLocally = useCallback(() => {
    if (!draftReadyRef.current) return;
    try {
      const snapshot = latestDraftRef.current;
      const snapshotString = JSON.stringify({
        title: snapshot.title,
        coverImage: snapshot.coverImage,
        blocks: snapshot.blocks
      });

      if (snapshotString === lastSavedSnapshotRef.current) {
        setDraftSaveState("saved");
        hasPendingDraftChangesRef.current = false;
        return;
      }

      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          title: snapshot.title,
          coverImage: snapshot.coverImage,
          blocks: snapshot.blocks,
          status: postStatus,
          tags: postTags,
          updatedAt: Date.now()
        })
      );
      lastSavedSnapshotRef.current = snapshotString;
      hasPendingDraftChangesRef.current = false;
      setDraftSaveState("saved");
    } catch {
      // Ignore storage quota failures.
    }
  }, [draftStorageKey, postStatus, postTags]);

  const runDraftSave = useCallback(() => {
    setDraftSaveState("saving");
    window.setTimeout(() => {
      persistDraftLocally();
    }, 1500);
  }, [persistDraftLocally]);

  const handlePublish = useCallback(async () => {
    if (!canPublish) return;
    setPublishError("");

    try {
      const coverImageUrl =
        coverImage && isLocalMediaUrl(coverImage)
          ? await uploadLocalUrlToCloudinary(coverImage, "cover-image")
          : coverImage || "";

      const uploadedBlocks = await Promise.all(
        blocks.map(async (block) => {
          if (block.type !== "image") return block;
          const resolvedUrls = await Promise.all(
            block.urls.map(async (url, imageIndex) => {
              if (!isLocalMediaUrl(url)) return url;
              return uploadLocalUrlToCloudinary(url, `inline-image-${block.id}-${imageIndex + 1}`);
            })
          );
          return { ...block, urls: resolvedUrls };
        })
      );

      const content = buildContentHtml(uploadedBlocks).trim();
      if (!content) {
        setPublishError("Nothing to publish yet.");
        return;
      }

      const excerptSource = uploadedBlocks
        .filter((block) => block.type === "paragraph" || block.type === "quote")
        .map((block) => htmlToText(block.html))
        .join(" ")
        .trim();

      const excerpt = excerptSource.slice(0, 220);

      if (isEditMode && editPostId) {
        await updateAdminPost(editPostId, {
          title: title.trim(),
          excerpt,
          content,
          coverImage: coverImageUrl,
          tags: postTags,
          status: postStatus
        });
        localStorage.removeItem(draftStorageKey);
        hasInitializedDraftRef.current = false;
        hasPendingDraftChangesRef.current = false;
        lastSavedSnapshotRef.current = "";
        setDraftSaveState("idle");
        navigate("/admin/blogs");
        return;
      }

      await createAdminPost({
        title: title.trim(),
        excerpt,
        content,
        coverImage: coverImageUrl,
        tags: postTags,
        status: postStatus
      });
      setPublishError("");
      setTitle("");
      setCoverImage("");
      setBlocks([{ id: uid(), type: "paragraph", html: "", style: "normal" }]);
      setActiveBlockId(null);
      setShowMenuForId(null);
      setPendingImageInsertAfterId(null);
      clearSelectionUi();
      if (coverInputRef.current) coverInputRef.current.value = "";
      localStorage.removeItem(draftStorageKey);
      hasInitializedDraftRef.current = false;
      hasPendingDraftChangesRef.current = false;
      lastSavedSnapshotRef.current = "";
      setDraftSaveState("idle");
      setTimeout(() => titleInputRef.current?.focus(), 0);
    } catch (error: any) {
      setPublishError(error?.response?.data?.message || "Failed to publish article.");
    }
  }, [
    blocks,
    buildContentHtml,
    canPublish,
    coverImage,
    draftStorageKey,
    editPostId,
    isEditMode,
    navigate,
    postStatus,
    postTags,
    title
  ]);

  useEffect(() => {
    onPublishAvailabilityChange(canPublish);
  }, [canPublish, onPublishAvailabilityChange]);

  useEffect(() => {
    onRegisterPublish(handlePublish);
  }, [handlePublish, onPublishAvailabilityChange, onRegisterPublish]);

  useEffect(() => {
    if (!draftReadyRef.current) return;
    latestDraftRef.current = { title, coverImage, blocks };
    const snapshotString = JSON.stringify({ title, coverImage, blocks });

    if (!hasInitializedDraftRef.current) {
      hasInitializedDraftRef.current = true;
      lastSavedSnapshotRef.current = snapshotString;
      hasPendingDraftChangesRef.current = false;
      return;
    }

    if (snapshotString !== lastSavedSnapshotRef.current) {
      hasPendingDraftChangesRef.current = true;
    }
  }, [title, coverImage, blocks]);

  useEffect(() => {
    if (!draftReadyRef.current) return;
    if (!hasPendingDraftChangesRef.current) return;
    const timeout = window.setTimeout(() => {
      runDraftSave();
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, [title, coverImage, blocks, runDraftSave]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!hasPendingDraftChangesRef.current) return;
      runDraftSave();
    }, 20000);
    return () => window.clearInterval(interval);
  }, [runDraftSave]);

  useEffect(() => {
    return () => {
      onRegisterPublish(null);
      onPublishAvailabilityChange(false);
      onDraftSaveStateChange("idle");
    };
  }, [onDraftSaveStateChange, onPublishAvailabilityChange, onRegisterPublish]);

  const showInitialPlaceholder =
    blocks.length === 1 &&
    blocks[0].type === "paragraph" &&
    stripHtml(blocks[0].html).length === 0;

  return (
    <main
      className={`min-h-[calc(100vh-4rem)] px-4 pt-10 pb-36 ${
        isDark
          ? "bg-[#121212]"
          : isBeige
            ? "bg-[#f8f1e3]"
            : isGray
              ? "bg-[#5a5a5c]"
              : "bg-[#FBFBFB]"
      }`}
      onMouseDown={(event) => {
        const rawTarget = event.target;
        const elementTarget =
          rawTarget instanceof Element
            ? rawTarget
            : rawTarget instanceof Node
              ? rawTarget.parentElement
              : null;
        const inside = elementTarget ? elementTarget.closest("[data-editor-block='true']") : null;
        if (!inside) {
          setActiveBlockId(null);
          setShowMenuForId(null);
          clearSelectionUi();
        }
      }}
    >
      <section className="mx-auto max-w-3xl">
        {linkPopover ? (
          <div
            data-editor-block="true"
            style={{ left: linkPopover.x, top: linkPopover.y }}
            className="fixed z-40 -translate-x-1/2 -translate-y-full rounded-full border border-slate-200 bg-white p-2 shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={linkPopover.url}
                onChange={(event) => setLinkPopover((prev) => (prev ? { ...prev, url: event.target.value } : prev))}
                placeholder="https://example.com"
                className="w-56 px-2 py-1 text-sm outline-none"
              />
              <button
                type="button"
                onClick={applyLink}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700"
                aria-label="Apply link"
                title="Apply"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setLinkPopover(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100"
                aria-label="Close link popup"
                title="Close"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ) : null}

        {toolbar ? (
          <div
            data-editor-block="true"
            style={{ left: toolbar.x, top: toolbar.y }}
            className="fixed z-30 -translate-x-1/2 -translate-y-full rounded-full border border-slate-200 bg-white px-2 py-1 shadow-lg"
          >
            <div className="flex items-center gap-1">
              <button type="button" disabled={toolbarActive.title || toolbarActive.subtitle} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat("bold")} className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-bold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 ${toolbarActive.bold ? "bg-green-100 text-green-700" : ""}`}>B</button>
              <button type="button" disabled={toolbarActive.title || toolbarActive.subtitle} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat("italic")} className={`flex h-8 w-8 items-center justify-center rounded-full text-base italic hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 ${toolbarActive.italic ? "bg-green-100 text-green-700" : ""}`}>i</button>
              <button type="button" disabled={toolbarActive.title || toolbarActive.subtitle} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat("link")} className={`flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 ${toolbarActive.link ? "bg-green-100 text-green-700" : ""}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" /><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19" /></svg>
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat("title")} className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-bold hover:bg-slate-100 ${toolbarActive.title ? "bg-green-100 text-green-700" : ""}`}>T</button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat("subtitle")} className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold hover:bg-slate-100 ${toolbarActive.subtitle ? "bg-green-100 text-green-700" : ""}`}>t</button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat("quote")} className={`flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 ${toolbarActive.quote ? "bg-green-100 text-green-700" : ""}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 11h4v4H7zM13 11h4v4h-4z" /><path d="M11 11V8a3 3 0 0 0-3-3H7M17 11V8a3 3 0 0 0-3-3h-1" /></svg>
              </button>
            </div>
          </div>
        ) : null}

        {!coverImage ? (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className={`font-jakarta mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              isDark
                ? "border-[#2a2a2a] bg-[#1a1a1a] text-[#B0B0B0] hover:bg-[#222222]"
                : isBeige
                  ? "border-[#ddd0b7] bg-[#f1e8d7] text-black hover:bg-[#eadfcb]"
                  : isGray
                    ? "border-[#7a7a7d] bg-[#6a6a6d] text-[#C9CACA] hover:bg-[#727275]"
                    : "border-[#e1e1e1] bg-[#f3f3f3] text-black hover:bg-[#ececec]"
            }`}
          >
            <span className="text-lg leading-none">+</span>
            Add cover image
          </button>
        ) : null}
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />

        {coverImage ? (
          <div className="relative mb-6">
            <img src={coverImage} alt="Cover preview" className="block h-auto max-w-full rounded-2xl shadow-sm" />
            <button
              type="button"
              onClick={removeCoverImage}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
              aria-label="Remove cover image"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m18 6-12 12M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}

        <textarea
          ref={titleInputRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title your story..."
          rows={2}
          className={`mb-8 w-full resize-none overflow-hidden border-none bg-transparent py-1 text-4xl font-bold leading-[1.25] tracking-tight outline-none ${
            isDark
              ? "text-[#B0B0B0] placeholder:text-gray-600"
              : isBeige
                ? "text-black placeholder:text-[#d4c6aa]"
                : isGray
                  ? "text-[#C9CACA] placeholder:text-[#9fa0a0]"
                  : "text-black placeholder:text-[#B3B3B1]"
          }`}
        />
        {publishError ? (
          <div className="mb-4 text-right text-xs text-red-600">{publishError}</div>
        ) : null}

        <div className="space-y-5">
          {blocks.map((block, index) => (
            <div key={block.id} className="group relative" data-editor-block="true">
              {activeBlockId === block.id && !blockHasContent(block) ? (
                <div className="absolute -left-10 top-2">
                  <button
                    type="button"
                    onClick={() => setShowMenuForId((prev) => (prev === block.id ? null : block.id))}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                  >
                    +
                  </button>

                  {showMenuForId === block.id ? (
                    <div className="absolute left-1/2 top-9 z-10 -translate-x-1/2 space-y-2 rounded-full border border-slate-200 bg-white p-2 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingImageInsertAfterId(block.id);
                          inlineImageInputRef.current?.click();
                        }}
                        className="group/icon relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-6 6-2-2-5 5" /></svg>
                        <span className="font-jakarta pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition group-hover/icon:opacity-100">Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          insertBlockAfter(block.id, {
                            id: uid(),
                            type: "quote",
                            html: "",
                            expanded: false,
                            completed: false,
                            editingAfterComplete: false
                          });
                          setShowMenuForId(null);
                        }}
                        className="group/icon relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 11h4v4H7zM13 11h4v4h-4z" /><path d="M11 11V8a3 3 0 0 0-3-3H7M17 11V8a3 3 0 0 0-3-3h-1" /></svg>
                        <span className="font-jakarta pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition group-hover/icon:opacity-100">Quote</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          insertBlockAfter(block.id, {
                            id: uid(),
                            type: "code",
                            code: "",
                            language: "Javascript",
                            expanded: false,
                            completed: false,
                            editingAfterComplete: false
                          });
                          setShowMenuForId(null);
                        }}
                        className="group/icon relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 6l-4 12" />
                        </svg>
                        <span className="font-jakarta pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition group-hover/icon:opacity-100">Code</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {block.type === "paragraph" ? (
                <div className="relative">
                  {showInitialPlaceholder && index === 0 ? (
                    <span
                      className={`pointer-events-none absolute left-0 top-2 text-lg ${
                        isBeige ? "text-[#d4c6aa]" : isDark ? "text-gray-600" : isGray ? "text-[#9fa0a0]" : "text-[#B3B3B1]"
                      }`}
                    >
                      Start writing here...
                    </span>
                  ) : null}
                  <div
                    ref={(el) => {
                      editorRefs.current[block.id] = el;
                      if (el && el.dataset.init !== "1") {
                        el.innerHTML = block.html;
                        el.dataset.init = "1";
                      }
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(event) => handleEditorInput(block.id, "paragraph", event)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleAddParagraphAfter(block.id);
                        return;
                      }
                      handleBackspaceInEmptyParagraph(block.id, event);
                    }}
                    onMouseUp={() => setTimeout(() => handleSelection(block.id), 0)}
                    onKeyUp={() => setTimeout(() => handleSelection(block.id), 0)}
                    onFocus={() => setActiveBlockId(block.id)}
                    className={`min-h-10 py-2 outline-none [&_a]:underline ${
                      block.style === "title"
                        ? isDark
                          ? "text-4xl font-bold leading-tight text-[#B0B0B0]"
                          : isBeige
                            ? "text-4xl font-bold leading-tight text-black"
                            : isGray
                              ? "text-4xl font-bold leading-tight text-[#C9CACA]"
                              : "text-4xl font-bold leading-tight text-black"
                        : block.style === "subtitle"
                          ? isDark
                            ? "text-2xl font-semibold leading-tight text-[#B0B0B0]"
                            : isBeige
                              ? "text-2xl font-semibold leading-tight text-black"
                              : isGray
                                ? "text-2xl font-semibold leading-tight text-[#C9CACA]"
                                : "text-2xl font-semibold leading-tight text-black"
                          : isDark
                            ? "text-xl leading-9 text-[#B0B0B0]"
                            : isBeige
                              ? "text-xl leading-9 text-black"
                              : isGray
                                ? "text-xl leading-9 text-[#C9CACA]"
                                : "text-xl leading-9 text-black"
                    }`}
                  />
                </div>
              ) : null}

              {block.type === "image" ? (
                <div className="relative space-y-2 rounded-xl border border-slate-200 bg-white p-3 pt-12">
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => completeImageBlock(block.id)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                        block.completed
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                      aria-label="Complete image block"
                      title="Done"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                      aria-label="Remove image block"
                      title="Remove"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m18 6-12 12M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="relative">
                    <img
                      src={block.urls[block.activeIndex] ?? block.urls[0]}
                      alt="Inserted content"
                      className="max-h-96 w-full rounded-lg object-cover"
                    />
                    {block.urls.length > 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setBlocks((prev) =>
                              prev.map((b) =>
                                b.id === block.id && b.type === "image"
                                  ? {
                                      ...b,
                                      activeIndex: (b.activeIndex - 1 + b.urls.length) % b.urls.length,
                                      completed: false
                                    }
                                  : b
                              )
                            )
                          }
                          className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/55"
                          aria-label="Previous image"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m15 18-6-6 6-6" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setBlocks((prev) =>
                              prev.map((b) =>
                                b.id === block.id && b.type === "image"
                                  ? { ...b, activeIndex: (b.activeIndex + 1) % b.urls.length, completed: false }
                                  : b
                              )
                            )
                          }
                          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/55"
                          aria-label="Next image"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      </>
                    ) : null}
                  </div>

                  {block.urls.length > 1 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {block.urls.map((url, imageIndex) => (
                        <button
                          key={`${block.id}-thumb-${imageIndex}`}
                          type="button"
                          onClick={() =>
                            setBlocks((prev) =>
                              prev.map((b) =>
                                b.id === block.id && b.type === "image" ? { ...b, activeIndex: imageIndex, completed: false } : b
                              )
                            )
                          }
                          className={`overflow-hidden rounded-md border ${
                            block.activeIndex === imageIndex ? "border-emerald-500 ring-2 ring-emerald-300" : "border-slate-300"
                          }`}
                          aria-label={`Select image ${imageIndex + 1}`}
                        >
                          <img src={url} alt={`Thumbnail ${imageIndex + 1}`} className="h-20 w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <input
                    value={block.caption}
                    onChange={(event) =>
                      setBlocks((prev) =>
                        prev.map((b) =>
                          b.id === block.id && b.type === "image" ? { ...b, caption: event.target.value, completed: false } : b
                        )
                      )
                    }
                    onFocus={() => {
                      setActiveBlockId(block.id);
                      setBlocks((prev) =>
                        prev.map((b) => (b.id === block.id && b.type === "image" ? { ...b, completed: false } : b))
                      );
                    }}
                    placeholder="Add a caption (optional)"
                    className={`w-full border-none bg-transparent text-sm outline-none ${
                      isDark ? "text-slate-300" : isBeige ? "text-black" : "text-slate-600"
                    } ${isBeige ? "placeholder:text-amber-100" : isDark ? "placeholder:text-gray-700" : "placeholder:text-[#B3B3B1]"}`}
                  />
                </div>
              ) : null}

              {block.type === "quote" ? (
                <div
                  className={`relative rounded-xl border px-4 py-3 pr-24 ${
                    isDark
                      ? "border-[#2a2a2a] bg-[#1a1a1a]"
                      : isBeige
                        ? "border-[#ddd0b7] bg-[#f1e8d7]"
                        : isGray
                          ? "border-[#7a7a7d] bg-[#6a6a6d]"
                          : "border-[#e1e1e1] bg-[#f3f3f3]"
                  }`}
                >
                  <div className="absolute right-2 top-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setBlocks((prev) =>
                          prev.map((b) =>
                            b.id === block.id && b.type === "quote" ? { ...b, expanded: !b.expanded } : b
                          )
                        )
                      }
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                        isDark
                          ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                          : isBeige
                            ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                      aria-label={block.expanded ? "Shrink quote" : "Expand quote"}
                    >
                      {block.expanded ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m6 15 6-6 6 6" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => completeQuoteBlock(block.id)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                        block.completed
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : block.editingAfterComplete
                            ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                          : isDark
                            ? "border-emerald-600 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-800/40"
                            : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                      aria-label="Complete quote"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                        isDark
                          ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                          : isBeige
                            ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m18 6-12 12M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {!stripHtml(block.html) ? (
                    <span
                      className={`pointer-events-none absolute left-4 top-3 text-lg italic ${
                        isBeige ? "text-amber-100" : isDark ? "text-gray-700" : "text-gray-300"
                      }`}
                    >
                      Write a memorable quote...
                    </span>
                  ) : null}
                  <div
                    ref={(el) => {
                      editorRefs.current[block.id] = el;
                      if (el && el.dataset.init !== "1") {
                        el.innerHTML = block.html;
                        el.dataset.init = "1";
                      }
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(event) => handleEditorInput(block.id, "quote", event)}
                    onMouseUp={() => setTimeout(() => handleSelection(block.id), 0)}
                    onKeyUp={() => setTimeout(() => handleSelection(block.id), 0)}
                    onFocus={() => {
                      setActiveBlockId(block.id);
                      markQuoteAsEditing(block.id);
                    }}
                    className={`overflow-auto text-lg italic outline-none [&_a]:underline ${
                      block.expanded ? "min-h-40" : "min-h-10"
                    } text-slate-700`}
                  />
                </div>
              ) : null}

              {block.type === "code" ? (
                <div
                  className={`relative rounded-xl border px-4 py-3 pr-24 ${
                    isDark
                      ? "border-[#2a2a2a] bg-[#1a1a1a]"
                      : isBeige
                        ? "border-[#ddd0b7] bg-[#f1e8d7]"
                        : isGray
                          ? "border-[#7a7a7d] bg-[#6a6a6d]"
                          : "border-[#e1e1e1] bg-[#f3f3f3]"
                  }`}
                >
                  <div className="absolute right-2 top-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setBlocks((prev) =>
                          prev.map((b) => (b.id === block.id && b.type === "code" ? { ...b, expanded: !b.expanded } : b))
                        )
                      }
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                        isDark
                          ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                          : isBeige
                            ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                      aria-label={block.expanded ? "Shrink code block" : "Expand code block"}
                      title={block.expanded ? "Shrink" : "Expand"}
                    >
                      {block.expanded ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m6 15 6-6 6 6" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => completeCodeBlock(block.id)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                        block.completed
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : block.editingAfterComplete
                            ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                          : isDark
                            ? "border-emerald-600 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-800/40"
                            : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                      aria-label="Complete code block"
                      title="Done"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                        isDark
                          ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                          : isBeige
                            ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                      aria-label="Remove code block"
                      title="Remove"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m18 6-12 12M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <input
                    value={block.language}
                    onChange={(event) =>
                      setBlocks((prev) =>
                        prev.map((b) => {
                          if (b.id !== block.id || b.type !== "code") return b;
                          return {
                            ...b,
                            language: event.target.value,
                            completed: false,
                            editingAfterComplete: b.editingAfterComplete || b.completed
                          };
                        })
                      )
                    }
                    onFocus={() => {
                      setActiveBlockId(block.id);
                      markCodeAsEditing(block.id);
                    }}
                    placeholder="language"
                    className={`mb-2 w-28 rounded border px-2 py-1 text-xs outline-none ${
                      isDark
                        ? "border-slate-600 bg-slate-800 text-slate-200"
                        : isBeige
                          ? "border-amber-300 bg-amber-100 text-black"
                          : "border-slate-300 bg-white text-slate-700"
                    } ${isBeige ? "placeholder:text-amber-100" : isDark ? "placeholder:text-gray-700" : "placeholder:text-[#B3B3B1]"}`}
                  />

                  <textarea
                    value={block.code}
                    onChange={(event) =>
                      setBlocks((prev) =>
                        prev.map((b) => {
                          if (b.id !== block.id || b.type !== "code") return b;
                          return {
                            ...b,
                            code: event.target.value,
                            completed: false,
                            editingAfterComplete: b.editingAfterComplete || b.completed
                          };
                        })
                      )
                    }
                    onFocus={() => {
                      setActiveBlockId(block.id);
                      markCodeAsEditing(block.id);
                    }}
                    placeholder={"Write code here...\nconst example = true;"}
                    rows={5}
                    className={`w-full resize-none overflow-auto rounded border p-3 font-mono text-sm outline-none ${
                      block.expanded ? "h-96" : "h-32"
                    } ${
                      isDark
                        ? "border-slate-700 bg-slate-950 text-slate-100"
                        : isBeige
                          ? "border-amber-300 bg-amber-50 text-black"
                          : "border-slate-300 bg-white text-slate-900"
                    } ${isBeige ? "placeholder:text-amber-100" : isDark ? "placeholder:text-gray-700" : "placeholder:text-[#B3B3B1]"}`}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="h-40" />

        <input ref={inlineImageInputRef} type="file" accept="image/*" multiple onChange={handleInlineImagePick} className="hidden" />
      </section>
    </main>
  );
};

export default WritePage;
