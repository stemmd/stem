import type React from "react";

export const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--paper)" },
  main: { maxWidth: 960, margin: "0 auto", padding: "40px 24px" },

  stemHeader: { marginBottom: 40 },
  stemEmoji: { fontSize: 40, lineHeight: 1, display: "block", marginBottom: 8 },
  stemMeta: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  authorLink: {
    fontFamily: "'DM Mono', monospace", fontSize: 13,
    color: "var(--ink-light)", textDecoration: "none",
  },
  stemTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(28px, 5vw, 48px)",
    fontWeight: 400, color: "var(--ink)", lineHeight: 1.2, marginBottom: 12,
  },
  stemDesc: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 16,
    color: "var(--ink-mid)", lineHeight: 1.6, marginBottom: 20, maxWidth: 520,
  },
  stemActions: {
    display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const,
  },
  followPill: {
    display: "inline-block", padding: "7px 18px",
    border: "1px solid var(--forest)", borderRadius: 20,
    color: "var(--forest)", background: "transparent",
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13,
    cursor: "pointer", textDecoration: "none", transition: "all 0.15s",
  },
  subtleBtn: {
    background: "none", border: "none",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-light)", cursor: "pointer", padding: 0,
    textDecoration: "underline", textDecorationColor: "var(--paper-dark)",
  },
  followCount: {
    fontFamily: "'DM Mono', monospace", fontSize: 12,
    color: "var(--ink-light)", marginLeft: "auto",
  },
  followerPopup: {
    position: "absolute" as const, right: 0, top: "100%", marginTop: 8,
    background: "var(--surface)", border: "1px solid var(--paper-dark)",
    borderRadius: 10, padding: 8, minWidth: 200, maxHeight: 240,
    overflowY: "auto" as const, zIndex: 100,
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
  },
  followerRow: {
    display: "flex", alignItems: "center", gap: 10, padding: "6px 8px",
    textDecoration: "none", color: "var(--ink)", borderRadius: 6,
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
  },
  followerAvatar: {
    width: 24, height: 24, borderRadius: "50%", background: "var(--paper-mid)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 9, fontWeight: 600, color: "var(--ink-mid)", flexShrink: 0,
    overflow: "hidden" as const,
  },
  followerEmpty: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-light)", padding: "8px 12px",
  },

  // Add artifact form
  contributeBtn: {
    display: "block", width: "100%", padding: "12px 20px",
    background: "transparent", border: "1.5px dashed var(--paper-dark)",
    borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: "var(--ink-mid)", cursor: "pointer", marginBottom: 32, textAlign: "center" as const,
  },
  addArtifactForm: {
    display: "flex", flexDirection: "column" as const, gap: 10,
    marginBottom: 40, padding: 20,
    background: "var(--surface)", border: "1px solid var(--paper-dark)", borderRadius: 12,
  },
  urlRow: { display: "flex", alignItems: "center", gap: 8 },
  urlInput: {
    flex: 1, padding: "10px 14px",
    background: "var(--paper-mid)", border: "1.5px solid var(--paper-dark)",
    borderRadius: 8, fontSize: 14,
    fontFamily: "'DM Mono', monospace", color: "var(--ink)", outline: "none",
  },
  fetchingDot: {
    fontFamily: "'DM Mono', monospace", color: "var(--ink-light)", fontSize: 20,
  },
  previewCard: {
    display: "flex", gap: 12, padding: "10px 14px",
    background: "var(--paper)", borderRadius: 8, alignItems: "flex-start",
  },
  previewThumb: {
    width: 48, height: 48, borderRadius: 6,
    objectFit: "cover" as const, flexShrink: 0,
  },
  previewTitle: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    fontWeight: 500, color: "var(--ink)", marginBottom: 4,
  },
  previewDomain: {
    display: "flex", alignItems: "center", gap: 4,
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)",
  },
  noteRow: { display: "flex", gap: 8, alignItems: "center" },
  noteInput: {
    flex: 1, padding: "8px 14px",
    background: "var(--paper-mid)", border: "1.5px solid var(--paper-dark)",
    borderRadius: 8, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", color: "var(--ink)", outline: "none",
  },
  addBtn: {
    padding: "8px 20px", background: "var(--forest)", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
    whiteSpace: "nowrap" as const, flexShrink: 0,
  },

  // Artifact list
  artifactsList: { display: "flex", flexDirection: "column" as const, gap: 12 },
  artifactCard: {
    display: "flex", flexDirection: "column" as const, gap: 10, padding: 16,
    background: "var(--surface)", border: "1px solid var(--paper-dark)", borderRadius: 12,
    animation: "fadeUp 0.2s ease",
  },
  artifactThumb: {
    width: 48, height: 48, borderRadius: 6,
    objectFit: "cover" as const, flexShrink: 0,
  },
  artifactBody: {
    display: "flex", flexDirection: "column" as const, gap: 4, minWidth: 0,
  },
  artifactTitle: {
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 15,
    color: "var(--ink)", textDecoration: "none",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
    display: "block",
  },
  artifactNote: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-mid)", fontStyle: "italic" as const,
  },
  artifactFooter: {
    display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginTop: 2,
  },
  artifactDomain: {
    display: "flex", alignItems: "center", gap: 4,
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)",
  },
  contributor: {
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)",
  },
  timestamp: {
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)",
  },
  reportBtn: {
    background: "none", border: "none", padding: "0 4px",
    fontFamily: "sans-serif", fontSize: 14, color: "var(--ink-light)",
    cursor: "pointer", opacity: 0.6,
  },
  deleteBtn: {
    background: "none", border: "none", padding: "0 4px",
    fontSize: 18, lineHeight: 1, color: "var(--ink-light)",
    cursor: "pointer", opacity: 0.5,
  },

  empty: {
    fontFamily: "'DM Serif Display', serif", fontStyle: "italic" as const,
    fontSize: 18, color: "var(--ink-light)", textAlign: "center" as const, padding: "60px 0",
  },

  stemCatRow: {
    display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 16,
  },
  stemCatPill: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--forest)",
    background: "var(--leaf)", border: "1px solid var(--leaf-border)",
    padding: "3px 10px", borderRadius: 20,
  },
  branchBadge: {
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--forest)",
    background: "var(--leaf)", padding: "2px 8px", borderRadius: 10,
  },
  privateBadge: {
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-light)",
    background: "var(--paper-mid)", padding: "2px 8px", borderRadius: 10,
  },
  branchMemberRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 12px", background: "var(--surface)",
    border: "1px solid var(--paper-dark)", borderRadius: 8,
  },
  branchMemberName: {
    fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--ink)",
  },
  branchMemberDisplay: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-light)",
  },
  closedNote: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-light)",
    fontStyle: "italic" as const, marginBottom: 32, textAlign: "center" as const,
  },

  // My pending artifacts (non-owner)
  myPendingSection: {
    marginBottom: 24, padding: "12px 16px",
    background: "var(--paper-mid)", borderRadius: 10,
    border: "1px dashed var(--paper-dark)",
  },
  myPendingLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)", marginBottom: 8,
  },
  pendingCard: {
    display: "flex", flexDirection: "column" as const, gap: 4,
  },
  pendingBadge: {
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    color: "var(--ink-light)", background: "var(--paper-dark)",
    padding: "2px 8px", borderRadius: 10, alignSelf: "flex-start" as const,
  },
  pendingTitle: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--ink)",
    textDecoration: "none", fontWeight: 500,
  },

  // Pending suggestions section (owner)
  pendingSection: {
    marginTop: 40, borderTop: "1px solid var(--paper-dark)", paddingTop: 24,
  },
  pendingToggle: {
    background: "none", border: "none", padding: 0, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
    color: "var(--ink)", display: "flex", alignItems: "center", gap: 6,
  },
  pendingCount: {
    background: "var(--forest)", color: "#fff",
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    padding: "2px 7px", borderRadius: 10,
  },
  pendingList: {
    display: "flex", flexDirection: "column" as const, gap: 12, marginTop: 16,
  },
  pendingRow: {
    display: "flex", alignItems: "flex-start", gap: 16,
    padding: 16, background: "var(--surface)", border: "1px solid var(--paper-dark)", borderRadius: 10,
  },
  pendingNote: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-mid)",
    fontStyle: "italic" as const, marginTop: 2,
  },
  pendingMeta: {
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)", marginTop: 4,
  },
  approveBtn: {
    padding: "6px 14px", background: "var(--forest)", color: "#fff",
    border: "none", borderRadius: 6, fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: "pointer",
  },
  rejectBtn: {
    padding: "6px 14px", background: "none", color: "var(--taken)",
    border: "1px solid var(--taken)", borderRadius: 6, fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },

  // Settings section (owner)
  settingsSection: {
    marginTop: 40, borderTop: "1px solid var(--paper-dark)", paddingTop: 24,
  },
  settingsToggle: {
    background: "none", border: "none", padding: 0, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-light)",
    display: "flex", alignItems: "center", gap: 6,
  },
  settingsForm: {
    display: "flex", flexDirection: "column" as const, gap: 20,
    marginTop: 16, padding: 20,
    background: "var(--paper-mid)", borderRadius: 10,
    border: "1px solid var(--paper-dark)",
  },
  settingsDivider: {
    height: 1, background: "var(--paper-dark)",
  },
  settingsSaveBtn: {
    padding: "8px 20px", background: "var(--forest)", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  typePickerRow: {
    display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 4,
  },
  typePill: {
    padding: "3px 10px", borderRadius: 20, border: "1.5px solid",
    fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
    background: "transparent", transition: "background 0.1s, border-color 0.1s",
  },
  artifactTypeBadge: {
    fontSize: 13, flexShrink: 0,
  },
  artifactQuote: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic" as const,
    fontSize: 14,
    color: "var(--ink-mid)",
    borderLeft: "2px solid var(--paper-dark)",
    paddingLeft: 10,
    margin: "6px 0",
    lineHeight: 1.5,
  },
  quoteInput: {
    width: "100%",
    padding: "8px 12px",
    background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic" as const,
    color: "var(--ink)",
    outline: "none",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
  },
  editForm: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    padding: "12px",
    background: "var(--paper-mid)",
    borderRadius: 8,
    border: "1px solid var(--paper-dark)",
  },
  dangerBtn: {
    padding: "8px 16px", background: "transparent",
    color: "var(--taken)", border: "1px solid var(--taken)",
    borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  settingsFieldLabel: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-mid)", fontWeight: 500,
  },
  settingsEmojiCustom: {
    width: 56, height: 48, borderRadius: 8,
    border: "1.5px solid var(--paper-dark)",
    background: "var(--paper-mid)", fontSize: 26,
    textAlign: "center" as const, outline: "none", padding: 0,
    fontFamily: "sans-serif", color: "var(--ink)", marginTop: 8,
  },

  signupPrompt: {
    padding: "24px 32px",
    borderTop: "1px solid var(--paper-dark)",
    background: "var(--leaf)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    flexWrap: "wrap" as const,
  },
  signupText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-mid)",
    textAlign: "center" as const,
  },
  signupBtn: {
    padding: "8px 20px",
    background: "var(--forest)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none",
    flexShrink: 0,
  },

  // Tab styles
  tabRow: {
    display: "flex", gap: 0, borderBottom: "1px solid var(--paper-dark)",
    marginBottom: 12,
  },
  tabBtn: {
    background: "none", border: "none", borderBottom: "2px solid transparent",
    padding: "6px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
  },
  noteBody: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: "var(--ink)", lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
  },
  comingSoon: {
    display: "flex", flexDirection: "column" as const, alignItems: "center",
    justifyContent: "center", gap: 8, padding: "32px 16px",
  },
  comingSoonText: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: "var(--ink-mid)", textAlign: "center" as const,
  },

  // Drag handle
  dragHandle: {
    position: "absolute" as const,
    left: -20,
    top: 12,
    cursor: "grab",
    color: "var(--ink-light)",
    fontSize: 14,
    lineHeight: 1,
    opacity: 0.4,
    userSelect: "none" as const,
    transition: "opacity 0.15s",
  },

  // Node styles
  nodeSection: {
    marginBottom: 8,
    borderLeft: "2px solid var(--paper-dark)",
  },
  nodeHeader: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 14px",
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontSize: 15,
    color: "var(--ink)", width: "100%", textAlign: "left" as const,
  },
  nodeChevron: {
    fontSize: 12, color: "var(--ink-light)", flexShrink: 0, width: 14,
  },
  nodeEmoji: {
    fontSize: 18, flexShrink: 0,
  },
  nodeTitle: {
    fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15,
    color: "var(--ink)", flex: 1, minWidth: 0,
  },
  nodeCount: {
    fontFamily: "'DM Mono', monospace", fontSize: 12,
    color: "var(--ink-light)", flexShrink: 0,
  },
  nodeContent: {
    paddingLeft: 14, paddingBottom: 8,
    display: "flex", flexDirection: "column" as const, gap: 8,
  },
  nodeDesc: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-mid)", paddingLeft: 22, marginBottom: 4,
  },
  nodeActions: {
    display: "flex", gap: 12, paddingLeft: 22, marginTop: 4,
  },
  addNodeBtn: {
    display: "block", padding: "8px 16px",
    background: "none", border: "1.5px dashed var(--paper-dark)",
    borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-light)", cursor: "pointer", marginTop: 4, marginBottom: 8,
  },
  addNodeForm: {
    display: "flex", flexDirection: "column" as const, gap: 8,
    padding: "12px 16px", marginTop: 4, marginBottom: 8,
    background: "var(--paper-mid)", borderRadius: 8,
    border: "1px solid var(--paper-dark)",
  },
  rootArtifactsLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: 12,
    color: "var(--ink-light)", textTransform: "uppercase" as const,
    letterSpacing: "0.08em", marginTop: 24, marginBottom: 8,
    paddingBottom: 8, borderBottom: "1px solid var(--paper-dark)",
  },
  mapToggle: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 32, height: 32, borderRadius: 8,
    background: "var(--paper-mid)", border: "1px solid var(--paper-dark)",
    cursor: "pointer", color: "var(--ink-light)", marginBottom: 16,
    marginLeft: "auto",
  },
  alsoInRow: {
    display: "flex", alignItems: "center", gap: 6,
    flexWrap: "wrap" as const, marginTop: 4,
  },
  alsoInLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    color: "var(--ink-light)",
  },
  alsoInTag: {
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    color: "var(--forest)", background: "var(--leaf)",
    padding: "1px 8px", borderRadius: 10,
    border: "1px solid var(--leaf-border)",
  },

  // Quick search integrations (YouTube, arXiv, Wikipedia)
  quickSearchRow: {
    display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" as const,
  },
  quickSearchLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-light)",
  },
  quickSearchBtn: {
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    padding: "4px 10px", borderRadius: 6,
    border: "1px solid var(--paper-dark)", background: "var(--surface)",
    color: "var(--ink-mid)", cursor: "pointer",
  },
  searchPanel: {
    border: "1px solid var(--paper-dark)", borderRadius: 10,
    padding: 12, marginTop: 8, background: "var(--surface)",
  },
  searchInputRow: {
    display: "flex", gap: 8, marginBottom: 8,
  },
  searchInput: {
    flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    padding: "8px 12px", borderRadius: 8,
    border: "1px solid var(--paper-dark)", background: "var(--paper)",
    color: "var(--ink)", outline: "none",
  },
  searchBtn: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    padding: "8px 16px", borderRadius: 8,
    border: "none", background: "var(--forest)", color: "white",
    cursor: "pointer", fontWeight: 500,
  },
  searchCloseBtn: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    padding: "8px 12px", borderRadius: 8,
    border: "1px solid var(--paper-dark)", background: "none",
    color: "var(--ink-light)", cursor: "pointer",
  },
  searchResult: {
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "8px 10px", borderRadius: 8, border: "none",
    background: "none", cursor: "pointer", width: "100%",
    textAlign: "left" as const, fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.15s",
  },
  searchResultTitle: {
    fontSize: 13, color: "var(--ink)", fontWeight: 500, lineHeight: 1.3,
  },
  searchResultMeta: {
    fontSize: 11, color: "var(--ink-light)", fontFamily: "'DM Mono', monospace", marginTop: 2,
  },
  searchResultThumb: {
    width: 80, height: 45, borderRadius: 4, objectFit: "cover" as const, flexShrink: 0,
  },
};
