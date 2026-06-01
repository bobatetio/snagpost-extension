import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Sun, X } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { EmptyState } from "./EmptyState";
import { AuthFlow } from "./auth/AuthFlow";
import {
  EngagementCard,
  PostTypeBreakdown,
  EngagementComposition,
  TopPostsList,
  DayOfWeekChart,
} from "./Analytics";
import type { FacebookPost, ProfileContext } from "../lib/facebook/types";

/* SocialPulse panel — 1:1 with the Figma file.
 *
 * Outer pale-lavender frame holds a wordmark header + a pill containing the
 * theme toggle and close button. Below sits a dark navy inner panel that
 * scrolls: profile glass strip, iridescent Export button, then the analytics
 * sections in fixed order.
 */

interface PanelProps {
  open: boolean;
  onClose: () => void;
  profile: ProfileContext | null;
  posts: FacebookPost[];
  capturing: boolean;
  signedIn: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenDashboard?: () => void;
}

const DASHBOARD_URL = "https://app.socialpulse.com/library";

export function Panel({
  open,
  onClose,
  profile,
  posts,
  capturing,
  signedIn,
  theme,
  onToggleTheme,
  onOpenDashboard,
}: PanelProps) {
  // AuthFlow stays mounted until onboarding completes — not until signedIn flips.
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const showAuthFlow = onboarded === false;

  useEffect(() => {
    let alive = true;
    if (!signedIn) {
      setOnboarded(false);
      return;
    }
    void hasOnboardingFlag().then((flag) => {
      if (alive) setOnboarded(flag);
    });
    return () => {
      alive = false;
    };
  }, [signedIn]);

  // Export: download a JSON snapshot then open the dashboard.
  const handleExport = () => {
    const payload = { exportedAt: new Date().toISOString(), profile, posts };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = profile?.username ?? "posts";
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `socialpulse-${slug}-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (onOpenDashboard) onOpenDashboard();
    else window.open(DASHBOARD_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <aside
      className="panel"
      data-open={open}
      data-capturing={capturing}
      aria-hidden={!open}
      aria-label="SocialPulse panel"
    >
      <header className="panel-header">
        <Wordmark />
        <div className="panel-header-pill">
          <button
            type="button"
            className="panel-header-btn"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            <Sun size={14} strokeWidth={2.25} />
          </button>
          <span className="panel-header-sep" aria-hidden="true" />
          <button
            type="button"
            className="panel-header-btn"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X size={14} strokeWidth={2.25} />
          </button>
        </div>
      </header>

      <div className="panel-inner" data-auth={showAuthFlow}>
        {showAuthFlow ? (
          <AuthFlow onComplete={() => setOnboarded(true)} />
        ) : (
          <>
            <div className="sp-sticky-stack">
              <div className="sp-profile-card">
                <div className="sp-profile-badge">
                  <span className="sp-profile-badge-num">{posts.length}</span>
                  <span className="sp-profile-badge-label">Collected</span>
                </div>
                <div className="sp-profile-body">
                  <span className="sp-profile-line-muted">Scanning Profile</span>
                  <strong className="sp-profile-line-strong">
                    @{profile?.username ?? "—"}
                  </strong>
                  <span className="sp-profile-line-muted">Scroll Down To Collect More Posts</span>
                </div>
                {capturing ? (
                  <span className="sp-synced-pill" data-state="capturing">
                    <span className="sp-pulse-dot" aria-hidden="true" />
                    Capturing
                  </span>
                ) : (
                  <span className="sp-synced-pill" data-state="synced">
                    <Check size={11} strokeWidth={2.75} aria-hidden="true" />
                    Synced
                  </span>
                )}
              </div>

              <button
                type="button"
                className="sp-export-cta"
                onClick={signedIn ? handleExport : () => setOnboarded(false)}
                aria-label={
                  signedIn
                    ? `Export ${posts.length} captured posts to the dashboard`
                    : `Sign up to export ${posts.length} captured posts`
                }
              >
                <span>{signedIn ? "Export To Dashboard" : "Sign Up To Export"}</span>
                <ArrowUpRight size={16} strokeWidth={2.25} aria-hidden="true" />
              </button>
            </div>

            {!profile ? (
              <EmptyState variant="no-profile" />
            ) : posts.length === 0 ? (
              <EmptyState variant="no-posts" />
            ) : (
              <>
                <EngagementCard posts={posts} />
                <PostTypeBreakdown posts={posts} />
                <EngagementComposition posts={posts} />
                <TopPostsList posts={posts} />
                <DayOfWeekChart posts={posts} />
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

// Mirror of the storage key AuthFlow writes to.
const ONBOARDING_KEY = "socialpulse.onboarding.v1";

async function hasOnboardingFlag(): Promise<boolean> {
  if (typeof chrome !== "undefined" && chrome?.storage?.local) {
    const r = await chrome.storage.local.get(ONBOARDING_KEY);
    return !!r[ONBOARDING_KEY];
  }
  return !!localStorage.getItem(ONBOARDING_KEY);
}
