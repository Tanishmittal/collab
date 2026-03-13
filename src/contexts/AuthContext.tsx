import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  influencerProfileId: string | null;
  brandProfileId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  influencerProfileId: null,
  brandProfileId: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [influencerProfileId, setInfluencerProfileId] = useState<string | null>(null);
  const [brandProfileId, setBrandProfileId] = useState<string | null>(null);

  const fetchProfiles = async (userId: string) => {
    try {
      // Use maybeSingle to handle cases where profile might not exist yet
      const [influencerRes, brandRes] = await Promise.all([
        supabase.from("influencer_profiles").select("id").eq("user_id", userId).maybeSingle(),
        supabase.from("brand_profiles").select("id").eq("user_id", userId).maybeSingle()
      ]);
      setInfluencerProfileId(influencerRes.data?.id ?? null);
      setBrandProfileId(brandRes.data?.id ?? null);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfiles(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Only trigger fetch if the user actually changed or signed in
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            setLoading(true);
            await fetchProfiles(session.user.id);
          } else {
            setInfluencerProfileId(null);
            setBrandProfileId(null);
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
    setInfluencerProfileId(null);
    setBrandProfileId(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, influencerProfileId, brandProfileId, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
