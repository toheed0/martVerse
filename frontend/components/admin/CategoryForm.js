"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import {
  clearSaveError,
  createCategory,
  updateCategory,
} from "@/store/slices/categorySlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

// "Winter Jackets" -> "winter-jackets"
const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const emptyForm = { name: "", slug: "", description: "", status: "active" };

const buildForm = (editing) =>
  editing
    ? {
        name: editing.name,
        slug: editing.slug,
        description: editing.description || "",
        status: editing.status,
      }
    : emptyForm;

// Mirrors the multer config on the server, so an oversized or wrong-typed file
// is caught here instead of after a 5MB round trip.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

// The parent gives this component a `key` tied to the category being edited, so
// switching between create and edit remounts it and the state below rebuilds
// itself. That's cheaper than syncing props into state inside an effect.
export default function CategoryForm({ editing, onDone, onCancel }) {
  const dispatch = useDispatch();
  const { saving, saveError } = useSelector((state) => state.categories);
  const [form, setForm] = useState(() => buildForm(editing));

  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [localPreview, setLocalPreview] = useState("");
  // Only meaningful on edit: tells the API to clear an already-saved image.
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState("");

  // Don't carry a previous failure into a freshly opened form.
  useEffect(() => {
    dispatch(clearSaveError());
  }, [dispatch]);

  // An object URL leaks until revoked. The ref mirrors `localPreview` so the
  // unmount cleanup below can reach the latest one without re-subscribing.
  const previewUrlRef = useRef("");

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  // Swapping the picked file revokes the URL the old preview was using.
  const showPreviewFor = (file) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    const url = file ? URL.createObjectURL(file) : "";
    previewUrlRef.current = url;

    setImageFile(file);
    setLocalPreview(url);
  };

  const savedImage = removeImage ? "" : editing?.image?.url || "";
  const preview = localPreview || savedImage;

  const handleName = (e) => {
    const name = e.target.value;
    // While creating, keep the slug in sync with the name unless the admin has
    // typed their own. On edit we never touch it — changing a live slug would
    // break existing links.
    setForm((prev) => ({
      ...prev,
      name,
      slug: editing || prev.slugEdited ? prev.slug : slugify(name),
    }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError("Choose a JPG, PNG, WebP, AVIF or GIF image");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be 5MB or smaller");
      return;
    }

    setImageError("");
    setRemoveImage(false);
    showPreviewFor(file);
  };

  const clearImage = () => {
    showPreviewFor(null);
    setImageError("");
    // A saved image needs an explicit instruction to the API; an unsaved pick
    // just disappears.
    setRemoveImage(Boolean(editing?.image?.url));

    // Without this, re-picking the same file fires no change event.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Multipart either way — the file rides along with the text fields, so a
    // category and its image are saved in one request.
    const body = new FormData();
    body.append("name", form.name);
    body.append("slug", form.slug);
    body.append("description", form.description);
    if (editing) body.append("status", form.status);

    if (imageFile) body.append("image", imageFile);
    else if (removeImage) body.append("removeImage", "true");

    const action = editing
      ? updateCategory({ id: editing._id, changes: body })
      : createCategory(body);

    const result = await dispatch(action);

    // Only close the form if the request actually succeeded.
    if (!result.error) {
      setForm(emptyForm);
      onDone();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-surface p-6 sm:p-8"
    >
      <h2 className="font-display text-xl font-semibold text-ink">
        {editing ? `Edit "${editing.name}"` : "New category"}
      </h2>

      <div className="mt-6 space-y-5">
        <Alert type="error">{saveError}</Alert>

        <Input
          id="name"
          label="Name"
          placeholder="Home & Living"
          value={form.name}
          onChange={handleName}
          required
        />

        <Input
          id="slug"
          label="Slug"
          placeholder="home-living"
          value={form.slug}
          onChange={(e) =>
            setForm({ ...form, slug: e.target.value, slugEdited: true })
          }
          required
        />

        <Input
          id="description"
          label="Description"
          placeholder="Optional — shown on the category card"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="space-y-2">
          <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-muted">
            Image
          </span>

          <div className="flex items-center gap-4 rounded-xl border border-line bg-canvas/60 p-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-sand">
              {preview ? (
                <Image
                  src={preview}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-muted">
                  None
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <label
                  htmlFor="image"
                  className="inline-flex h-10 cursor-pointer items-center rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
                >
                  {preview ? "Replace" : "Choose image"}
                </label>

                {preview ? (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="h-10 rounded-full px-4 text-sm font-semibold text-clay transition-colors hover:bg-clay/10"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <input
                ref={fileInputRef}
                id="image"
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFile}
                className="sr-only"
              />

              <p className="mt-2 truncate text-xs text-muted">
                {imageFile
                  ? imageFile.name
                  : "JPG, PNG, WebP, AVIF or GIF · up to 5MB"}
              </p>
            </div>
          </div>

          {imageError ? <p className="text-xs text-clay">{imageError}</p> : null}
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
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
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
          {saving ? "Saving..." : editing ? "Save changes" : "Create category"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
