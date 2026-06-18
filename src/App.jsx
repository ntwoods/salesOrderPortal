import { useCallback, useEffect, useRef, useState } from "react";
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

const AUTO_REFRESH_INTERVAL_MS = 5000;
const TOAST_DURATION_MS = 3500;

let toastIdCounter = 0;

export default function App() {
  const [auth, setAuth] = useState(null);
  const [orders, setOrders] = useState([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyMap, setBusyMap] = useState({});
  const [toasts, setToasts] = useState([]);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const refreshInFlightRef = useRef(false);
  const toastTimeoutsRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timeoutId = toastTimeoutsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      toastTimeoutsRef.current.delete(id);
    }

    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((message, type = "success") => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timeoutId = window.setTimeout(() => {
      dismissToast(id);
    }, TOAST_DURATION_MS);
    toastTimeoutsRef.current.set(id, timeoutId);
  }, [dismissToast]);

  useEffect(() => {
    return () => {
      for (const timeoutId of toastTimeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      toastTimeoutsRef.current.clear();
    };
  }, []);

  const refreshOrders = useCallback(async ({ authOverride = auth, showLoader = false } = {}) => {
    if (!authOverride || refreshInFlightRef.current) return false;
    refreshInFlightRef.current = true;
    if (showLoader) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const data = await fetchAccountsOrders(authOverride);
      setOrders(data);
      return true;
    } catch (error) {
      pushToast(error.message || "Failed to fetch orders.", "error");
      return false;
    } finally {
      refreshInFlightRef.current = false;
      if (showLoader) {
        setInitialLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [auth, pushToast]);

  useEffect(() => {
    if (!auth) return undefined;

    const intervalId = window.setInterval(() => {
      void refreshOrders();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [auth, refreshOrders]);

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
      const ok = await refreshOrders({ authOverride: loginAuth, showLoader: true });
      if (!ok) {
        setAuth(null);
      }
    },
    [refreshOrders]
  );

  const handleLogout = useCallback(() => {
    disableGoogleAutoSelect();
    setAuth(null);
    setOrders([]);
    setBusyMap({});
    setInitialLoading(false);
    setRefreshing(false);
    refreshInFlightRef.current = false;
    setLogoutOpen(false);
  }, []);

  if (!auth) {
    return (
      <>
        <LoginGate onLoginSuccess={handleLogin} />
        <ToastHost toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <AppShell>
      <Header user={auth} onRefresh={() => void refreshOrders()} refreshing={refreshing} onLogout={() => setLogoutOpen(true)} />
      {initialLoading ? (
        <Loader label="Loading orders..." />
      ) : (
        <DashboardPage
          orders={orders}
          busyMap={busyMap}
          onUploadFinal={handleUploadFinal}
          onUploadAdditional={handleUploadAdditional}
        />
      )}
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
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
