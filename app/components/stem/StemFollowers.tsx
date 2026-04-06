import { useState, useEffect, useRef } from "react";
import { Link } from "@remix-run/react";
import { API_BASE } from "~/lib/config";
import { styles } from "./stem-styles";

export function StemFollowers({ stemId, count }: { stemId: string; count: number }) {
  const [open, setOpen] = useState(false);
  const [followers, setFollowers] = useState<{ username: string; display_name: string | null; avatar_url: string | null }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = async () => {
    if (count === 0) return;
    setOpen(!open);
    if (!loaded) {
      try {
        const res = await fetch(`${API_BASE}/stems/${stemId}/followers`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json() as { followers?: { username: string; display_name: string | null; avatar_url: string | null }[] };
          setFollowers(data.followers || []);
        }
      } catch { /* ignore */ }
      setLoaded(true);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        style={{
          ...styles.followCount,
          cursor: count > 0 ? "pointer" : "default",
          background: "none",
          border: "none",
          padding: 0,
        }}
      >
        {count} {count === 1 ? "follower" : "followers"}
      </button>
      {open && (
        <div style={styles.followerPopup}>
          {followers.length === 0 ? (
            <p style={styles.followerEmpty}>Loading...</p>
          ) : (
            followers.map((f) => (
              <Link
                key={f.username}
                to={`/${f.username}`}
                style={styles.followerRow}
                onClick={() => setOpen(false)}
              >
                <span style={styles.followerAvatar}>
                  {f.avatar_url ? (
                    <img src={f.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                  ) : (
                    f.username.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span>{f.display_name || f.username}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
