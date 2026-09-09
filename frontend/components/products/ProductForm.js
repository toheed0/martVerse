"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  // One trailing blank row so there is always somewhere to paste a URL.
  const [images, setImages] = useState(() =>
    editing?.images?.length ? [...editing.images, ""] : [""]
  );

  useEffect(() => {
    dispatch(clearSaveError());
  }, [dispatch]);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchCategories());
  }, [listStatus, dispatch]);

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setImage = (index, value) =>
    setImages((prev) => {
      const next = [...prev];
      next[index] = value;
      // Typing in the last row opens a fresh one below it.
      if (value && index === next.length - 1) next.push("");
      return next;
    });

  const removeImage = (index) =>
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [""];
    });

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
            Image URLs
          </span>

          <div className="space-y-2">
            {images.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="url"
                  value={url}
                  placeholder="https://..."
                  aria-label={`Image URL ${index + 1}`}
                  onChange={(e) => setImage(index, e.target.value)}
                  className={`${fieldClass} h-12`}
                />
                {images.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove image ${index + 1}`}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-clay/10 hover:text-clay"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted">
            The first image is used as the product thumbnail.
          </p>
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
