export default function Header({ user, onRefresh, onLogout, refreshing }) {
  return (
    <header className="top-header">
      <div>
        <p className="eyebrow">Sales Order Workflow</p>
        <h1>Accounts Team Portal</h1>
      </div>
      <div className="header-actions">
        <div className="user-chip">{user?.email}</div>
        <button type="button" className="btn btn-muted" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
        <button type="button" className="btn btn-danger" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
