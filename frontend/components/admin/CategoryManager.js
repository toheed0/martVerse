"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCategory,
  fetchAdminCategories,
  updateCategory,
} from "@/store/slices/categorySlice";
import CategoryForm from "./CategoryForm";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function CategoryManager() {
  const dispatch = useDispatch();
  const { adminItems, adminStatus, adminError, deletingId, saving, saveError } =
    useSelector((state) => state.categories);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminCategories());
  }, [dispatch]);

  const activeCount = adminItems.filter(
    (item) => item.status === "active"
  ).length;
  const inactiveCount = adminItems.length - activeCount;

  const startCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const startEdit = (category) => {
    setEditing(category);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const reactivate = (category) =>
    dispatch(
      updateCategory({ id: category._id, changes: { status: "active" } })
    );

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-brass">Admin</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Categories
          </h1>
          <p className="mt-3 text-muted">
            {adminStatus === "succeeded"
              ? `${activeCount} active${
                  inactiveCount ? ` · ${inactiveCount} inactive` : ""
                }`
              : "Loading..."}
          </p>
        </div>

        {!showForm ? <Button onClick={startCreate}>New category</Button> : null}
      </div>

      {showForm ? (
        <div className="mt-10">
          <CategoryForm
            key={editing?._id ?? "new"}
            editing={editing}
            onDone={closeForm}
            onCancel={closeForm}
          />
        </div>
      ) : null}

      <div className="mt-10 space-y-3">
        {/* A row action has no open form to show its error, so surface it here. */}
        {!showForm ? <Alert type="error">{saveError}</Alert> : null}

        {adminStatus === "loading" ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-sand" />
          ))
        ) : adminStatus === "failed" ? (
          <Alert type="error">{adminError}</Alert>
        ) : adminItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              No categories yet
            </p>
            <p className="mt-2 text-sm text-muted">
              Create the first one to get the storefront going.
            </p>
          </div>
        ) : (
          adminItems.map((category) => {
            const isActive = category.status === "active";

            return (
              <div
                key={category._id}
                className={`flex flex-col gap-4 rounded-2xl border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between ${
                  isActive ? "border-line" : "border-dashed border-line"
                }`}
              >
                <div
                  className={`flex min-w-0 items-center gap-4 ${
                    isActive ? "" : "opacity-60"
                  }`}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-sand">
                    {category.image?.url ? (
                      <Image
                        src={category.image.url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-display text-lg font-semibold text-muted">
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-lg font-semibold text-ink">
                        {category.name}
                      </h3>
                      <span className="rounded-full border border-line bg-sand px-2.5 py-0.5 font-mono text-[0.7rem] text-muted">
                        /{category.slug}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-[0.12em] uppercase ${
                          isActive
                            ? "border-pine/25 bg-pine/10 text-pine"
                            : "border-line bg-sand text-muted"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-pine" : "bg-muted"
                          }`}
                        />
                        {category.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">
                      {category.description || "No description"}
                    </p>
                  </div>
                </div>

                {confirmingId === category._id ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm text-muted">Deactivate?</span>
                    <button
                      type="button"
                      disabled={deletingId === category._id}
                      onClick={() => {
                        dispatch(deleteCategory(category._id));
                        setConfirmingId(null);
                      }}
                      className="h-10 rounded-full bg-clay px-5 text-sm font-semibold text-white transition-colors hover:bg-clay/90 disabled:opacity-60"
                    >
                      {deletingId === category._id ? "Working..." : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="h-10 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      className="h-10 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
                    >
                      Edit
                    </button>

                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(category._id)}
                        className="h-10 rounded-full px-5 text-sm font-semibold text-clay transition-colors hover:bg-clay/10"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => reactivate(category)}
                        className="h-10 rounded-full bg-pine px-5 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft disabled:opacity-60"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="mt-8 rounded-xl border border-line bg-sand/60 px-5 py-4 text-xs leading-relaxed text-muted">
        Deactivating hides a category from the storefront but keeps the record.
        It stays listed here so you can bring it back with Reactivate.
      </p>
    </div>
  );
}
