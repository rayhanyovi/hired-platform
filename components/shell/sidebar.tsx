"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  Check,
  CircleHelp,
  Columns3,
  Ellipsis,
  FileText,
  GraduationCap,
  Inbox,
  LayoutGrid,
  Menu,
  MessagesSquare,
  MessageSquareText,
  PanelLeftClose,
  ScrollText,
  Search,
  ShieldCheck,
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
import { AskButton } from "./ask-drawer";

type NavItem = { href: string; label: string; icon: typeof Menu; count?: number; attention?: boolean };

export function useNav() {
  const { deals, followUps, applicants, approvals, isOwner } = useDesk();
  const toReview = applicants.filter((a) => a.status === "new").length;
  const pending = approvals.filter((a) => a.status === "pending").length;
  const groups: { label?: string; items: NavItem[] }[] = [
    {
      items: [
        { href: "/", label: "Home", icon: LayoutGrid },
        { href: "/chat", label: "Chat", icon: MessagesSquare },
      ],
    },
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
        // The Sum (/sum) is hidden from the menu for now; the route still works.
      ],
    },
    {
      label: "Agency",
      items: [
        { href: "/team", label: "Team", icon: ShieldCheck, count: isOwner ? pending : 0, attention: true },
        { href: "/audit", label: "Audit trail", icon: ScrollText },
        { href: "/learnings", label: "Learnings", icon: GraduationCap },
      ],
    },
  ];
  return groups;
}

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/pipeline" && pathname.startsWith("/deals"));

/* ── Rail ─────────────────────────────────────────────────────────── */

/** Amara's icon rail. ☰ in the top bar widens it to show labels. */
export function Rail() {
  const pathname = usePathname();
  const groups = useNav();
  const { railOpen, setSearchOpen } = useDesk();

  return (
    <aside
      className={cx(
        "sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-line bg-ink-sunken transition-[width] duration-200 ease-out md:flex",
        railOpen ? "w-[220px]" : "w-[68px]",
      )}
    >
      <Link href="/" className="flex h-16 shrink-0 items-center gap-2.5 px-[22px]" aria-label="Amara home">
        <AmaraMark className="h-[20px] w-[24px] shrink-0" />
        {railOpen && <span className="animate-fade text-[15px] font-semibold tracking-[-0.01em]">HeyAmara</span>}
      </Link>

      <nav className="flex flex-1 flex-col gap-3 px-3 pt-3" aria-label="Main">
        <RailButton label="Search" hint="⌘K" icon={Search} open={railOpen} onClick={() => setSearchOpen(true)} dataTour="search" />
        {groups.map((g, i) => (
          <div key={g.label ?? i} className="flex flex-col gap-1">
            {g.label &&
              (railOpen ? (
                <div className="px-2.5 pt-1 pb-0.5 text-[10px] tracking-[0.1em] text-fg-faint uppercase">{g.label}</div>
              ) : (
                <div className="mx-auto mb-1 h-px w-6 bg-line" aria-hidden="true" />
              ))}
            {g.items.map((item) => (
              <RailLink key={item.href} item={item} active={isActive(pathname, item.href)} open={railOpen} />
            ))}
          </div>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <HelpButton />
      </div>
    </aside>
  );
}

const tileClass = (active: boolean, open: boolean) =>
  cx(
    "group/rail relative flex h-11 shrink-0 items-center rounded-xl transition-colors",
    open ? "gap-3 px-3" : "justify-center",
    active ? "bg-raised text-fg" : "text-fg-muted hover:bg-surface hover:text-fg",
  );

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 translate-x-1 rounded-md border border-line-strong bg-raised px-2 py-1 text-[12px] whitespace-nowrap text-fg opacity-0 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.8)] transition-[opacity,transform] duration-150 group-hover/rail:translate-x-0 group-hover/rail:opacity-100 group-focus-visible/rail:translate-x-0 group-focus-visible/rail:opacity-100"
    >
      {children}
    </span>
  );
}

function RailLink({ item, active, open }: { item: NavItem; active: boolean; open: boolean }) {
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} aria-label={open ? undefined : item.label} className={tileClass(active, open)}>
      <item.icon className="size-[19px] shrink-0" strokeWidth={1.75} />
      {open && <span className="truncate text-[13px]">{item.label}</span>}
      {!!item.count &&
        (open ? (
          <span className={cx("ml-auto font-mono text-[11px] num", item.attention ? "text-warm" : "text-fg-faint")}>{item.count}</span>
        ) : (
          <span className={cx("absolute top-2 right-2 size-1.5 rounded-full", item.attention ? "bg-warm" : "bg-fg-muted")} />
        ))}
      {!open && (
        <Tooltip>
          {item.label}
          {!!item.count && <span className="ml-1.5 text-fg-faint num">{item.count}</span>}
        </Tooltip>
      )}
    </Link>
  );
}

function RailButton({
  label,
  hint,
  icon: Icon,
  open,
  onClick,
  dataTour,
}: {
  label: string;
  hint?: string;
  icon: typeof Menu;
  open: boolean;
  onClick: () => void;
  dataTour?: string;
}) {
  return (
    <button data-tour={dataTour} onClick={onClick} aria-label={open ? undefined : label} className={tileClass(false, open)}>
      <Icon className="size-[19px] shrink-0" strokeWidth={1.75} />
      {open && <span className="truncate text-[13px]">{label}</span>}
      {open && hint && (
        <span className="ml-auto">
          <Kbd>{hint}</Kbd>
        </span>
      )}
      {!open && (
        <Tooltip>
          {label}
          {hint && <span className="ml-1.5 text-fg-faint">{hint}</span>}
        </Tooltip>
      )}
    </button>
  );
}

/** Starts the tour for the current page. Also bound to "?" anywhere outside a text field. */
function HelpButton() {
  const pathname = usePathname();
  const { setTourOpen, tourOpen, railOpen } = useDesk();
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
  return <RailButton label="Tour this page" hint="?" icon={CircleHelp} open={railOpen} onClick={() => setTourOpen(true)} dataTour="page-tour" />;
}

/* ── Top bar ──────────────────────────────────────────────────────── */

export function TopBar() {
  const pathname = usePathname();
  const groups = useNav();
  const { railOpen, setRailOpen } = useDesk();
  const current = groups.flatMap((g) => g.items).find((i) => isActive(pathname, i.href));

  return (
    <header className="sticky top-0 z-20 hidden h-16 shrink-0 items-center gap-3 border-b border-line bg-ink-sunken/95 px-5 backdrop-blur md:flex">
      <button
        onClick={() => setRailOpen(!railOpen)}
        aria-label={railOpen ? "Collapse navigation" : "Expand navigation"}
        aria-expanded={railOpen}
        className="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface hover:text-fg"
      >
        {railOpen ? <PanelLeftClose className="size-[19px]" strokeWidth={1.75} /> : <Menu className="size-[19px]" strokeWidth={1.75} />}
      </button>
      {current && (
        <div className="flex min-w-0 items-center gap-2.5">
          <current.icon className="size-[18px] shrink-0 text-fg-muted" strokeWidth={1.75} />
          <span className="truncate text-[17px] font-semibold tracking-[-0.01em]">{current.label}</span>
        </div>
      )}
      <div className="ml-auto flex items-center gap-2">
        <AskButton />
        <Notifications />
        <AccountMenu />
      </div>
    </header>
  );
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  // Close if the page this lives on gets hidden by a navigation.
  useLayoutEffect(() => () => setOpen(false), []);
  return { open, setOpen, ref };
}

/** Everything waiting on you, in one bell. */
function Notifications() {
  const { approvals, applicants, followUps, deals, isOwner } = useDesk();
  const { open, setOpen, ref } = usePopover();
  const items = [
    { n: isOwner ? approvals.filter((a) => a.status === "pending").length : 0, text: "waiting for your approval", href: "/team" },
    { n: deals.filter(needsAttention).length, text: "deals going cold", href: "/pipeline" },
    { n: followUps.length, text: "people waiting for an update", href: "/follow-ups" },
    { n: applicants.filter((a) => a.status === "new").length, text: "applicants to review", href: "/applicants" },
  ].filter((i) => i.n > 0);
  const total = items.reduce((s, i) => s + i.n, 0);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications, ${total}`}
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface hover:text-fg"
      >
        <Bell className="size-[19px]" strokeWidth={1.75} />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-calls px-1 text-[10px] font-semibold text-white num">
            {total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-full right-0 z-40 mt-2 w-72 animate-pop overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_20px_50px_-15px_rgb(0_0_0/0.8)]">
          <div className="border-b border-line px-4 py-2.5 text-[12px] text-fg-muted">Waiting on you</div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-fg-faint">All clear.</p>
          ) : (
            items.map((i) => (
              <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-raised">
                <span className="w-6 text-right font-mono text-fg num">{i.n}</span>
                <span className="text-fg-muted">{i.text}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Who you're signed in as. In the demo you can switch to see each role's view. */
function AccountMenu() {
  const { me, members, setCurrentUser, notify } = useDesk();
  const { open, setOpen, ref } = usePopover();
  const progress = RECRUITER.placedThisMonth / RECRUITER.monthlyTarget;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${me.name}`}
        className="relative grid size-9 place-items-center rounded-lg transition-colors hover:bg-surface"
      >
        <ActorAvatar id={me.id} size="md" />
        <span className="absolute right-0.5 bottom-0.5 size-2.5 rounded-full border-2 border-ink-sunken bg-placements" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-40 mt-2 w-64 animate-pop overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_20px_50px_-15px_rgb(0_0_0/0.8)]" role="menu">
          <div className="border-b border-line px-4 py-3">
            <div className="text-[13px] text-fg">{me.name}</div>
            <div className="text-[11px] text-fg-faint">
              {ROLE_LABEL[me.role]} · {RECRUITER.desk}
            </div>
            <div className="mt-3 mb-1.5 flex justify-between font-mono text-[10px] text-fg-faint num">
              <span>October</span>
              <span>
                <span className="text-fg-muted">{money(RECRUITER.placedThisMonth, { compact: true })}</span> / {money(RECRUITER.monthlyTarget, { compact: true })}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-line-strong">
              <div className="h-full rounded-full bg-placements" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
          <div className="px-4 pt-2.5 pb-1 text-[10px] tracking-[0.1em] text-fg-faint uppercase">View as (demo)</div>
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
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors hover:bg-raised"
            >
              <ActorAvatar id={m.id} size="xs" />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[12px] text-fg">{m.name}</span>
                <span className="block text-[11px] text-fg-faint">{ROLE_LABEL[m.role]}</span>
              </span>
              {m.id === me.id && <Check className="size-3.5 text-fg-muted" />}
            </button>
          ))}
          <div className="h-2" />
        </div>
      )}
    </div>
  );
}

/* ── Mobile ───────────────────────────────────────────────────────── */

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cx("flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors", active ? "bg-raised text-fg" : "text-fg-muted hover:bg-raised hover:text-fg")}
    >
      <item.icon className="size-[18px]" strokeWidth={1.75} />
      {item.label}
      {!!item.count && <span className={cx("ml-auto font-mono text-[11px] num", item.attention ? "text-warm" : "text-fg-faint")}>{item.count}</span>}
    </Link>
  );
}

const MOBILE_PRIMARY = ["/", "/chat", "/pipeline", "/follow-ups"];

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
                  {g.label && <div className="px-3 pb-1 text-[10px] tracking-[0.1em] text-fg-faint uppercase">{g.label}</div>}
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
  const { setTourOpen, setSearchOpen, me } = useDesk();
  const hasTour = !!tourFor(usePathname());
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2.5 border-b border-line bg-ink-sunken/95 px-4 backdrop-blur md:hidden">
      <AmaraMark className="h-[18px] w-[21px]" />
      <span className="text-[15px] font-semibold tracking-[-0.01em]">HeyAmara</span>
      <span className="ml-auto">
        <ActorAvatar id={me.id} size="sm" />
      </span>
      {hasTour && (
        <button data-tour="page-tour" onClick={() => setTourOpen(true)} aria-label="Tour this page" className="grid size-8 place-items-center rounded-lg border border-line bg-surface text-fg-muted">
          <CircleHelp className="size-4" />
        </button>
      )}
      <button onClick={() => setSearchOpen(true)} aria-label="Search" className="grid size-8 place-items-center rounded-lg border border-line bg-surface text-fg-muted">
        <Search className="size-4" />
      </button>
      <AskButton compact />
    </header>
  );
}
