"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteProduct,
  fetchMyProducts,
  updateProduct,
} from "@/store/slices/productSlice";
import VendorTabs from "./VendorTabs";
import ProductForm from "@/components/products/ProductForm";
import ProductImage from "@/components/products/ProductImage";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { formatPrice } from "@/lib/format";

export default function ProductManager() {
  const dispatch = useDispatch();
  const { mine, mineStatus, mineError, deletingId, saving, saveError } =
    useSelector((state) => state.products);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyProducts());
  }, [dispatch]);

  const activeCount = mine.filter((item) => item.status === "active").length;
  const inactiveCount = mine.length - activeCount;

  const startCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const startEdit = (product) => {
    setEditing(product);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const reactivate = (product) =>
    dispatch(updateProduct({ id: product._id, changes: { status: "active" } }));

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <VendorTabs />

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-brass">Vendor</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Your products
          </h1>
          <p className="mt-3 text-muted">
            {mineStatus === "succeeded"
              ? `${activeCount} live${
                  inactiveCount ? ` · ${inactiveCount} hidden` : ""
                }`
              : "Loading..."}
          </p>
        </div>

        {!showForm ? <Button onClick={startCreate}>New product</Button> : null}
      </div>

      {showForm ? (
        <div className="mt-10">
          <ProductForm
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

        {mineStatus === "loading" ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand" />
          ))
        ) : mineStatus === "failed" ? (
          <Alert type="error">{mineError}</Alert>
        ) : mine.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              No products yet
            </p>
            <p className="mt-2 text-sm text-muted">
              List your first product and it appears on the storefront right
              away.
            </p>
          </div>
        ) : (
          mine.map((product) => {
            const isActive = product.status === "active";

            return (
              <div
                key={product._id}
                className={`flex flex-col gap-4 rounded-2xl border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between ${
                  isActive ? "border-line" : "border-dashed border-line"
                }`}
              >
                <div
                  className={`flex min-w-0 items-center gap-4 ${
                    isActive ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-sand text-pine">
                    <ProductImage product={product} artClassName="h-10 w-10" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-lg font-semibold text-ink">
                        {product.name}
                      </h3>

                      {product.categoryId?.name ? (
                        <span className="rounded-full border border-line bg-sand px-2.5 py-0.5 text-[0.62rem] tracking-[0.1em] uppercase text-muted">
                          {product.categoryId.name}
                        </span>
                      ) : null}

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
                        {isActive ? "live" : "hidden"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted">
                      <span className="font-semibold text-ink">
                        {formatPrice(product.price)}
                      </span>
                      {" · "}
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </p>
                  </div>
                </div>

                {confirmingId === product._id ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm text-muted">Hide this?</span>
                    <button
                      type="button"
                      disabled={deletingId === product._id}
                      onClick={() => {
                        dispatch(deleteProduct(product._id));
                        setConfirmingId(null);
                      }}
                      className="h-10 rounded-full bg-clay px-5 text-sm font-semibold text-white transition-colors hover:bg-clay/90 disabled:opacity-60"
                    >
                      {deletingId === product._id ? "Working..." : "Yes"}
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
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {isActive ? (
                      <Link
                        href={`/products/${product._id}`}
                        className="flex h-10 items-center rounded-full px-4 text-sm font-semibold text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                      >
                        View
                      </Link>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="h-10 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
                    >
                      Edit
                    </button>

                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(product._id)}
                        className="h-10 rounded-full px-5 text-sm font-semibold text-clay transition-colors hover:bg-clay/10"
                      >
                        Hide
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => reactivate(product)}
                        className="h-10 rounded-full bg-pine px-5 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft disabled:opacity-60"
                      >
                        Republish
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
        Hiding a product removes it from the storefront but keeps the record and
        its stock. It stays listed here so you can bring it back with Republish.
      </p>
    </div>
  );
}
