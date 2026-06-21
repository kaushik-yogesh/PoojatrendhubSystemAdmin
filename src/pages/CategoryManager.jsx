import React, { useState, useEffect } from "react";
import { fetchDataFromApi, postData, deleteData, putData } from "../utils/api";
import axios from "axios";
import { MdOutlineChevronRight, MdOutlineExpandMore, MdOutlineAdd, MdOutlineEdit, MdOutlineDelete, MdOutlineFolder } from "react-icons/md";

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState({});

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [formId, setFormId] = useState("");
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [parentId, setParentId] = useState("");
  const [parentCatName, setParentCatName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [commissionRate, setCommissionRate] = useState(5);
  const [redirectLink, setRedirectLink] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    const res = await fetchDataFromApi("/api/category");
    if (!res.error && res.data) {
      setCategories(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleOpenAddModal = (pId = "", pName = "") => {
    setIsEditing(false);
    setFormId("");
    setName("");
    setImageFile(null);
    setImageUrl("");
    setParentId(pId);
    setParentCatName(pName);
    setSortOrder(0);
    setCommissionRate(5);
    setRedirectLink("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setIsEditing(true);
    setFormId(cat._id);
    setName(cat.name);
    setImageFile(null);
    setImageUrl(cat.images?.[0] || "");
    setParentId(cat.parentId || "");
    setParentCatName(cat.parentCatName || "");
    setSortOrder(cat.sortOrder ?? 0);
    setCommissionRate(cat.commissionRate || 5);
    setRedirectLink(cat.redirectLink || "");
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmation = window.confirm("Are you sure you want to delete this category? This will delete all its nested subcategories recursively!");
    if (!confirmation) return;

    const res = await deleteData(`/api/category/${id}`);
    if (!res.error) {
      alert(res.message);
      loadCategories();
    } else {
      alert("Failed to delete category");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    let finalImages = imageUrl ? [imageUrl] : [];

    // Process image file upload if exists
    if (imageFile) {
      const formData = new FormData();
      formData.append("images", imageFile);

      try {
        const token = localStorage.getItem("accessToken");
        const uploadRes = await axios.put(
          (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/category/uploadImages",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (uploadRes.data && uploadRes.data.success) {
          finalImages = uploadRes.data.images;
        }
      } catch (err) {
        console.error("Image upload failure:", err);
      }
    }

    const payload = {
      name,
      images: finalImages,
      parentId: parentId || undefined,
      parentCatName: parentCatName || undefined,
      sortOrder: Number(sortOrder) || 0,
      commissionRate: Number(commissionRate) || 5,
      redirectLink: redirectLink || ""
    };

    let res;
    if (isEditing) {
      res = await putData(`/api/category/${formId}`, payload);
    } else {
      res = await postData("/api/category/createCategory", payload);
    }

    if (res && !res.error) {
      alert(isEditing ? "Category updated" : "Category created");
      setModalOpen(false);
      loadCategories();
    } else {
      alert(res?.message || "Operation failed");
    }
    setSubmitting(false);
  };

  // Recursive Tree Node renderer
  const renderTreeNode = (node) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node._id];

    return (
      <div key={node._id} className="flex flex-col ml-6 pl-2 border-l border-slate-800/40">
        <div className="flex items-center justify-between py-2.5 px-4 hover:bg-slate-800/10 rounded-xl transition-all duration-200">
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button onClick={() => toggleNode(node._id)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                {isExpanded ? <MdOutlineExpandMore size={18} /> : <MdOutlineChevronRight size={18} />}
              </button>
            ) : (
              <div className="w-[18px]"></div>
            )}
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 overflow-hidden flex items-center justify-center text-slate-500 shrink-0">
              {node.images?.[0] ? (
                <img src={node.images[0]} className="w-full h-full object-cover" alt="" />
              ) : (
                <MdOutlineFolder size={18} />
              )}
            </div>
            <span className="text-xs font-semibold text-slate-200">
              {node.name} 
              <span className="text-[10px] ml-2 text-slate-400">#{node.sortOrder ?? 0}</span>
              <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-violet-600/20 text-violet-400 rounded-md font-bold">{node.commissionRate || 5}% Fee</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleOpenAddModal(node._id, node.name)}
              title="Add Subcategory"
              className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-all border border-slate-700/30"
            >
              <MdOutlineAdd size={15} />
            </button>
            <button
              onClick={() => handleOpenEditModal(node)}
              title="Edit Category"
              className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-all border border-slate-700/30"
            >
              <MdOutlineEdit size={15} />
            </button>
            <button
              onClick={() => handleDelete(node._id)}
              title="Delete Category"
              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 flex items-center justify-center cursor-pointer transition-all border border-red-500/10"
            >
              <MdOutlineDelete size={15} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col mt-1">
            {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 leading-none mb-1.5">Category Tree</h1>
          <p className="text-xs text-slate-400">Manage hierarchical store categories (up to 3 levels deep).</p>
        </div>
        <button
          onClick={() => handleOpenAddModal("", "")}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-violet-500/10 active:scale-[0.98] cursor-pointer"
        >
          <MdOutlineAdd size={16} />
          Create Root Category
        </button>
      </div>

      {/* Categories Tree view */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/50 min-h-[400px]">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading categories tree...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No categories created yet. Click above to add one.</div>
        ) : (
          <div className="flex flex-col gap-1 -ml-6">
            {categories.map((cat) => renderTreeNode(cat))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleFormSubmit}
            className="w-full max-w-[480px] bg-[#11131c] border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-fade-in"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-100 text-base">
                  {isEditing ? "Modify Category" : "Create New Category"}
                </h3>
                {parentCatName && (
                  <span className="text-[10px] text-violet-400 font-semibold tracking-wider uppercase">
                    Parent: {parentCatName}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-850 hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full h-11 px-4 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                  placeholder="e.g. Fashion, Groceries, Mobiles"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full h-11 px-4 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                  placeholder="Enter display position (0 = first)"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full h-11 px-4 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                  placeholder="Enter platform fee percentage (e.g. 5)"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                  Redirect Link (Optional)
                </label>
                <input
                  type="text"
                  className="w-full h-11 px-4 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                  placeholder="e.g. /grocery or external URL"
                  value={redirectLink}
                  onChange={(e) => setRedirectLink(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                  Image URL (Option 1)
                </label>
                <input
                  type="text"
                  className="w-full h-11 px-4 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                  placeholder="Paste direct link to image..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                  Upload Image File (Option 2)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-600/10 file:text-violet-400 hover:file:bg-violet-600/20 file:cursor-pointer"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-violet-500/10 active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Processing..." : isEditing ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
