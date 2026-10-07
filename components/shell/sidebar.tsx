"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  Check,
  ChevronsUpDown,
  CircleHelp,
  Columns3,
  Ellipsis,
  FileText,
  GraduationCap,
  Inbox,
  MessageSquareText,
  ScrollText,
  Search,
  ShieldCheck,
  Sunrise,
  UsersRound,
  X,
} from "lucide-react";
import { ROLE_LABEL } from "@/lib/agency";
import { RECRUITER } from "@/lib/data";
import { money, needsAttention } from "@/lib/deal";
import { useDesk } from "@/lib/store";
import { tourFor } from "@/lib/tours";
import { ActorAvatar } from "../ui/member";
import { AmaraMark, Kbd, cx } from "../ui/primitives";

type NavItem = { href: string; label: string; icon: typeof Sunrise; count?: number; attention?: boolean };

export function useNav() {
  const { deals, followUps, applicants, approvals, isOwner } = useDesk();
  const toReview = applicants.filter((a) => a.status === "new").length;
  const pending = approvals.filter((a) => a.status === "pending").length;
  const groups: { label?: string; items: NavItem[] }[] = [
    { items: [{ href: "/", label: "Today", icon: Sunrise }] },
    {
      label: "Recruit",
      items: [
        { href: "/clients", label: "Clients", icon: Building2 },
        { href: "/applicants", label: "Applicants", icon: Inbox, count: toReview },
        { href: "/candidates", label: "Candidates", icon: UsersRound },
        { href: "/pipeline", label: "Pipeline", icon: Columns3, count: deals.filter(needsAttention).length, attention: true },
        { href: "/follow-ups", label: "Follow-ups", icon: MessageSquareText, count: followUps.length },
      ],
    },
    {
      label: "Business",
      items: [
        { href: "/documents", label: "Documents", icon: FileText },
        { href: "/sum", label: "The Sum", icon: Calculator },
      ],
    },
    {
      label: "Agency",
      items: [
        { href: "/team", label: "Team", icon: ShieldCheck, count: isOwner ? pending : 0, attention: true },
        { href: "/audit", label: "Audit log", icon: ScrollText },
        { href: "/learnings", label: "Learnings", icon: GraduationCap },
      ],
    },
  ];
  return groups;
}

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/pipeline" && pathname.startsWith("/deals"));

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cx(
        "group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors",
        active ? "bg-raised text-fg" : "text-fg-muted hover:bg-surface hover:text-fg",
      )}
    >
      <item.icon className={cx("size-4", active ? "text-fg" : "text-fg-faint group-hover:text-fg-muted")} strokeWidth={1.75} />
      {item.label}
      {!!item.count && <span className={cx("ml-auto font-mono text-[11px] num", item.attention ? "text-warm" : "text-fg-faint")}>{item.count}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const groups = useNav();
  const { setPaletteOpen } = useDesk();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-r border-line bg-ink-sunken px-3 py-4 md:flex">
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <AmaraMark className="h-[18px] w-[21px]" />
        <span className="font-serif text-[17px] tracking-tight">HeyAmara</span>
        <span className="ml-auto rounded border border-line-strong px-1.5 py-px font-mono text-[10px] text-fg-faint">Desk</span>
      </div>

      <button data-tour="ask-amara"
        onClick={() => setPaletteOpen(true)}
        className="group mb-3 flex h-9 shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-left text-[13px] text-fg-faint transition-colors hover:border-line-strong hover:text-fg-muted"
      >
        <Search className="size-3.5" />
        Ask Amara
        <span className="ml-auto flex gap-0.5">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <nav className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1 pb-4" aria-label="Main">
        {groups.map((g, i) => (
          <div key={g.label ?? i} className="flex flex-col gap-0.5">
            {g.label && <div className="px-2 pb-1 text-[10px] tracking-[0.1em] text-fg-faint uppercase">{g.label}</div>}
            {g.items.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </div>
        ))}
      </nav>

      <HelpButton />
      <AccountCard />
    </aside>
  );
}

/** Starts the tour for the current page. Also bound to "?" anywhere outside a text field. */
function HelpButton() {
  const pathname = usePathname();
  const { setTourOpen, tourOpen } = useDesk();
  const tour = tourFor(pathname);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isHelpKey = e.key === "?" || (e.key === "/" && e.shiftKey);
      if (!isHelpKey || tourOpen || !tour) return;
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      setTourOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tour, tourOpen, setTourOpen]);

  if (!tour) return null;
  return (
    <button
      onClick={() => setTourOpen(true)}
      className="group mb-2 flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2 text-left text-[13px] text-fg-muted transition-colors hover:bg-surface hover:text-fg"
    >
      <CircleHelp className="size-4 text-fg-faint group-hover:text-fg-muted" strokeWidth={1.75} />
      Tour this page
      <span className="ml-auto">
        <Kbd>?</Kbd>
      </span>
    </button>
  );
}

/** Who you're signed in as. In the demo you can switch to see each role's view. */
function AccountCard() {
  const { me, members, setCurrentUser, notify } = useDesk();
  const [open, setOpen] = useState(false);
  const progress = RECRUITER.placedThisMonth / RECRUITER.monthlyTarget;

  // Close the menu if the sidebar is hidden (e.g. a navigation) while it's open.
  useLayoutEffect(() => () => setOpen(false), []);

  return (
    <div className="relative shrink-0">
      {open && (
        <div className="absolute inset-x-0 bottom-full z-10 mb-2 animate-pop overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_20px_50px_-15px_rgb(0_0_0/0.8)]" role="menu">
          <div className="px-3 pt-2.5 pb-1.5 text-[10px] tracking-[0.1em] text-fg-faint uppercase">View as (demo)</div>
          {members.map((m) => (
            <button
              key={m.id}
              role="menuitemradio"
              aria-checked={m.id === me.id}
              onClick={() => {
                setCurrentUser(m.id);
                setOpen(false);
                if (m.id !== me.id) notify(`Now viewing as ${m.name} (${ROLE_LABEL[m.role]})`);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-raised"
            >
              <ActorAvatar id={m.id} size="xs" />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[12px] text-fg">{m.name}</span>
                <span className="block text-[11px] text-fg-faint">{ROLE_LABEL[m.role]}</span>
              </span>
              {m.id === me.id && <Check className="size-3.5 text-fg-muted" />}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-3 rounded-xl border border-line bg-surface p-3">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" className="flex w-full items-center gap-2.5 text-left">
          <ActorAvatar id={me.id} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px]">{me.name}</span>
            <span className="block truncate text-[11px] text-fg-faint">
              {ROLE_LABEL[me.role]} · {RECRUITER.desk}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-fg-faint" />
        </button>
        <div>
          <div className="mb-1.5 flex justify-between font-mono text-[10px] text-fg-faint num">
            <span>October</span>
            <span>
              <span className="text-fg-muted">{money(RECRUITER.placedThisMonth, { compact: true })}</span> / {money(RECRUITER.monthlyTarget, { compact: true })}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-line-strong">
            <div className="h-full rounded-full bg-fg/80" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const MOBILE_PRIMARY = ["/", "/clients", "/pipeline", "/follow-ups"];

export function MobileNav() {
  const pathname = usePathname();
  const groups = useNav();
  const [moreOpen, setMoreOpen] = useState(false);
  const all = groups.flatMap((g) => g.items);
  const primary = MOBILE_PRIMARY.map((h) => all.find((i) => i.href === h)!);
  const moreActive = !primary.some((i) => isActive(pathname, i.href));

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-ink-sunken/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {primary.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx("relative flex h-14 flex-col items-center justify-center gap-1 text-[10px]", active ? "text-fg" : "text-fg-faint")}
            >
              <item.icon className="size-[18px]" strokeWidth={1.75} />
              {item.label}
              {!!item.count && <span className={cx("absolute top-2 right-[calc(50%-18px)] size-1.5 rounded-full", item.attention ? "bg-warm" : "bg-fg-muted")} />}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          className={cx("flex h-14 flex-col items-center justify-center gap-1 text-[10px]", moreActive ? "text-fg" : "text-fg-faint")}
        >
          <Ellipsis className="size-[18px]" strokeWidth={1.75} />
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More">
          <button aria-label="Close" className="absolute inset-0 animate-fade bg-black/60" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] animate-pop overflow-y-auto rounded-t-2xl border-t border-line-strong bg-surface px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-[13px] text-fg">Everything</span>
              <button onClick={() => setMoreOpen(false)} aria-label="Close" className="grid size-8 place-items-center rounded-md text-fg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              {groups.map((g, i) => (
                <div key={g.label ?? i} className="flex flex-col gap-0.5">
                  {g.label && <div className="px-2 pb-1 text-[10px] tracking-[0.1em] text-fg-faint uppercase">{g.label}</div>}
                  {g.items.map((item) => (
                    <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} onNavigate={() => setMoreOpen(false)} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileHeader() {
  const { setPaletteOpen, setTourOpen, me } = useDesk();
  const hasTour = !!tourFor(usePathname());
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-2.5 border-b border-line bg-ink/90 px-4 backdrop-blur md:hidden">
      <AmaraMark className="h-4 w-[19px]" />
      <span className="font-serif text-[16px]">Amara</span>
      <span className="ml-auto">
        <ActorAvatar id={me.id} size="sm" />
      </span>
      {hasTour && (
        <button onClick={() => setTourOpen(true)} aria-label="Tour this page" className="grid size-8 place-items-center rounded-lg border border-line bg-surface text-fg-muted">
          <CircleHelp className="size-4" />
        </button>
      )}
      <button onClick={() => setPaletteOpen(true)} className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs text-fg-muted">
        <Search className="size-3.5" /> Ask Amara
      </button>
    </header>
  );
}
