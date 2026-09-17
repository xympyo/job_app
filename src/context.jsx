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
import { createLocalProfileRepository, createCloudProfileRepository } from "./v2/profile-repository.js";
import { markTutorialSeen as markSeen, readTutorialState, writeTutorialState } from "./lib/tutorial-state";

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
  const [profileView, setProfileView] = useState({ profile: null, draft: null, current: null, history: [], loading: false, error: "", available: true });
  const [tutorialState, setTutorialState] = useState({});
  const version = useRef(0);
  const busy = useRef(false);
  const repository = useRef(
    injectedRepository ||
      (configured ? createCloudRepository(supabase) : createLocalRepository()),
  );
  const profileRepository = useRef(
    injectedRepository?.profileRepository || (configured ? createCloudProfileRepository(supabase) : createLocalProfileRepository()),
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
    setProfileView((value) => ({ ...value, profile: null, draft: null, current: null, history: [], error: "", loading: Boolean(user), available: !configured }));
    setTutorialState(user ? readTutorialState(window.localStorage, user.id) : {});
    if (user) reload();
    // This is an async request generation counter, not a DOM ref.
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      version.current++;
    };
  }, [user, reload]);
  const reloadProfile = useCallback(async () => {
    if (!user) return;
    // Cloud capability is available when the profile RPC/table surface exists.
    // An explicit false flag remains a safe emergency opt-out; undefined is no
    // longer treated as disabled so a verified production schema can activate
    // the generic Career path without a user-specific branch.
    if (configured && import.meta.env.VITE_V2_PROFILE_ENABLED === "false") {
      setProfileView({ profile: null, draft: null, current: null, history: [], loading: false, error: "", available: false });
      return;
    }
    setProfileView((value) => ({ ...value, loading: true, error: "" }));
    try {
      const repo = profileRepository.current;
      const profile = repo.createProfile ? await repo.createProfile(user.id) : null;
      const profileId = profile?.id;
      const [current, draft, history] = profileId && repo.current ? await Promise.all([repo.current(profileId, user.id), repo.draft(profileId, user.id), repo.history(profileId, user.id)]) : [null, null, []];
      setProfileView({ profile, draft, current, history, loading: false, error: "", available: true });
    } catch (e) {
      setProfileView((value) => ({ ...value, loading: false, error: errorMessage(e), available: false }));
    }
  }, [user]);
  useEffect(() => { if (user) reloadProfile(); }, [user, reloadProfile]);
  const profileCommand = useCallback(async (command) => {
    if (!user || !profileView.available) throw new Error("Profile setup is not available in this workspace yet.");
    try {
      const result = await command(profileRepository.current, user.id);
      await reloadProfile();
      return result;
    } catch (e) { setProfileView((value) => ({ ...value, error: errorMessage(e) })); throw e; }
  }, [user, profileView.available, reloadProfile]);
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
    setProfileView({ profile: null, draft: null, current: null, history: [], loading: false, error: "", available: true });
    // Keep this user's browser-scoped guidance preferences across logout. The
    // next authenticated user loads only their own namespaced state.
    setTutorialState({});
  };
  const markTutorialSeen = useCallback((milestone) => {
    if (!user || !milestone) return;
    setTutorialState(markSeen(window.localStorage, user.id, milestone));
  }, [user]);
  const resetTutorial = useCallback(() => {
    if (!user) return;
    const state = { reopenChecklist: true };
    writeTutorialState(window.localStorage, user.id, state);
    setTutorialState(state);
  }, [user]);
  const dismissGettingStarted = useCallback(() => {
    if (!user) return;
    const state = { ...tutorialState, reopenChecklist: false, dismissedChecklist: true };
    writeTutorialState(window.localStorage, user.id, state);
    setTutorialState(state);
  }, [user, tutorialState]);
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
        profile: profileView,
        reloadProfile,
        profileCommand,
        configured,
        configurationError,
        localAllowed,
        tutorial: { state: tutorialState },
        markTutorialSeen,
        resetTutorial,
        dismissGettingStarted,
      }}
    >
      {children}
    </Context.Provider>
  );
}
