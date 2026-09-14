"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api, { getErrorMessage } from "@/lib/api";
import {
  clearSaveError,
  createProduct,
  updateProduct,
} from "@/store/slices/productSlice";
import { fetchCategories } from "@/store/slices/categorySlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { CloseIcon } from "@/components/ui/icons";

// Mirrors MAX_PRODUCT_IMAGES in upload.middleware.js. The server is what
// enforces it; this only stops the picker offering a sixth slot.
const MAX_IMAGES = 5;

const emptyForm = {
  name: "",
  categoryId: "",
  price: "",
  stock: "",
  description: "",
  status: "active",
};

const buildForm = (editing) =>
  editing
    ? {
        name: editing.name,
        // Populated on the vendor list, a bare id straight after a save.
        categoryId: editing.categoryId?._id ?? editing.categoryId ?? "",
        price: String(editing.price ?? ""),
        stock: String(editing.stock ?? ""),
        description: editing.description || "",
        status: editing.status,
      }
    : emptyForm;

const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-4 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pine";

// Remounted by the parent via `key` whenever the edit target changes, so this
// state rebuilds itself instead of syncing props in an effect.
export default function ProductForm({ editing, onDone, onCancel }) {
  const dispatch = useDispatch();
  const { saving, saveError } = useSelector((state) => state.products);
  const { items: categories, listStatus } = useSelector(
    (state) => state.categories
  );

  const [form, setForm] = useState(() => buildForm(editing));
  const [images, setImages] = useState(() => editing?.images ?? []);

  const [uploading, setUploading] = useState(false);
  // Upload failures never reach Redux — the URLs that come back live in this
  // component's state, so nothing in the store would have a use for them.
  const [uploadError, setUploadError] = useState(null);

  // Pasting a URL still works for a picture already hosted somewhere, but it
  // is the exception now, so it stays folded away until asked for.
  const [urlEntry, setUrlEntry] = useState("");
  const [showUrlEntry, setShowUrlEntry] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    dispatch(clearSaveError());
  }, [dispatch]);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchCategories());
  }, [listStatus, dispatch]);

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const removeImage = (index) =>
    setImages((prev) => prev.filter((_, i) => i !== index));

  const addUrl = () => {
    const url = urlEntry.trim();
    if (!url) return;

    setImages((prev) => [...prev, url].slice(0, MAX_IMAGES));
    setUrlEntry("");
    setShowUrlEntry(false);
  };

  const handleFiles = async (event) => {
    const picked = Array.from(event.target.files ?? []);

    // Letting the same file be picked twice in a row needs the input cleared,
    // since re-selecting an identical path fires no change event otherwise.
    event.target.value = "";

    if (!picked.length) return;

    const room = MAX_IMAGES - images.length;

    if (room <= 0) {
      setUploadError(`You can have at most ${MAX_IMAGES} images`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const body = new FormData();
      // Trimmed to what will actually fit rather than uploading files the
      // server would only refuse.
      picked.slice(0, room).forEach((file) => body.append("images", file));

      // Content-Type is left unset on purpose: the browser has to add the
      // multipart boundary itself, and naming the type would overwrite it.
      const { data } = await api.post("/products/images", body);

      setImages((prev) => [...prev, ...data.images].slice(0, MAX_IMAGES));

      if (picked.length > room) {
        setUploadError(
          `Only the first ${room} went up — ${MAX_IMAGES} images is the limit`
        );
      }
    } catch (error) {
      setUploadError(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock || 0),
      images: images.map((url) => url.trim()).filter(Boolean),
    };

    const action = editing
      ? updateProduct({
          id: editing._id,
          changes: { ...payload, status: form.status },
        })
      : createProduct(payload);

    const result = await dispatch(action);

    if (!result.error) onDone();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-surface p-6 sm:p-8"
    >
      <h2 className="font-display text-xl font-semibold text-ink">
        {editing ? `Edit "${editing.name}"` : "New product"}
      </h2>

      <div className="mt-6 space-y-5">
        <Alert type="error">{saveError}</Alert>

        <Input
          id="name"
          label="Name"
          placeholder="Walnut Writing Desk"
          value={form.name}
          onChange={setField("name")}
          required
        />

        <div className="space-y-2">
          <label
            htmlFor="categoryId"
            className="block text-xs font-semibold tracking-[0.12em] uppercase text-muted"
          >
            Category
          </label>
          <select
            id="categoryId"
            value={form.categoryId}
            onChange={setField("categoryId")}
            required
            className={`${fieldClass} h-12`}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          {listStatus === "succeeded" && categories.length === 0 ? (
            <p className="text-xs text-clay">
              No active categories yet — an admin has to create one first.
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="price"
            label="Price (Rs)"
            type="number"
            min="0"
            step="1"
            placeholder="24999"
            value={form.price}
            onChange={setField("price")}
            required
          />
          <Input
            id="stock"
            label="Stock"
            type="number"
            min="0"
            step="1"
            placeholder="10"
            value={form.stock}
            onChange={setField("stock")}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-xs font-semibold tracking-[0.12em] uppercase text-muted"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="What makes this piece worth buying?"
            value={form.description}
            onChange={setField("description")}
            required
            className={`${fieldClass} resize-y py-3 leading-relaxed`}
          />
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-muted">
            Images
          </span>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-sand"
              >
                {/* A vendor URL can point at any host, and next/image would
                    need every one of them allowlisted in next.config. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Product image ${index + 1}`}
                  className="h-full w-full object-cover"
                />

                {index === 0 ? (
                  <span className="absolute bottom-1 left-1 rounded-full bg-ink/80 px-2 py-0.5 text-[0.55rem] font-semibold tracking-wider uppercase text-canvas">
                    Thumbnail
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-canvas transition-colors hover:bg-clay"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {uploading ? (
              <div className="flex aspect-square animate-pulse items-center justify-center rounded-xl border border-dashed border-line bg-sand text-xs font-semibold text-muted">
                Uploading...
              </div>
            ) : null}

            {images.length < MAX_IMAGES && !uploading ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-muted transition-colors hover:border-pine hover:bg-pine/5 hover:text-pine"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs font-semibold">Add images</span>
              </button>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            multiple
            onChange={handleFiles}
            className="sr-only"
          />

          <Alert type="error">{uploadError}</Alert>

          <p className="text-xs text-muted">
            {images.length === 0
              ? `JPG, PNG, WebP, AVIF or GIF — up to ${MAX_IMAGES} images, 5MB each.`
              : `The first image is the thumbnail. ${images.length} of ${MAX_IMAGES} used.`}
          </p>

          {showUrlEntry ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                value={urlEntry}
                placeholder="https://..."
                aria-label="Image URL"
                onChange={(e) => setUrlEntry(e.target.value)}
                // Enter would otherwise submit the whole product form.
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrl();
                  }
                }}
                className={`${fieldClass} h-11`}
              />
              <button
                type="button"
                onClick={addUrl}
                className="h-11 shrink-0 rounded-xl border border-ink/20 px-4 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
              >
                Add
              </button>
            </div>
          ) : images.length < MAX_IMAGES ? (
            <button
              type="button"
              onClick={() => setShowUrlEntry(true)}
              className="text-xs font-semibold text-muted underline underline-offset-4 transition-colors hover:text-ink"
            >
              Or paste a URL instead
            </button>
          ) : null}
        </div>

        {editing ? (
          <div className="space-y-2">
            <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-muted">
              Status
            </span>
            <div className="grid grid-cols-2 gap-3">
              {["active", "inactive"].map((value) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                    form.status === value
                      ? "border-pine bg-pine/5 text-ink"
                      : "border-line bg-surface text-muted hover:border-ink/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={value}
                    checked={form.status === value}
                    onChange={setField("status")}
                    className="sr-only"
                  />
                  {value}
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-7 flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : editing ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
