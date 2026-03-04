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
};

export type PublishedPostsResponse = {
  items: PostResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

export const getPublishedPostBySlug = (slug: string) => {
  return http.get<PostResponse>(`/api/blog/posts/${slug}`);
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
