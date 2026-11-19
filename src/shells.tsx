import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Banknote,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CalendarRange,
  CircleHelp,
  ClipboardCheck,
  Coins,
  CreditCard,
  FolderLock,
  HeartPulse,
  Landmark,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Search,
  ShieldAlert,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { fullName } from "./domain.ts";
import { DEMO_DATE_LABEL, DEMO_TIME, formatDateTime } from "./format.ts";
import { useApp, useOrg } from "./state.tsx";
import { PRACTICE, useWorkspace } from "./workspace.ts";
import { Dialog, Toasts, Wordmark, cn } from "./ui.tsx";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function useShellLoading(): boolean {
  const context = useOutletContext<{ loading?: boolean } | undefined>();
  return Boolean(context?.loading);
}

function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const apply = () => setCompact(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return compact;
}

function SideNav({ groups, collapsed, onNavigate }: { groups: NavGroup[]; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Primary">
      {groups.map((group) => (
        <div key={group.label}>
          {collapsed ? null : <p className="px-3 pb-2 text-[11px] font-medium tracking-wide text-white/40 uppercase">{group.label}</p>}
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                    collapsed && "justify-center px-0",
                    isActive ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5 hover:text-white",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn("absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full", isActive ? "bg-blue-500" : "bg-transparent")} />
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SearchBox({ items }: { items: { label: string; hint?: string; to: string }[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const results =
    query.trim().length < 2
      ? []
      : items.filter((item) => `${item.label} ${item.hint ?? ""}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  return (
    <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && results[0]) {
            navigate(results[0].to);
            setOpen(false);
            setQuery("");
          }
        }}
        placeholder="Search employees or pages"
        aria-label="Search"
        className="h-10 w-full rounded-lg border border-line bg-slate-50 pr-3 pl-9 text-sm outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
      />
      {open && query.trim().length >= 2 ? (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-line bg-white py-1 shadow-lg">
          {results.length === 0 ? <p className="px-3 py-2 text-sm text-muted">No matches.</p> : null}
          {results.map((result) => (
            <button
              key={`${result.to}-${result.label}`}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                navigate(result.to);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="font-medium text-ink">{result.label}</span>
              {result.hint ? <span className="mt-0.5 block text-xs text-muted">{result.hint}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NotificationButton({ audience, rewrite }: { audience: "employer" | "accountant"; rewrite?: (href: string) => string }) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const notices = state.notices.filter((notice) => notice.audience === audience);
  const unread = notices.filter((notice) => notice.unread).length;
  return (
    <div className="relative">
      <button
        type="button"
        className="relative grid h-10 w-10 place-items-center rounded-lg text-ink hover:bg-slate-100"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          dispatch({ type: "mark-notices", audience });
        }}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600" /> : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-80 rounded-xl border border-line bg-white p-2 shadow-lg">
          <p className="px-2 py-1 text-xs font-medium tracking-wide text-muted uppercase">Notifications</p>
          {notices.map((notice) => (
            <button
              key={notice.id}
              type="button"
              className="block w-full rounded-lg px-2 py-2 text-left hover:bg-slate-50"
              onClick={() => {
                navigate(rewrite ? rewrite(notice.href) : notice.href);
                setOpen(false);
              }}
            >
              <span className="block text-sm font-medium text-ink">{notice.title}</span>
              <span className="mt-0.5 block text-xs leading-5 text-muted">{notice.body}</span>
              <span className="mt-1 block text-xs text-muted">{formatDateTime(notice.time)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function UserMenu({ name, role, email, settingsTo }: { name: string; role: string; email: string; settingsTo: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-100" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-xs font-semibold text-white">{name.slice(0, 1)}</span>
        <span className="hidden text-left lg:block">
          <span className="block text-sm font-medium leading-4">{name}</span>
          <span className="block max-w-40 truncate text-xs text-muted">{role}</span>
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-72 rounded-xl border border-line bg-white p-2 shadow-lg">
          <div className="px-2 py-2">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted">{email}</p>
          </div>
          <Link to={settingsTo} className="block rounded-lg px-2 py-2 text-sm hover:bg-slate-50" onClick={() => setOpen(false)}>
            Security and settings
          </Link>
          <Link to="/" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50" onClick={() => setOpen(false)}>
            <LogOut className="h-4 w-4" /> Sign out
          </Link>
          <p className="px-2 pt-1 text-xs leading-5 text-muted">Signing out returns to the workspace chooser. Demonstration changes stay for this browser session.</p>
        </div>
      ) : null}
    </div>
  );
}

function AppFrame({
  groups,
  actor,
  role,
  email,
  settingsTo,
  audience,
  searchItems,
  help,
  banner,
  practiceName,
  orgControl,
  rewriteNotice,
}: {
  groups: NavGroup[];
  actor: string;
  role: string;
  email: string;
  settingsTo: string;
  audience: "employer" | "accountant";
  searchItems: { label: string; hint?: string; to: string }[];
  help: { title: string; body: string }[];
  banner?: ReactNode;
  practiceName?: string;
  orgControl?: (collapsed: boolean) => ReactNode;
  rewriteNotice?: (href: string) => string;
}) {
  const compact = useCompact();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(false);
  const { state } = useApp();
  const narrow = collapsed && !compact;
  const skipOrgFlash = useRef(true);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (skipOrgFlash.current) {
      skipOrgFlash.current = false;
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, [state.orgId]);

  const sidebar = (
    <div className="flex h-full flex-col bg-navy">
      <div className={cn("flex items-center px-4 py-4", narrow && "justify-center px-2")}>
        <Wordmark compact={narrow} />
        {compact ? (
          <button type="button" className="ml-auto text-white/80" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      {practiceName && !narrow ? <p className="px-5 pb-2 text-xs text-white/55">{practiceName}</p> : null}
      {orgControl ? orgControl(narrow) : null}
      <SideNav groups={groups} collapsed={narrow} onNavigate={() => setMobileOpen(false)} />
      <div className="border-t border-white/10 p-3">
        {compact ? null : (
          <button
            type="button"
            className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/80 hover:bg-white/5", narrow && "justify-center")}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {narrow ? null : <span>Collapse</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="flex min-h-screen">
        {compact ? (
          mobileOpen ? (
            <div className="no-print fixed inset-0 z-40 flex">
              <div className="h-full w-72 max-w-[82vw]">{sidebar}</div>
              <button type="button" className="flex-1 bg-navy/40" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
            </div>
          ) : null
        ) : (
          <aside className={cn("app-sidebar no-print sticky top-0 h-screen shrink-0 overflow-hidden", narrow ? "w-[72px]" : "w-64")}>{sidebar}</aside>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="app-topbar no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white px-4">
            {compact ? (
              <button type="button" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-slate-100" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
            ) : null}
            <SearchBox items={searchItems} />
            <div className="ml-auto flex items-center gap-1">
              <span className="hidden text-sm text-muted xl:inline">
                {DEMO_DATE_LABEL} · {DEMO_TIME}
              </span>
              <NotificationButton audience={audience} rewrite={rewriteNotice} />
              <button type="button" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-slate-100" aria-label="Help" onClick={() => setHelpOpen(true)}>
                <CircleHelp className="h-4 w-4" />
              </button>
              <UserMenu name={actor} role={role} email={email} settingsTo={settingsTo} />
            </div>
          </header>
          {banner}
          <main id="main" className="app-main flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet context={{ loading }} />
          </main>
        </div>
      </div>
      <Dialog open={helpOpen} title="Help" description="Short guidance for this workspace. Product support is support@mzansipay.example." onClose={() => setHelpOpen(false)}>
        <div className="space-y-4">
          {help.map((point) => (
            <div key={point.title}>
              <h3 className="text-sm font-semibold">{point.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{point.body}</p>
            </div>
          ))}
        </div>
      </Dialog>
      <Toasts />
    </div>
  );
}

const employerHelp = [
  { title: "Read a payroll run from the top", body: "Start with gross earnings, then employee deductions, then net salary. Employer contributions are a separate cost and do not reduce net salary." },
  { title: "Approvals", body: "A practitioner can prepare a run. The employer approves it. Releasing a payment stays with the employer and asks for confirmation." },
  { title: "Protected information", body: "Identity numbers, tax numbers and bank accounts stay masked. A request to reveal a number is written to the audit history." },
];

export function EmployerShell() {
  const workspace = useWorkspace();
  const { org, employees, runs } = useOrg();
  const { state, dispatch } = useApp();
  const [orgOpen, setOrgOpen] = useState(false);
  const base = workspace.base;
  const groups: NavGroup[] = [
    {
      label: "Workspace",
      items: [
        { to: base, label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: `${base}/employees`, label: "Employees", icon: Users },
        { to: `${base}/payroll`, label: "Payroll", icon: Wallet },
        { to: `${base}/validation`, label: "Validation", icon: ShieldAlert },
        { to: `${base}/approvals`, label: "Approvals", icon: ClipboardCheck },
        { to: `${base}/leave`, label: "Leave", icon: CalendarDays },
      ],
    },
    {
      label: "Pay setup",
      items: [
        { to: `${base}/structures`, label: "Salary structures", icon: Layers },
        { to: `${base}/earnings`, label: "Earnings and Deductions", icon: Coins },
        { to: `${base}/payslips`, label: "Payslips", icon: Receipt },
        { to: `${base}/benefits`, label: "Benefits", icon: HeartPulse },
        { to: `${base}/compliance`, label: "Statutory Compliance", icon: Landmark },
        { to: `${base}/reports`, label: "Reports", icon: BarChart3 },
        { to: `${base}/payments`, label: "Payments", icon: Banknote },
        { to: `${base}/documents`, label: "Documents", icon: FolderLock },
      ],
    },
    {
      label: "Account",
      items: [
        { to: `${base}/settings`, label: "Organisation Settings", icon: Settings },
        { to: `${base}/billing`, label: "Subscription and Billing", icon: CreditCard },
      ],
    },
  ];
  const searchItems = [
    ...groups.flatMap((group) => group.items.map((item) => ({ label: item.label, hint: "Page", to: item.to }))),
    ...employees.map((employee) => ({ label: fullName(employee), hint: employee.employeeNumber, to: `${base}/employees/${employee.id}` })),
    ...runs.map((run) => ({ label: run.name, hint: "Payroll run", to: `${base}/payroll/${run.id}` })),
  ];

  return (
    <AppFrame
      groups={groups}
      actor={workspace.actor}
      role={workspace.role}
      email={workspace.email}
      settingsTo={`${base}/settings`}
      audience="employer"
      searchItems={searchItems}
      help={employerHelp}
      rewriteNotice={workspace.mode === "accountant" ? (href) => href.replace(/^\/e/, base) : undefined}
      banner={
        workspace.mode === "accountant" ? (
          <div className="no-print border-b border-teal-100 bg-teal-50 px-4 py-2 text-sm text-teal-950 sm:px-6">
            <span className="font-medium">{PRACTICE.name}</span> is preparing payroll for {org.legalName}. You can prepare a run. Amara Dube approves it and releases payment.
            <Link to="/a/clients" className="ml-3 font-medium text-teal-800 underline">
              Exit client file
            </Link>
          </div>
        ) : null
      }
      orgControl={
        workspace.mode === "employer"
          ? (narrow) =>
              narrow ? null : (
                <div className="px-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-left text-sm text-white"
                    aria-expanded={orgOpen}
                    onClick={() => setOrgOpen((value) => !value)}
                  >
                    <span>
                      <span className="block text-[11px] text-white/50">Organisation</span>
                      <span className="font-medium">{org.tradingName}</span>
                    </span>
                  </button>
                  {orgOpen ? (
                    <div className="mt-1 rounded-lg bg-navy-800 p-1">
                      {(Object.keys(state.orgs) as Array<keyof typeof state.orgs>).map((id) => (
                        <button
                          key={id}
                          type="button"
                          className="block w-full rounded-md px-2 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                          onClick={() => {
                            dispatch({ type: "set-org", orgId: id });
                            setOrgOpen(false);
                          }}
                        >
                          {state.orgs[id].tradingName}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
          : (narrow) => (narrow ? null : <div className="px-5 pb-1 text-xs text-white/60">Client file · {org.tradingName}</div>)
      }
    />
  );
}

export function PracticeShell() {
  const { state } = useApp();
  const groups: NavGroup[] = [
    {
      label: "Practice",
      items: [
        { to: "/a", label: "Practice Dashboard", icon: LayoutDashboard, end: true },
        { to: "/a/clients", label: "Clients", icon: Building2 },
        { to: "/a/calendar", label: "Payroll Calendar", icon: CalendarRange },
        { to: "/a/processing", label: "Payroll Processing", icon: Wallet },
        { to: "/a/approvals", label: "Approvals", icon: ClipboardCheck },
      ],
    },
    {
      label: "Compliance",
      items: [
        { to: "/a/compliance", label: "Statutory Compliance", icon: Landmark },
        { to: "/a/reports", label: "Reports", icon: BarChart3 },
      ],
    },
    {
      label: "Practice admin",
      items: [
        { to: "/a/team", label: "Team Members", icon: Users },
        { to: "/a/settings", label: "Practice Settings", icon: Settings },
        { to: "/a/billing", label: "Subscription and Billing", icon: CreditCard },
      ],
    },
  ];
  const searchItems = [
    ...groups.flatMap((group) => group.items.map((item) => ({ label: item.label, hint: "Page", to: item.to }))),
    ...state.runs
      .filter((run) => state.accountantAccess[run.orgId])
      .map((run) => ({
        label: `${state.orgs[run.orgId].tradingName} · ${run.name}`,
        hint: "Client payroll",
        to: `/a/client/${run.orgId}/payroll/${run.id}`,
      })),
  ];
  return (
    <AppFrame
      groups={groups}
      actor={PRACTICE.actor}
      role={PRACTICE.role}
      email={PRACTICE.email}
      settingsTo="/a/settings"
      audience="accountant"
      searchItems={searchItems}
      practiceName={PRACTICE.name}
      help={[
        { title: "Authorised clients only", body: "Harbour & Co can open payroll only where the employer has authorised access. A pending invitation shows no pay data." },
        { title: "Who approves", body: "The practice prepares payroll. The employer approves it and releases payment." },
        { title: "Control totals", body: "Where this demonstration has no employee register, the practice view shows labelled sample control totals only." },
      ]}
    />
  );
}
