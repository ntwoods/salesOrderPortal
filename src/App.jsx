import { useCallback, useMemo, useState } from "react";
import AppShell from "./components/AppShell";
import ConfirmDialog from "./components/ConfirmDialog";
import Header from "./components/Header";
import Loader from "./components/Loader";
import LoginGate from "./components/LoginGate";
import ToastHost from "./components/ToastHost";
import DashboardPage from "./pages/DashboardPage";
import { disableGoogleAutoSelect } from "./services/auth";
import { fetchAccountsOrders, uploadAdditional, uploadFinal } from "./services/api";
import { buildUploadPayload } from "./utils/file";

let toastIdCounter = 0;

export default function App() {
  const [auth, setAuth] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyMap, setBusyMap] = useState({});
  const [toasts, setToasts] = useState([]);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const pushToast = useCallback((message, type = "success") => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const data = await fetchAccountsOrders(auth);
      setOrders(data);
    } catch (error) {
      pushToast(error.message || "Failed to fetch orders.", "error");
    } finally {
      setLoading(false);
    }
  }, [auth, pushToast]);

  const withBusy = useCallback(async (key, action) => {
    setBusyMap((prev) => ({ ...prev, [key]: true }));
    try {
      await action();
    } finally {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, []);

  const handleUploadFinal = useCallback(
    async (orderId, fileList) => {
      const busyKey = `${orderId}:FINAL:0`;
      try {
        await withBusy(busyKey, async () => {
          const files = await buildUploadPayload(fileList);
          await uploadFinal({ orderId, files, auth });
          pushToast("Final segment uploaded.");
          await refreshOrders();
        });
      } catch (error) {
        pushToast(error.message || "Final upload failed.", "error");
      }
    },
    [auth, pushToast, refreshOrders, withBusy]
  );

  const handleUploadAdditional = useCallback(
    async (orderId, additionalUrl, fileList) => {
      const busyKey = `${orderId}:ADDITIONAL:${additionalUrl}`;
      try {
        await withBusy(busyKey, async () => {
          const files = await buildUploadPayload(fileList);
          await uploadAdditional({ orderId, additionalUrl, files, auth });
          pushToast("Additional segment uploaded.");
          await refreshOrders();
        });
      } catch (error) {
        pushToast(error.message || "Additional upload failed.", "error");
      }
    },
    [auth, pushToast, refreshOrders, withBusy]
  );

  const handleLogin = useCallback(
    async (loginAuth) => {
      setAuth(loginAuth);
      setLoading(true);
      try {
        const data = await fetchAccountsOrders(loginAuth);
        setOrders(data);
      } catch (error) {
        setAuth(null);
        pushToast(error.message || "Login allowed, but data fetch failed.", "error");
      } finally {
        setLoading(false);
      }
    },
    [pushToast]
  );

  const handleLogout = useCallback(() => {
    disableGoogleAutoSelect();
    setAuth(null);
    setOrders([]);
    setBusyMap({});
    setLogoutOpen(false);
  }, []);

  const renderedBody = useMemo(() => {
    if (loading) return <Loader label="Loading orders..." />;
    return (
      <DashboardPage
        orders={orders}
        busyMap={busyMap}
        onUploadFinal={handleUploadFinal}
        onUploadAdditional={handleUploadAdditional}
      />
    );
  }, [busyMap, handleUploadAdditional, handleUploadFinal, loading, orders]);

  if (!auth) {
    return (
      <>
        <LoginGate onLoginSuccess={handleLogin} />
        <ToastHost toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      </>
    );
  }

  return (
    <AppShell>
      <Header user={auth} onRefresh={refreshOrders} refreshing={loading} onLogout={() => setLogoutOpen(true)} />
      {renderedBody}
      <ToastHost toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      <ConfirmDialog
        open={logoutOpen}
        title="Sign out?"
        message="This clears local session from this browser tab."
        confirmLabel="Sign Out"
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </AppShell>
  );
}
