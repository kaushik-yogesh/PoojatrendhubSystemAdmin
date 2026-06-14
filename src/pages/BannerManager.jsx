import React, { useState, useEffect, useCallback } from "react";
import { fetchDataFromApi, postData, putData, deleteData } from "../utils/api";
import axios from "axios";
import {
  MdOutlineAdd,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineSearch,
  MdOutlineRefresh,
  MdOutlineImage,
  MdOutlineCategory,
  MdOutlineLocalOffer,
  MdOutlineViewCarousel,
  MdOutlinePhotoLibrary
} from "react-icons/md";

const emptyBannerForm = {
  bannerTitle: "",
  price: "",
  imageUrl: "", // custom URL field for input
  catId: "",
  category: "",
  subCatId: "",
  subCat: "",
  thirdSubCatId: "",
  thirdSubCat: ""
};

const emptySlideForm = {
  imageUrl: "" // custom URL field for input
};

const BannerManager = () => {
  const [activeTab, setActiveTab] = useState("banners"); // banners | slides
  const [banners, setBanners] = useState([]);
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredBanners, setFilteredBanners] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals state
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [editBannerId, setEditBannerId] = useState(null);
  const [editSlideId, setEditSlideId] = useState(null);
  
  // Forms state
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);
  const [slideForm, setSlideForm] = useState(emptySlideForm);
  const [imageFile, setImageFile] = useState(null);
  
  // Cascade Category dropdown selection states
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedSubCat, setSelectedSubCat] = useState(null);

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'banner'|'slide', id: string }

  // Load Categories tree helper
  const loadCategories = async () => {
    const res = await fetchDataFromApi("/api/category");
    if (!res.error && res.data) {
      setCategories(res.data);
    }
  };

  // Load Banners from API
  const loadBanners = async () => {
    const res = await fetchDataFromApi("/api/banners");
    if (!res.error && res.data) {
      setBanners(res.data);
    }
  };

  // Load Slides from API
  const loadSlides = async () => {
    const res = await fetchDataFromApi("/api/homeSlides");
    if (!res.error && res.data) {
      setSlides(res.data);
    }
  };

  const initData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadCategories(), loadBanners(), loadSlides()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  // Search filter for promotional banners
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBanners(banners);
      return;
    }
    const q = searchQuery.toLowerCase();
    const result = banners.filter(
      (b) =>
        b.bannerTitle?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        b.subCat?.toLowerCase().includes(q) ||
        b.thirdSubCat?.toLowerCase().includes(q)
    );
    setFilteredBanners(result);
  }, [banners, searchQuery]);

  // Banners Cascade Select Handler: Root Category
  const handleCatChange = (catId) => {
    if (!catId) {
      setSelectedCat(null);
      setSelectedSubCat(null);
      setBannerForm((prev) => ({
        ...prev,
        catId: "",
        category: "",
        subCatId: "",
        subCat: "",
        thirdSubCatId: "",
        thirdSubCat: ""
      }));
      return;
    }
    const cat = categories.find((c) => c._id === catId);
    setSelectedCat(cat);
    setSelectedSubCat(null);
    setBannerForm((prev) => ({
      ...prev,
      catId: cat._id,
      category: cat.name,
      subCatId: "",
      subCat: "",
      thirdSubCatId: "",
      thirdSubCat: ""
    }));
  };

  // Banners Cascade Select Handler: Sub Category
  const handleSubCatChange = (subCatId) => {
    if (!subCatId) {
      setSelectedSubCat(null);
      setBannerForm((prev) => ({
        ...prev,
        subCatId: "",
        subCat: "",
        thirdSubCatId: "",
        thirdSubCat: ""
      }));
      return;
    }
    const subcat = selectedCat?.children?.find((c) => c._id === subCatId);
    setSelectedSubCat(subcat);
    setBannerForm((prev) => ({
      ...prev,
      subCatId: subcat._id,
      subCat: subcat.name,
      thirdSubCatId: "",
      thirdSubCat: ""
    }));
  };

  // Banners Cascade Select Handler: Third Sub Category (Leaf)
  const handleThirdSubCatChange = (thirdSubCatId) => {
    if (!thirdSubCatId) {
      setBannerForm((prev) => ({
        ...prev,
        thirdSubCatId: "",
        thirdSubCat: ""
      }));
      return;
    }
    const thirdsub = selectedSubCat?.children?.find((c) => c._id === thirdSubCatId);
    setBannerForm((prev) => ({
      ...prev,
      thirdSubCatId: thirdsub._id,
      thirdSubCat: thirdsub.name
    }));
  };

  // Open modals to create
  const openCreateBanner = () => {
    setEditBannerId(null);
    setBannerForm(emptyBannerForm);
    setImageFile(null);
    setSelectedCat(null);
    setSelectedSubCat(null);
    setBannerModalOpen(true);
  };

  const openCreateSlide = () => {
    setEditSlideId(null);
    setSlideForm(emptySlideForm);
    setImageFile(null);
    setSlideModalOpen(true);
  };

  // Open modals to edit
  const openEditBanner = (banner) => {
    setEditBannerId(banner._id);
    setBannerForm({
      bannerTitle: banner.bannerTitle || "",
      price: banner.price !== undefined ? banner.price : "",
      imageUrl: banner.images?.[0] || "",
      catId: banner.catId || "",
      category: banner.category || "",
      subCatId: banner.subCatId || "",
      subCat: banner.subCat || "",
      thirdSubCatId: banner.thirdSubCatId || "",
      thirdSubCat: banner.thirdSubCat || ""
    });
    setImageFile(null);

    // Initialize category cascade selections
    if (banner.catId) {
      const cat = categories.find((c) => c._id === banner.catId);
      setSelectedCat(cat || null);
      if (cat && banner.subCatId) {
        const subcat = cat.children?.find((c) => c._id === banner.subCatId);
        setSelectedSubCat(subcat || null);
      } else {
        setSelectedSubCat(null);
      }
    } else {
      setSelectedCat(null);
      setSelectedSubCat(null);
    }

    setBannerModalOpen(true);
  };

  const openEditSlide = (slide) => {
    setEditSlideId(slide._id);
    setSlideForm({
      imageUrl: slide.images?.[0] || ""
    });
    setImageFile(null);
    setSlideModalOpen(true);
  };

  // File Upload Helper
  const uploadImageFile = async (uploadEndpoint) => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("images", imageFile);

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(
        (import.meta.env.VITE_API_URL || "http://localhost:8000") + uploadEndpoint,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data && res.data.success && res.data.images?.length > 0) {
        return res.data.images; // array of urls
      }
    } catch (err) {
      console.error("Image upload failure:", err);
    }
    return null;
  };

  // Submit banner form
  const handleBannerSave = async (e) => {
    e.preventDefault();
    if (!bannerForm.bannerTitle.trim()) {
      alert("Banner Title is required.");
      return;
    }

    setSaving(true);
    let finalImages = bannerForm.imageUrl ? [bannerForm.imageUrl] : [];

    // If file is selected, upload it first
    if (imageFile) {
      const uploadedUrls = await uploadImageFile("/api/banners/uploadImages");
      if (uploadedUrls) {
        finalImages = uploadedUrls;
      } else {
        alert("Failed to upload image file. Proceeding with previous URL if any.");
      }
    }

    if (finalImages.length === 0) {
      alert("Please upload an image file or provide an Image URL.");
      setSaving(false);
      return;
    }

    const payload = {
      bannerTitle: bannerForm.bannerTitle,
      price: Number(bannerForm.price) || 0,
      images: finalImages,
      catId: bannerForm.catId,
      category: bannerForm.category,
      subCatId: bannerForm.subCatId,
      subCat: bannerForm.subCat,
      thirdSubCatId: bannerForm.thirdSubCatId,
      thirdSubCat: bannerForm.thirdSubCat
    };

    let res;
    if (editBannerId) {
      res = await putData(`/api/banners/${editBannerId}`, payload);
    } else {
      res = await postData("/api/banners/addBanner", payload);
    }

    if (res && !res.error) {
      alert(editBannerId ? "Banner updated successfully!" : "Banner added successfully!");
      setBannerModalOpen(false);
      await loadBanners();
    } else {
      alert(res?.message || "Operation failed.");
    }
    setSaving(false);
  };

  // Submit home slide form
  const handleSlideSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    let finalImages = slideForm.imageUrl ? [slideForm.imageUrl] : [];

    // If file is selected, upload it first
    if (imageFile) {
      const uploadedUrls = await uploadImageFile("/api/homeSlides/uploadImages");
      if (uploadedUrls) {
        finalImages = uploadedUrls;
      } else {
        alert("Failed to upload image file. Proceeding with previous URL if any.");
      }
    }

    if (finalImages.length === 0) {
      alert("Please upload an image file or provide an Image URL.");
      setSaving(false);
      return;
    }

    const payload = {
      images: finalImages
    };

    let res;
    if (editSlideId) {
      res = await putData(`/api/homeSlides/${editSlideId}`, payload);
    } else {
      res = await postData("/api/homeSlides/add", payload);
    }

    if (res && !res.error) {
      alert(editSlideId ? "Slide updated successfully!" : "Slide added successfully!");
      setSlideModalOpen(false);
      await loadSlides();
    } else {
      alert(res?.message || "Operation failed.");
    }
    setSaving(false);
  };

  // Delete Action handler
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;

    let res;
    if (type === "banner") {
      res = await deleteData(`/api/banners/${id}`);
      if (res && !res.error) {
        setBanners((prev) => prev.filter((b) => b._id !== id));
      } else {
        alert("Failed to delete banner.");
      }
    } else if (type === "slide") {
      res = await deleteData(`/api/homeSlides/${id}`);
      if (res && !res.error) {
        setSlides((prev) => prev.filter((s) => s._id !== id));
      } else {
        alert("Failed to delete slide.");
      }
    }

    setDeleteConfirm(null);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-none mb-1.5">Banners & Slideshow</h1>
          <p className="text-xs text-slate-400">
            Manage promotional media banners and home slider slideshow graphics displayed across the website.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={initData} className="btn-ghost flex items-center gap-1.5 text-xs h-10 px-4">
            <MdOutlineRefresh size={16} /> Refresh
          </button>
          {activeTab === "banners" ? (
            <button onClick={openCreateBanner} className="btn-primary flex items-center gap-1.5 text-xs h-10 px-4">
              <MdOutlineAdd size={16} /> New Banner
            </button>
          ) : (
            <button onClick={openCreateSlide} className="btn-primary flex items-center gap-1.5 text-xs h-10 px-4">
              <MdOutlineAdd size={16} /> New Slide
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800/60 w-fit">
        <button
          onClick={() => setActiveTab("banners")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === "banners"
              ? "bg-violet-650 text-white shadow-md shadow-violet-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MdOutlinePhotoLibrary size={16} />
          Promotional Banners ({banners.length})
        </button>
        <button
          onClick={() => setActiveTab("slides")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === "slides"
              ? "bg-violet-650 text-white shadow-md shadow-violet-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MdOutlineViewCarousel size={16} />
          Home Carousel Slides ({slides.length})
        </button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl text-center border border-slate-800/40">
          <p className="text-2xl font-bold text-violet-400">{banners.length}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">Total Promo Banners</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center border border-slate-800/40">
          <p className="text-2xl font-bold text-green-400">{slides.length}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">Active Homepage Slides</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center border border-slate-800/40">
          <p className="text-2xl font-bold text-blue-400">
            {banners.filter((b) => b.category).length}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">Category Linked Banners</p>
        </div>
      </div>

      {/* Main Panel Content */}
      {activeTab === "banners" ? (
        <div className="flex flex-col gap-4">
          {/* Banners search & filter */}
          <div className="flex items-center gap-3 bg-slate-900/20 p-4 border border-slate-800/40 rounded-2xl">
            <div className="relative flex-1 max-w-[320px]">
              <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                className="admin-input !pl-9 !h-9 text-xs"
                placeholder="Search banners by title or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Banners Grid list */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel h-60 rounded-2xl skeleton" />
              ))}
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="glass-panel rounded-2xl flex flex-col items-center justify-center py-24 border border-slate-800/40">
              <MdOutlinePhotoLibrary size={48} className="text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">No promotional banners found.</p>
              <button onClick={openCreateBanner} className="btn-primary mt-4 text-xs">
                <MdOutlineAdd size={14} /> Add Your First Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBanners.map((banner) => (
                <div
                  key={banner._id}
                  className="glass-panel rounded-2xl overflow-hidden border border-slate-800/40 flex flex-col group hover:border-slate-750/70 transition-all duration-300 shadow-xl shadow-black/10"
                >
                  {/* Banner Image Preview */}
                  <div className="h-40 bg-slate-950/40 relative overflow-hidden flex items-center justify-center border-b border-slate-800/40">
                    {banner.images?.[0] ? (
                      <img
                        src={banner.images[0]}
                        alt={banner.bannerTitle}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <MdOutlineImage size={40} className="text-slate-700" />
                    )}
                    
                    {banner.price > 0 && (
                      <div className="absolute bottom-3 left-3 bg-slate-900/95 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1 text-green-400 text-[10px] font-bold shadow-lg backdrop-blur-md">
                        <MdOutlineLocalOffer size={11} />
                        ₹{banner.price}
                      </div>
                    )}
                  </div>

                  {/* Banner Details */}
                  <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-xs font-bold line-clamp-1 text-slate-100">{banner.bannerTitle}</h3>
                      
                      {/* Hierarchical category breadcrumb */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MdOutlineCategory size={11} className="shrink-0" /> Link Target:
                        </span>
                        {banner.category ? (
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="px-2 py-0.5 rounded bg-violet-650/10 border border-violet-500/10 text-violet-400 text-[9px] font-semibold">
                              {banner.category}
                            </span>
                            {banner.subCat && (
                              <>
                                <span className="text-slate-600 text-[8px]">➔</span>
                                <span className="px-2 py-0.5 rounded bg-indigo-650/10 border border-indigo-500/10 text-indigo-400 text-[9px] font-semibold">
                                  {banner.subCat}
                                </span>
                              </>
                            )}
                            {banner.thirdSubCat && (
                              <>
                                <span className="text-slate-600 text-[8px]">➔</span>
                                <span className="px-2 py-0.5 rounded bg-emerald-650/10 border border-emerald-500/10 text-emerald-400 text-[9px] font-semibold">
                                  {banner.thirdSubCat}
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] font-semibold text-slate-600 italic">None (Links to Home)</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-slate-800/30 pt-3 mt-2 text-[10px]">
                      <span className="text-slate-600">
                        {banner.createdAt ? new Date(banner.createdAt).toLocaleDateString() : ""}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditBanner(banner)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-755 text-slate-300 flex items-center justify-center cursor-pointer transition-all border border-slate-700/60"
                        >
                          <MdOutlineEdit size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: "banner", id: banner._id })}
                          className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center cursor-pointer transition-all border border-red-500/20"
                        >
                          <MdOutlineDelete size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Home Slides Grid list */
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel h-48 rounded-2xl skeleton" />
              ))}
            </div>
          ) : slides.length === 0 ? (
            <div className="glass-panel rounded-2xl flex flex-col items-center justify-center py-24 border border-slate-800/40">
              <MdOutlineViewCarousel size={48} className="text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">No home slider slides found.</p>
              <button onClick={openCreateSlide} className="btn-primary mt-4 text-xs">
                <MdOutlineAdd size={14} /> Add First Carousel Slide
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {slides.map((slide, index) => (
                <div
                  key={slide._id}
                  className="glass-panel rounded-2xl overflow-hidden border border-slate-800/40 flex flex-col group hover:border-slate-750/70 transition-all duration-300 shadow-xl"
                >
                  <div className="h-44 bg-slate-950/40 relative overflow-hidden flex items-center justify-center">
                    {slide.images?.[0] ? (
                      <img
                        src={slide.images[0]}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <MdOutlineImage size={40} className="text-slate-700" />
                    )}
                    <span className="absolute top-3 left-3 bg-violet-650 border border-violet-500/30 px-2 py-0.5 rounded text-white text-[9px] font-bold shadow-md">
                      Slide #{index + 1}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="p-3 bg-slate-900/30 flex items-center justify-between border-t border-slate-800/40">
                    <span className="text-[9px] text-slate-500">
                      Added: {slide.createdAt ? new Date(slide.createdAt).toLocaleDateString() : new Date(slide.dateCreated).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditSlide(slide)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-755 text-slate-300 flex items-center justify-center cursor-pointer transition-all border border-slate-700/60"
                      >
                        <MdOutlineEdit size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: "slide", id: slide._id })}
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center cursor-pointer transition-all border border-red-500/20"
                      >
                        <MdOutlineDelete size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Banner Create/Edit Modal */}
      {bannerModalOpen && (
        <div className="modal-overlay" onClick={() => setBannerModalOpen(false)}>
          <form
            onSubmit={handleBannerSave}
            className="modal-box max-w-[500px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  {editBannerId ? "Modify Promotional Banner" : "Create Promotional Banner"}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Promotional banners show up in groups (e.g. 3-column slider) linking to products.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBannerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-700/60 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-slate-300">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                  Banner Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30% Off Footwear Collection"
                  className="admin-input"
                  value={bannerForm.bannerTitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, bannerTitle: e.target.value })}
                />
              </div>

              {/* Price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                  Price Badge (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 499 (Displays as ₹499)"
                  className="admin-input"
                  value={bannerForm.price}
                  onChange={(e) => setBannerForm({ ...bannerForm, price: e.target.value })}
                />
              </div>

              {/* Image Input Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    disabled={!!imageFile}
                    placeholder="https://..."
                    className="admin-input disabled:opacity-50"
                    value={bannerForm.imageUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                    Or Upload File
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-violet-650/15 file:text-violet-400 hover:file:bg-violet-650/25 file:cursor-pointer h-10 flex items-center"
                    onChange={(e) => setImageFile(e.target.files[0] || null)}
                  />
                </div>
              </div>

              {/* Category Breadcrumbs Selector */}
              <div className="border-t border-slate-800/40 pt-4 mt-1 flex flex-col gap-3">
                <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                  Target Product Category mapping
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Category Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-medium ml-1">Category</label>
                    <select
                      className="admin-select w-full"
                      value={bannerForm.catId}
                      onChange={(e) => handleCatChange(e.target.value)}
                    >
                      <option value="">-- None --</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Category Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-medium ml-1">Sub-Category</label>
                    <select
                      className="admin-select w-full"
                      disabled={!selectedCat || !selectedCat.children?.length}
                      value={bannerForm.subCatId}
                      onChange={(e) => handleSubCatChange(e.target.value)}
                    >
                      <option value="">-- None --</option>
                      {selectedCat?.children?.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Leaf Category Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-medium ml-1">Third Level</label>
                    <select
                      className="admin-select w-full"
                      disabled={!selectedSubCat || !selectedSubCat.children?.length}
                      value={bannerForm.thirdSubCatId}
                      onChange={(e) => handleThirdSubCatChange(e.target.value)}
                    >
                      <option value="">-- None --</option>
                      {selectedSubCat?.children?.map((leaf) => (
                        <option key={leaf._id} value={leaf._id}>
                          {leaf.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview image */}
              {(bannerForm.imageUrl || imageFile) && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[9px] text-slate-500 font-medium ml-1">Selected Image Preview:</span>
                  <div className="h-24 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : bannerForm.imageUrl}
                      alt="Banner Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-800/40">
              <button
                type="button"
                onClick={() => setBannerModalOpen(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? "Saving..." : editBannerId ? "Update Banner" : "Publish Banner"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slide Create/Edit Modal */}
      {slideModalOpen && (
        <div className="modal-overlay" onClick={() => setSlideModalOpen(false)}>
          <form
            onSubmit={handleSlideSave}
            className="modal-box max-w-[460px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  {editSlideId ? "Modify Carousel Slide" : "Create Carousel Slide"}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Carousel slides rotate in the main slideshow carousel on the homepage layout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSlideModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-700/60 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-slate-300">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                  Image URL
                </label>
                <input
                  type="text"
                  disabled={!!imageFile}
                  placeholder="https://..."
                  className="admin-input disabled:opacity-50"
                  value={slideForm.imageUrl}
                  onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase ml-1">
                  Or Upload Slide File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-violet-650/15 file:text-violet-400 hover:file:bg-violet-650/25 file:cursor-pointer h-10 flex items-center"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                />
              </div>

              {/* Preview image */}
              {(slideForm.imageUrl || imageFile) && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[9px] text-slate-500 font-medium ml-1">Slide Preview:</span>
                  <div className="h-28 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : slideForm.imageUrl}
                      alt="Slide Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-800/40">
              <button
                type="button"
                onClick={() => setSlideModalOpen(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? "Saving..." : editSlideId ? "Update Slide" : "Publish Slide"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box max-w-[380px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              Delete {deleteConfirm.type === "banner" ? "Promo Banner" : "Home Slide"}?
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to delete this {deleteConfirm.type === "banner" ? "promotional banner" : "slideshow slide"} permanently? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost text-xs">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn-danger text-xs">
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManager;
