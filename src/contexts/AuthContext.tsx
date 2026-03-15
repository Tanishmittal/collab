import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  influencerId: string | null;
  brandId: string | null;
  signOut: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  influencerId: null,
  brandId: null,
  signOut: async () => {},
  refreshProfiles: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [influencerId, setInfluencerId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);

  // Track ongoing profile fetches to prevent redundant parallel calls
  const profileFetchingRef = useRef<string | null>(null);

  const fetchProfiles = async (uid: string) => {
    if (profileFetchingRef.current === uid) {
      console.log("[AuthContext] Profiles already being fetched for user:", uid);
      return;
    }
    
    profileFetchingRef.current = uid;
    console.log("[AuthContext] Fetching profiles for userId:", uid);
    
    const profileTimeout = setTimeout(() => {
      console.warn("[AuthContext] Profile fetching timed out, unblocking UI");
      if (profileFetchingRef.current === uid) {
        setLoading(false);
        profileFetchingRef.current = null;
      }
    }, 5000);

    try {
      console.log(`[AuthContext] fetchProfiles starting for ${uid}`);
      
      const [influencerRes, brandRes] = await Promise.all([
        supabase.from("influencer_profiles").select("id").eq("user_id", uid).maybeSingle(),
        supabase.from("brand_profiles").select("id").eq("user_id", uid).maybeSingle(),
      ]);
      
      console.log("[AuthContext] Profile fetch results:", { 
        influencerId: influencerRes.data?.id, 
        brandId: brandRes.data?.id,
        infError: influencerRes.error,
        brandError: brandRes.error 
      });

      setInfluencerId(influencerRes.data?.id ?? null);
      setBrandId(brandRes.data?.id ?? null);
    } catch (error) {
      console.error("[AuthContext] Error fetching profiles:", error);
    } finally {
      clearTimeout(profileTimeout);
      setLoading(false);
      profileFetchingRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log("[AuthContext] Initializing auth...");
      
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null }; error: Error }>((_, reject) => {
        setTimeout(() => reject(new Error("getSession_timeout")), 2000);
      });

      try {
        console.log("[AuthContext] Getting session (with 2s timeout)...");
        const raceResult = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: Session | null }; error: any };
        const { data: { session }, error } = raceResult;
        
        console.log("[AuthContext] Session result:", { hasSession: !!session, error });
        if (!mounted) return;

        if (error) {
          console.error("[AuthContext] getSession error:", error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfiles(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error: any) {
        if (error.message === "getSession_timeout") {
          console.warn("[AuthContext] getSession timed out, relying on event subscription.");
          // We don't call setLoading(false) here because onAuthStateChange might fire soon
          // But if it doesn't fire within another 1s, we should unblock
          setTimeout(() => {
            if (mounted) {
              setLoading(currentLoading => {
                if (currentLoading) {
                  console.log("[AuthContext] No event fired after timeout, unblocking UI");
                  return false;
                }
                return currentLoading;
              });
            }
          }, 1000);
        } else {
          console.error("[AuthContext] Auth initialization error:", error);
          if (mounted) setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext] Auth state change event: ${event}`, { 
          hasSession: !!session,
          userId: session?.user?.id,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'
        });
        
        if (!mounted) return;
        
        // Only trigger fetch if the user actually changed or signed in
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            setLoading(true);
            fetchProfiles(session.user.id);
          } else {
            setInfluencerId(null);
            setBrandId(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setInfluencerId(null);
    setBrandId(null);
  };

  const refreshProfiles = async () => {
    if (user) {
      await fetchProfiles(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, influencerId, brandId, signOut, refreshProfiles }}>
      {children}
    </AuthContext.Provider>
  );
};
