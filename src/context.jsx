import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { LOCAL_USER } from "./lib/constants";
import { emptyData } from "./lib/domain";
import {
  configured,
  configurationError,
  localAllowed,
  supabase,
  createCloudRepository,
  createLocalRepository,
} from "./lib/repository";
import { errorMessage } from "./lib/schema";

const Context = createContext(null);
export const useWorkspace = () => useContext(Context);
export function WorkspaceProvider({
  children,
  repository: injectedRepository,
  initialUser,
}) {
  const [user, setUser] = useState(initialUser || null);
  const [authLoading, setAuthLoading] = useState(!initialUser && configured);
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const version = useRef(0);
  const busy = useRef(false);
  const repository = useRef(
    injectedRepository ||
      (configured ? createCloudRepository(supabase) : createLocalRepository()),
  );
  const currentData = useRef(data);
  useEffect(() => {
    currentData.current = data;
  }, [data]);
  useEffect(() => {
    if (initialUser || !supabase) return;
    let active = true,
      authRevision = 0;
    const acceptUser = (next) =>
      setUser((previous) => (previous?.id === next?.id ? previous : next));
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active || authRevision > 0) return;
        if (error && error.name !== "AuthSessionMissingError")
          setError(errorMessage(error));
        acceptUser(data?.user || null);
        setAuthLoading(false);
      })
      .catch((e) => {
        if (active) {
          setError(errorMessage(e));
          setAuthLoading(false);
        }
      });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        authRevision++;
        if (active) {
          acceptUser(session?.user || null);
          setAuthLoading(false);
        }
      },
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [initialUser]);
  const reload = useCallback(async () => {
    if (!user) return;
    const request = ++version.current;
    setLoading(true);
    setError("");
    try {
      const result = await repository.current.load(user.id);
      if (request === version.current) {
        currentData.current = result;
        setData(result);
      }
    } catch (e) {
      if (request === version.current) setError(errorMessage(e));
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    version.current++;
    setData(emptyData());
    currentData.current = emptyData();
    setError("");
    setNotice("");
    if (user) reload();
    // This is an async request generation counter, not a DOM ref.
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      version.current++;
    };
  }, [user, reload]);
  const mutate = async (command, message = "Saved") => {
    if (busy.current)
      throw new Error("A save is still in progress. Please wait.");
    if (!user || loading) throw new Error("Workspace is not ready");
    const request = version.current;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const before = currentData.current,
        next = structuredClone(before);
      const result = command(next, user.id);
      const committed = await repository.current.commit(before, next, user.id);
      if (request === version.current) {
        currentData.current = committed;
        setData(committed);
        setNotice(message);
      }
      return result;
    } catch (e) {
      if (request === version.current) setError(errorMessage(e));
      throw e;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  const enterLocal = () => {
    if (localAllowed) setUser({ id: LOCAL_USER, email: "Local workspace" });
  };
  const signOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(errorMessage(error));
        return;
      }
    }
    version.current++;
    setUser(null);
    setData(emptyData());
  };
  return (
    <Context.Provider
      value={{
        user,
        data,
        loading,
        saving,
        error,
        notice,
        setNotice,
        authLoading,
        reload,
        mutate,
        enterLocal,
        signOut,
        configured,
        configurationError,
        localAllowed,
      }}
    >
      {children}
    </Context.Provider>
  );
}
