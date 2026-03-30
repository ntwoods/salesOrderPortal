export default function Loader({ label = "Loading..." }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <span className="loader-dot" />
      <span>{label}</span>
    </div>
  );
}
