// store.jsx — shared state across both surfaces.
// A client booking pushes a real request into the agency queue; when the
// agency approves/refuses, the client confirmation screen reflects it live.

const StoreContext = React.createContext(null);
function useStore() { return React.useContext(StoreContext); }

let _seq = 100;
const nextId = () => `req-${++_seq}`;

function StoreProvider({ children }) {
  const [requests, setRequests] = React.useState(() => SEED_REQUESTS.map(r => ({ ...r })));
  const [blacklist, setBlacklist] = React.useState(() => SEED_BLACKLIST.map(b => ({ ...b })));
  const [toast, setToast] = React.useState(null);

  const showToast = React.useCallback((msg, tone = 'ok') => {
    setToast({ msg, tone, id: Date.now() });
    setTimeout(() => setToast(t => (t && Date.now() - t.id >= 2400) ? null : t), 2600);
  }, []);

  // Client → agency: create a pending request from a completed booking.
  const addRequest = React.useCallback((payload) => {
    const id = nextId();
    const req = {
      id, status: 'pending', createdAt: 'à l\'instant', justNow: true,
      ...payload,
    };
    setRequests(rs => [req, ...rs]);
    return id;
  }, []);

  const setRequestStatus = React.useCallback((id, status) => {
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status, justNow: false } : r));
  }, []);

  const addBlacklist = React.useCallback((entry) => {
    setBlacklist(bl => [{ id: `bl-${Date.now()}`, ...entry }, ...bl]);
  }, []);

  const value = {
    requests, blacklist, toast,
    addRequest, setRequestStatus, addBlacklist, showToast,
    pendingCount: requests.filter(r => r.status === 'pending').length,
  };
  return React.createElement(StoreContext.Provider, { value }, children);
}

Object.assign(window, { StoreProvider, useStore });
