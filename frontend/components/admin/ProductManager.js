"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteProduct,
  fetchAdminProducts,
  updateProduct,
} from "@/store/slices/productSlice";
import { fetchUsers } from "@/store/slices/userSlice";
import AdminTabs from "./AdminTabs";
import ProductForm from "@/components/products/ProductForm";
import ProductImage from "@/components/products/ProductImage";
import Alert from "@/components/ui/Alert";
import { formatPrice } from "@/lib/format";

const PAGE_SIZE = 20;

const statusFilters = ["all", "active", "inactive"];

const fieldClass =
  "h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pine";

export default function ProductManager() {
  const dispatch = useDispatch();
  const {
    admin,
    adminPagination,
    adminStatus,
    adminError,
    deletingId,
    saving,
    saveError,
  } = useSelector((state) => state.products);
  const { items: users, status: usersStatus } = useSelector(
    (state) => state.users
  );

  const [search, setSearch] = useState("");
  // The request only fires once typing pauses, so a long name is one call.
  const [committedSearch, setCommittedSearch] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  // Populates the vendor dropdown. The Vendors tab may have loaded these
  // already, so only fetch when nothing is in the store yet.
  useEffect(() => {
    if (usersStatus === "idle") dispatch(fetchUsers({ role: "vendor" }));
  }, [usersStatus, dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCommittedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    dispatch(
      fetchAdminProducts({
        page,
        limit: PAGE_SIZE,
        search: committedSearch || undefined,
        vendorId: vendorId || undefined,
        status: status === "all" ? undefined : status,
      })
    );
  }, [dispatch, page, committedSearch, vendorId, status]);

  const vendors = users.filter((user) => user.role === "vendor");
  const { totalProducts = 0, totalPages = 0 } = adminPagination || {};
  const isFiltered = Boolean(committedSearch || vendorId || status !== "all");

  const reactivate = (product) =>
    dispatch(updateProduct({ id: product._id, changes: { status: "active" } }));

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <AdminTabs />

      <div className="mt-8">
        <p className="eyebrow text-brass">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Products
        </h1>
        <p className="mt-3 text-muted">
          {adminStatus === "succeeded"
            ? `${totalProducts} ${
                totalProducts === 1 ? "product" : "products"
              } across every vendor`
            : "Loading..."}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          placeholder="Search by product name"
          aria-label="Search products"
          onChange={(e) => setSearch(e.target.value)}
          className={`${fieldClass} w-full sm:w-64`}
        />

        <select
          value={vendorId}
          aria-label="Filter by vendor"
          onChange={(e) => {
            setVendorId(e.target.value);
            setPage(1);
          }}
          className={`${fieldClass} w-full sm:w-56`}
        >
          <option value="">All vendors</option>
          {vendors.map((vendor) => (
            <option key={vendor._id} value={vendor._id}>
              {vendor.name}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={`flex h-11 items-center rounded-full px-5 text-sm font-semibold capitalize transition-colors ${
                status === value
                  ? "bg-pine text-canvas"
                  : "border border-line text-muted hover:border-ink/30 hover:text-ink"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {editing ? (
        <div className="mt-10">
          <ProductForm
            key={editing._id}
            editing={editing}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : null}

      <div className="mt-10 space-y-3">
        {/* A row action has no open form to show its error, so surface it here. */}
        {!editing ? <Alert type="error">{saveError}</Alert> : null}

        {adminStatus === "loading" || adminStatus === "idle" ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand" />
          ))
        ) : adminStatus === "failed" ? (
          <Alert type="error">{adminError}</Alert>
        ) : admin.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              {isFiltered ? "Nothing matches those filters" : "No products yet"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {isFiltered
                ? "Try a different vendor, or clear the search."
                : "Products appear here as soon as an approved vendor lists one."}
            </p>
          </div>
        ) : (
          admin.map((product) => {
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

                    {/* The column that makes this list different from a
                        vendor's own — whose shelf the row belongs to. */}
                    <p className="mt-1 truncate text-sm text-muted">
                      <span className="font-semibold text-ink">
                        {product.vendorId?.name || "Unknown vendor"}
                      </span>
                      {" · "}
                      {formatPrice(product.price)}
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
                      onClick={() => setEditing(product)}
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

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-center gap-3"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="h-10 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5 disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="h-10 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5 disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      ) : null}

      <p className="mt-8 rounded-xl border border-line bg-sand/60 px-5 py-4 text-xs leading-relaxed text-muted">
        Editing here overrides the vendor&apos;s own listing. Hiding takes a
        product off the storefront without deleting it — the vendor still sees
        it on their dashboard, and either of you can republish it.
      </p>
    </div>
  );
}
