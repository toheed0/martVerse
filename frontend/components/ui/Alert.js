const styles = {
  error: "border-clay/30 bg-clay/10 text-clay",
  success: "border-pine/20 bg-pine/10 text-pine",
};

export default function Alert({ type = "error", children }) {
  if (!children) return null;

  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm ${styles[type]}`}
    >
      {children}
    </div>
  );
}
