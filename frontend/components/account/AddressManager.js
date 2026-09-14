"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteAddress,
  fetchAddresses,
  makeAddressDefault,
  saveAddress,
} from "@/store/slices/accountSlice";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { ReturnIcon } from "@/components/ui/icons";

const EMPTY = {
  label: "",
  fullName: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

// The same four the backend insists on, and the same four checkout asks for.
const REQUIRED = {
  fullName: "Enter the name for the delivery",
  phone: "A phone number is needed for the courier",
  address: "Enter the street address",
  city: "Enter the city",
};

// Kept in step with MAX_ADDRESSES in accountService.js.
const MAX_ADDRESSES = 6;

export default function AddressManager() {
  const dispatch = useDispatch();
  const { addresses, addressStatus, addressError, savingAddress, addressActionError } =
    useSelector((state) => state.account);

  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (addressStatus === "idle") dispatch(fetchAddresses());
  }, [addressStatus, dispatch]);

  const openNew = () => {
    setForm(EMPTY);
    setErrors({});
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (entry) => {
    setForm({
      label: entry.label || "",
      fullName: entry.fullName,
      phone: entry.phone,
      address: entry.address,
      city: entry.city,
      postalCode: entry.postalCode || "",
    });
    setErrors({});
    setEditingId(entry._id);
    setFormOpen(true);
  };

  const setField = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] ? { ...current, [field]: null } : current
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const found = {};
    for (const [field, message] of Object.entries(REQUIRED)) {
      if (!form[field].trim()) found[field] = message;
    }

    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    const result = await dispatch(
      saveAddress({ id: editingId, values: form })
    );

    if (!result.error) {
      setFormOpen(false);
      setEditingId(null);
      setForm(EMPTY);
    }
  };

  const loading = addressStatus === "idle" || addressStatus === "loading";

  return (
    <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Saved addresses
          </h2>
          <p className="mt-1 text-sm text-muted">
            Pick one at checkout instead of typing it out again.
          </p>
        </div>

        {!formOpen && addresses.length < MAX_ADDRESSES ? (
          <button
            type="button"
            onClick={openNew}
            className="h-10 shrink-0 rounded-full bg-pine px-5 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
          >
            Add address
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        <Alert type="error">{addressActionError}</Alert>

        {formOpen ? (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-xl border border-line bg-canvas p-5 sm:p-6"
          >
            <h3 className="font-display text-lg font-semibold text-ink">
              {editingId ? "Edit address" : "New address"}
            </h3>

            <div className="mt-5 space-y-5">
              <Input
                id="label"
                label="Label (optional)"
                placeholder="Home, Office..."
                value={form.label}
                onChange={setField("label")}
              />

              <Input
                id="fullName"
                label="Full name"
                autoComplete="name"
                placeholder="Who is receiving it"
                value={form.fullName}
                onChange={setField("fullName")}
                error={errors.fullName}
              />

              <Input
                id="phone"
                label="Phone"
                type="tel"
                autoComplete="tel"
                placeholder="03xx xxxxxxx"
                value={form.phone}
                onChange={setField("phone")}
                error={errors.phone}
              />

              <Input
                id="address"
                label="Street address"
                autoComplete="street-address"
                placeholder="House, street, area"
                value={form.address}
                onChange={setField("address")}
                error={errors.address}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  id="city"
                  label="City"
                  autoComplete="address-level2"
                  placeholder="Karachi"
                  value={form.city}
                  onChange={setField("city")}
                  error={errors.city}
                />
                <Input
                  id="postalCode"
                  label="Postal code (optional)"
                  autoComplete="postal-code"
                  placeholder="75500"
                  value={form.postalCode}
                  onChange={setField("postalCode")}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={savingAddress}
                className="h-12 rounded-full bg-pine px-7 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft disabled:opacity-50"
              >
                {savingAddress ? "Saving..." : "Save address"}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="h-12 rounded-full px-6 text-sm font-semibold text-muted transition-colors hover:bg-ink/5 hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-sand" />
          ))
        ) : addressStatus === "failed" ? (
          <div className="rounded-xl border border-clay/30 bg-clay/5 px-6 py-8 text-center">
            <p className="text-sm text-muted">{addressError}</p>
            <button
              type="button"
              onClick={() => dispatch(fetchAddresses())}
              className="mt-4 h-10 rounded-full bg-pine px-5 text-sm font-semibold text-canvas"
            >
              Try again
            </button>
          </div>
        ) : addresses.length === 0 && !formOpen ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand text-pine">
              <ReturnIcon />
            </span>
            <p className="mt-4 font-display text-lg font-semibold text-ink">
              No addresses saved
            </p>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted">
              Save one here and checkout will fill itself in from then on.
            </p>
          </div>
        ) : (
          addresses.map((entry) => (
            <div
              key={entry._id}
              className={`rounded-xl border p-5 ${
                entry.isDefault ? "border-pine bg-pine/5" : "border-line"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{entry.fullName}</p>
                    {entry.label ? (
                      <span className="rounded-full border border-line bg-sand px-2.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.1em] uppercase text-muted">
                        {entry.label}
                      </span>
                    ) : null}
                    {entry.isDefault ? (
                      <span className="rounded-full border border-pine/25 bg-pine/10 px-2.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.1em] uppercase text-pine">
                        Default
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {entry.address}
                    <br />
                    {entry.city}
                    {entry.postalCode ? ` ${entry.postalCode}` : ""}
                    <br />
                    {entry.phone}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {!entry.isDefault ? (
                  <button
                    type="button"
                    onClick={() => dispatch(makeAddressDefault(entry._id))}
                    className="h-9 rounded-full border border-ink/20 px-4 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
                  >
                    Make default
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => openEdit(entry)}
                  className="h-9 rounded-full border border-ink/20 px-4 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => dispatch(deleteAddress(entry._id))}
                  className="h-9 rounded-full px-4 text-xs font-semibold text-clay transition-colors hover:bg-clay/10"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {addresses.length >= MAX_ADDRESSES ? (
        <p className="mt-4 text-xs text-muted">
          That is the limit of {MAX_ADDRESSES} — remove one to add another.
        </p>
      ) : null}
    </section>
  );
}
