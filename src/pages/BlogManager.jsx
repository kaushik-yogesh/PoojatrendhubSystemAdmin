import React, { useState, useEffect, useCallback } from "react";
import { fetchDataFromApi, postData, putData, deleteData } from "../utils/api";
import {
  MdOutlineAdd,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineSearch,
  MdOutlineRefresh,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
  MdOutlineLabel,
  MdOutlineImage
} from "react-icons/md";

const STATUS_BADGE = {
  published: "badge-green",
  draft: "badge-amber",
  archived: "badge-slate"
};

const emptyForm = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  coverImage: "",
  tags: "",
  category: "",
  status: "draft",
  metaTitle: "",
  metaDescription: ""
};

const BlogManager = () => {
  const [blogs, setBlogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editBlog, setEditBlog] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("content"); // content | seo
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    const res = await fetchDataFromApi("/api/blogs/admin/all");
    if (!res.error && (res.blogs || res.data)) {
      setBlogs(res.blogs || res.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  useEffect(() => {
    let result = [...blogs];
    if (statusFilter !== "ALL") result = result.filter((b) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q) ||
          b.tags?.join(" ").toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [blogs, search, statusFilter]);

  const openCreate = () => {
    setEditBlog(null);
    setForm(emptyForm);
    setActiveTab("content");
    setShowForm(true);
  };

  const openEdit = (blog) => {
    setEditBlog(blog);
    setForm({
      title: blog.title || "",
      slug: blog.slug || "",
      content: blog.content || "",
      excerpt: blog.excerpt || "",
      coverImage: blog.coverImage || "",
      tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : blog.tags || "",
      category: blog.category || "",
      status: blog.status || "draft",
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || ""
    });
    setActiveTab("content");
    setShowForm(true);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Auto-generate slug from title
    if (field === "title" && !editBlog) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setForm((prev) => ({ ...prev, title: value, slug }));
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("Blog title is required.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean)
    };

    let res;
    if (editBlog) {
      res = await putData(`/api/blogs/${editBlog._id}`, payload);
    } else {
      res = await postData("/api/blogs/create", payload);
    }

    if (!res.error) {
      await fetchBlogs();
      setShowForm(false);
    } else {
      alert(res.message || "Failed to save blog.");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const res = await deleteData(`/api/blogs/${id}`);
    if (!res.error) {
      setBlogs((prev) => prev.filter((b) => b._id !== id));
      setDeleteConfirm(null);
    } else {
      alert("Failed to delete blog.");
    }
  };

  const togglePublish = async (blog) => {
    const newStatus = blog.status === "published" ? "draft" : "published";
    const res = await putData(`/api/blogs/${blog._id}`, { status: newStatus });
    if (!res.error) {
      setBlogs((prev) => prev.map((b) => b._id === blog._id ? { ...b, status: newStatus } : b));
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Blogs & CMS</h1>
          <p className="page-subtitle">Create, edit, and manage blog posts with SEO metadata control.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchBlogs} className="btn-ghost">
            <MdOutlineRefresh size={16} /> Refresh
          </button>
          <button onClick={openCreate} className="btn-primary">
            <MdOutlineAdd size={16} /> New Post
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Posts", value: blogs.length, color: "text-violet-400" },
          { label: "Published", value: blogs.filter((b) => b.status === "published").length, color: "text-green-400" },
          { label: "Drafts", value: blogs.filter((b) => b.status === "draft").length, color: "text-amber-400" }
        ].map((s, idx) => (
          <div key={idx} className="glass-panel glow-card p-4 rounded-2xl text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/30 p-4 border border-slate-800/40 rounded-2xl">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            className="admin-input !pl-9 !h-9 text-xs"
            placeholder="Search title, category, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          {["ALL", "published", "draft", "archived"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all capitalize ${
                statusFilter === s
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} posts</span>
      </div>

      {/* Blog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 h-[220px] skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl flex items-center justify-center py-20 border border-slate-800/40">
          <div className="text-center">
            <MdOutlineLabel size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No blog posts found.</p>
            <button onClick={openCreate} className="btn-primary mt-4 mx-auto">
              <MdOutlineAdd size={14} /> Create First Post
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((blog) => (
            <div
              key={blog._id}
              className="glass-panel glow-card rounded-2xl overflow-hidden border border-slate-800/40 flex flex-col group"
            >
              {/* Cover Image */}
              <div className="h-36 bg-slate-900/50 relative overflow-hidden">
                {blog.coverImage ? (
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MdOutlineImage size={36} className="text-slate-700" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`badge ${STATUS_BADGE[blog.status] || "badge-slate"}`}>
                    {blog.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 className="text-sm font-bold text-slate-100 leading-snug line-clamp-2">{blog.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{blog.excerpt}</p>

                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.isArray(blog.tags) && blog.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="badge badge-slate">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex items-center gap-2">
                <button
                  onClick={() => togglePublish(blog)}
                  title={blog.status === "published" ? "Unpublish" : "Publish"}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border transition-all text-xs ${
                    blog.status === "published"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                      : "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                  }`}
                >
                  {blog.status === "published" ? <MdOutlineVisibilityOff size={15} /> : <MdOutlineVisibility size={15} />}
                </button>
                <button
                  onClick={() => openEdit(blog)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 flex items-center justify-center cursor-pointer transition-all"
                >
                  <MdOutlineEdit size={15} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(blog._id)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex items-center justify-center cursor-pointer transition-all"
                >
                  <MdOutlineDelete size={15} />
                </button>
                <span className="ml-auto text-[10px] text-slate-600">
                  {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Blog Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div
            className="modal-box"
            style={{ maxWidth: "760px", width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {editBlog ? "Edit Blog Post" : "Create New Blog Post"}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {editBlog ? `Editing: ${editBlog.title}` : "Fill in the content and SEO details."}
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-700/60 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl mb-6 border border-slate-800/40 w-fit">
              {["content", "seo"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all ${
                    activeTab === tab
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {tab === "seo" ? "SEO Metadata" : "Content"}
                </button>
              ))}
            </div>

            {/* Content Tab */}
            {activeTab === "content" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Title *</label>
                    <input
                      className="admin-input"
                      placeholder="Blog post title..."
                      value={form.title}
                      onChange={(e) => handleFormChange("title", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Slug</label>
                    <input
                      className="admin-input font-mono text-xs"
                      placeholder="auto-generated-slug"
                      value={form.slug}
                      onChange={(e) => handleFormChange("slug", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Category</label>
                    <input
                      className="admin-input"
                      placeholder="e.g. Fashion, Lifestyle..."
                      value={form.category}
                      onChange={(e) => handleFormChange("category", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Status</label>
                    <select
                      className="admin-select w-full"
                      value={form.status}
                      onChange={(e) => handleFormChange("status", e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Cover Image URL</label>
                  <input
                    className="admin-input"
                    placeholder="https://..."
                    value={form.coverImage}
                    onChange={(e) => handleFormChange("coverImage", e.target.value)}
                  />
                  {form.coverImage && (
                    <img src={form.coverImage} alt="cover preview" className="mt-1 h-20 w-full object-cover rounded-xl border border-slate-800" />
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Excerpt</label>
                  <textarea
                    className="admin-textarea"
                    rows={2}
                    placeholder="Short summary of the post (shown on listing pages)..."
                    value={form.excerpt}
                    onChange={(e) => handleFormChange("excerpt", e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Content (Markdown / HTML)</label>
                  <textarea
                    className="admin-textarea font-mono text-xs"
                    rows={10}
                    placeholder="Write your blog post content here..."
                    value={form.content}
                    onChange={(e) => handleFormChange("content", e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Tags (comma-separated)</label>
                  <input
                    className="admin-input"
                    placeholder="fashion, trending, style..."
                    value={form.tags}
                    onChange={(e) => handleFormChange("tags", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <div className="flex flex-col gap-4">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300/80">
                  💡 SEO metadata helps search engines understand your content. Fill in both fields to maximize discoverability.
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-1">
                    Meta Title <span className="text-slate-600 normal-case ml-1">({form.metaTitle.length}/60)</span>
                  </label>
                  <input
                    className="admin-input"
                    placeholder="SEO page title (keep under 60 chars)..."
                    value={form.metaTitle}
                    onChange={(e) => handleFormChange("metaTitle", e.target.value)}
                    maxLength={60}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-1">
                    Meta Description <span className="text-slate-600 normal-case ml-1">({form.metaDescription.length}/160)</span>
                  </label>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    placeholder="SEO description (keep under 160 chars)..."
                    value={form.metaDescription}
                    onChange={(e) => handleFormChange("metaDescription", e.target.value)}
                    maxLength={160}
                  />
                </div>

                {/* SEO Preview */}
                <div className="bg-slate-900/60 p-4 border border-slate-800/40 rounded-xl">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Google Preview</p>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[13px] font-medium text-blue-400 line-clamp-1">
                      {form.metaTitle || form.title || "Page Title"}
                    </p>
                    <p className="text-[11px] text-green-600">https://poojatrendhub.com/blog/{form.slug || "post-slug"}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                      {form.metaDescription || form.excerpt || "Page description will appear here..."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-800/40">
              <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? "Saving..." : editBlog ? "Update Post" : "Publish Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box max-w-[400px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-100 mb-2">Delete Blog Post?</h3>
            <p className="text-sm text-slate-400 mb-6">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManager;
