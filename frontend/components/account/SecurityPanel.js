"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { changePassword, clearAccountFeedback } from "@/store/slices/accountSlice";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { ShieldIcon } from "@/components/ui/icons";

// Kept in step with MIN_PASSWORD_LENGTH on the server, which is what actually
// enforces it.
const MIN_PASSWORD_LENGTH = 6;

const EMPTY = { currentPassword: "", newPassword: "", confirm: "" };

export default function SecurityPanel() {
  const dispatch = useDispatch();
  const { passwordSaving, passwordError, passwordMessage } = useSelector(
    (state) => state.account
  );

  const [form, setForm] = useState(EMPTY);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    dispatch(clearAccountFeedback());
  }, [dispatch]);

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setLocalError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.newPassword.length < MIN_PASSWORD_LENGTH) {
      setLocalError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
      return;
    }

    // Checked only here. The server never sees the second box — it has no way
    // to know what was meant, only what was sent.
    if (form.newPassword !== form.confirm) {
      setLocalError("The two new passwords do not match");
      return;
    }

    const result = await dispatch(
      changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
    );

    if (!result.error) setForm(EMPTY);
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-pine">
          <ShieldIcon />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Change password
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            You stay signed in here; everywhere else gets signed out.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <Alert type="success">{passwordMessage}</Alert>
        <Alert type="error">{localError || passwordError}</Alert>

        <Input
          id="currentPassword"
          type="password"
          label="Current password"
          placeholder="••••••••"
          value={form.currentPassword}
          onChange={setField("currentPassword")}
          autoComplete="current-password"
          required
        />

        <Input
          id="newPassword"
          type="password"
          label="New password"
          placeholder="••••••••"
          value={form.newPassword}
          onChange={setField("newPassword")}
          autoComplete="new-password"
          required
        />

        <Input
          id="confirm"
          type="password"
          label="Confirm new password"
          placeholder="••••••••"
          value={form.confirm}
          onChange={setField("confirm")}
          autoComplete="new-password"
          required
        />

        <button
          type="submit"
          disabled={passwordSaving}
          className="h-12 w-full rounded-full bg-pine text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {passwordSaving ? "Saving..." : "Change password"}
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-muted">
        Forgotten it instead? Sign out and use the{" "}
        <span className="font-semibold text-ink">Forgot password</span> link on
        the sign-in page — that one goes through your email.
      </p>
    </section>
  );
}
