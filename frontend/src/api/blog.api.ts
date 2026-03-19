import { http } from "./http";

export type CreatePostPayload = {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  status: "draft" | "published";
};

export type PostResponse = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  comments: {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
    likeCount?: number;
    replyCount?: number;
    replies?: {
      id: string;
      userId: string;
      userName: string;
      text: string;
      createdAt: string;
    }[];
  }[];
  likeCount: number;
  saveCount: number;
  commentCount: number;
};

export type PostEngagementResponse = {
  liked: boolean;
  saved: boolean;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  comments: {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
    likeCount?: number;
    replyCount?: number;
    replies?: {
      id: string;
      userId: string;
      userName: string;
      text: string;
      createdAt: string;
    }[];
  }[];
};

export type PublishedPostsResponse = {
  items: PostResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SavedPostsResponse = {
  items: PostResponse[];
};

export type ExplainSelectionPayload = {
  postId: string;
  postTitle: string;
  selectedText: string;
  context?: string;
  action?: "explain" | "simplify" | "example";
};

export type ExplainSelectionResponse = {
  answer: string;
  action: "explain" | "simplify" | "example";
  selectedText: string;
};

export const createAdminPost = (payload: CreatePostPayload) => {
  return http.post<PostResponse>("/api/admin/blog/posts", payload);
};

export type UpdatePostPayload = Partial<CreatePostPayload>;

export const listAdminPosts = (params?: { page?: number; limit?: number; status?: "draft" | "published"; q?: string }) => {
  return http.get<PublishedPostsResponse>("/api/admin/blog/posts", { params });
};

export const updateAdminPost = (id: string, payload: UpdatePostPayload) => {
  return http.patch<PostResponse>(`/api/admin/blog/posts/${id}`, payload);
};

export const getAdminPostById = (id: string) => {
  return http.get<PostResponse>(`/api/admin/blog/posts/${id}`);
};

export const deleteAdminPost = (id: string) => {
  return http.delete(`/api/admin/blog/posts/${id}`);
};

export const listPublishedPosts = (params?: { page?: number; limit?: number }) => {
  return http.get<PublishedPostsResponse>("/api/blog/posts", { params });
};

export const listSavedPosts = () => {
  return http.get<SavedPostsResponse>("/api/blog/saved-posts");
};

export const explainArticleSelection = (payload: ExplainSelectionPayload) => {
  return http.post<ExplainSelectionResponse>("/api/blog/ai/explain", payload);
};

export const getPublishedPostBySlug = (slug: string) => {
  return http.get<PostResponse>(`/api/blog/posts/${slug}`);
};

export const getPostEngagement = (id: string) => {
  return http.get<PostEngagementResponse>(`/api/blog/posts/${id}/engagement`);
};

export const togglePostLike = (id: string) => {
  return http.post<{ liked: boolean; likeCount: number }>(`/api/blog/posts/${id}/like`);
};

export const togglePostSave = (id: string) => {
  return http.post<{ saved: boolean; saveCount: number }>(`/api/blog/posts/${id}/save`);
};

export const addPostComment = (id: string, payload: { text: string }) => {
  return http.post<{ comments: PostEngagementResponse["comments"]; commentCount: number }>(`/api/blog/posts/${id}/comments`, payload);
};

export const updatePostComment = (id: string, commentId: string, payload: { text: string }) => {
  return http.patch<{ comments: PostEngagementResponse["comments"]; commentCount: number }>(`/api/blog/posts/${id}/comments/${commentId}`, payload);
};

export const deletePostComment = (id: string, commentId: string) => {
  return http.delete<{ comments: PostEngagementResponse["comments"]; commentCount: number }>(`/api/blog/posts/${id}/comments/${commentId}`);
};

export const toggleCommentLike = (id: string, commentId: string) => {
  return http.post<{ comments: PostEngagementResponse["comments"]; commentCount: number }>(`/api/blog/posts/${id}/comments/${commentId}/like`);
};

export const addCommentReply = (id: string, commentId: string, payload: { text: string }) => {
  return http.post<{ comments: PostEngagementResponse["comments"]; commentCount: number }>(`/api/blog/posts/${id}/comments/${commentId}/replies`, payload);
};

export type UploadImageResponse = {
  url: string;
  publicId: string;
};

export const uploadAdminBlogImage = (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  return http.post<UploadImageResponse>("/api/admin/blog/uploads/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};
