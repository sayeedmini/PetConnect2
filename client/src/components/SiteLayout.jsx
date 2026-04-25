import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUser, isLoggedIn, logout } from '../features/auth/utils/auth';

const sectionNavItems = {
  home: [
    { to: '/', label: 'Home', match: (pathname) => pathname === '/' || pathname === '/catalog' },
    { to: '/vets', label: 'Clinics', match: (pathname) => pathname.startsWith('/vets') },
    { to: '/groomers', label: 'Groomers', match: (pathname) => pathname.startsWith('/groomers') || pathname.startsWith('/grooming') || pathname === '/subscriptions' },
    { to: '/rescue/report', label: 'Rescue', match: (pathname) => pathname.startsWith('/rescue') },
  ],
  vets: [
    { to: '/', label: 'Home', match: (pathname) => pathname === '/' || pathname === '/catalog' },
    { to: '/vets', label: 'Clinics', match: (pathname) => pathname.startsWith('/vets') },
    { to: '/appointments', label: 'Appointment', match: (pathname) => pathname.startsWith('/appointments') },
    { to: '/prescriptions', label: 'Prescription', match: (pathname) => pathname.startsWith('/prescriptions') },
  ],
  groomers: [
    { to: '/', label: 'Home', match: (pathname) => pathname === '/' || pathname === '/catalog' },
    { to: '/groomers', label: 'Groomers', match: (pathname) => pathname.startsWith('/groomers') },
    { to: '/groomers', label: 'Bookings', match: (pathname) => pathname.startsWith('/grooming/track') || /^\/groomers\/[^/]+\/book$/.test(pathname) },
    { to: '/grooming/subscriptions', label: 'Subscription', match: (pathname) => pathname.startsWith('/grooming/subscriptions') || pathname === '/subscriptions' },
  ],
  rescue: [
    { to: '/', label: 'Home', match: (pathname) => pathname === '/' || pathname === '/catalog' },
    { to: '/rescue/report', label: 'Report Rescue', match: (pathname) => pathname === '/rescue/report' || pathname === '/rescue/report-success' },
    { to: '/rescue/dashboard', label: 'Dashboard', roles: ['rescuer'], match: (pathname) => pathname === '/rescue/dashboard' },
    { to: '/rescue/tracking', label: 'Tracking', roles: ['rescuer', 'petOwner'], match: (pathname) => pathname === '/rescue/tracking' },
    { to: '/rescue/insights', label: 'Insights', roles: ['rescuer', 'petOwner'], match: (pathname) => pathname === '/rescue/insights' },
  ],
};

function getSection(pathname) {
  if (pathname.startsWith('/rescue')) return 'rescue';
  if (
    pathname.startsWith('/groomers') ||
    pathname.startsWith('/grooming') ||
    pathname === '/subscriptions'
  ) {
    return 'groomers';
  }
  if (
    pathname.startsWith('/vets') ||
    pathname.startsWith('/appointments') ||
    pathname.startsWith('/prescriptions')
  ) {
    return 'vets';
  }
  return 'home';
}

function NavItem({ item, pathname }) {
  const active = item.match(pathname);

  return (
    <Link
      to={item.to}
      className={[
        'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition',
        active
          ? 'bg-[#002045] text-white shadow-[0_12px_30px_rgba(0,32,69,0.18)]'
          : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700',
      ].join(' ')}
    >
      {item.label}
    </Link>
  );
}

function SiteLayout({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  backTo,
  backLabel = 'Back',
  compact = false,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const loggedIn = isLoggedIn();
  const navItems = sectionNavItems[getSection(location.pathname)];

  const visibleNavItems = navItems.filter(
  (item) => !item.roles || item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-none items-center justify-between gap-4 px-1 py-4 sm:px-2 lg:px-3">
          <div className="min-w-0 shrink-0">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#002045] text-lg font-black text-white shadow-[0_16px_40px_rgba(0,32,69,0.18)]">
                P
              </div>
              <div>
                <div className="font-display text-xl font-extrabold tracking-tight text-[#002045]">
                  PetConnect
                </div>
                <div className="text-xs text-slate-500">Pet care, grooming, rescue, and shopping</div>
              </div>
            </Link>
          </div>

          <nav
            className="mx-1 flex min-w-0 flex-1 justify-center gap-2 overflow-x-auto px-1"
            aria-label="Section navigation"
          >
          {visibleNavItems.map((item) => (
            <NavItem key={`${item.label}-${item.to}`} item={item} pathname={location.pathname} />
          ))}
          </nav>

          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-3">
            {loggedIn ? (
              <>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                  <span className="font-semibold text-[#002045]">{user?.name || 'User'}</span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span className="capitalize">{user?.role || 'member'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-[#002045] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(0,32,69,0.18)] transition hover:bg-[#1A365D]"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {(title || subtitle || eyebrow || actions || backTo) && (
          <section
            className={`mx-auto w-full max-w-[1700px] px-3 ${compact ? 'pt-10' : 'pt-14'} sm:px-4 lg:px-5`}
          >
            <div className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:px-8 lg:px-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  {backTo && (
                    <Link
                      to={backTo}
                      className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"
                    >
                      <span aria-hidden="true">←</span>
                      {backLabel}
                    </Link>
                  )}
                  {eyebrow && (
                    <div className="mb-3 inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 ring-1 ring-teal-200">
                      {eyebrow}
                    </div>
                  )}
                  {title && (
                    <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#002045] sm:text-5xl">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
              </div>
            </div>
          </section>
        )}

        <div className="mx-auto w-full max-w-[1700px] px-3 py-8 sm:px-4 lg:px-5">{children}</div>
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-[1700px] gap-10 px-3 py-10 sm:grid-cols-2 sm:px-4 lg:grid-cols-5 lg:px-5">
          <div className="lg:col-span-2">
            <div className="font-display text-2xl font-extrabold text-[#002045]">PetConnect</div>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
              Connecting pet owners with trusted clinics, grooming support, rescue response, and
              everyday pet essentials.
            </p>
          </div>
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Explore</div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <Link className="block hover:text-teal-700" to="/">
                Product Catalog
              </Link>
              <Link className="block hover:text-teal-700" to="/vets">
                Vet Clinics
              </Link>
              <Link className="block hover:text-teal-700" to="/groomers">
                Groomers
              </Link>
              <Link className="block hover:text-teal-700" to="/rescue/report">
                Rescue Report
              </Link>
            </div>
          </div>
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Account</div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <Link className="block hover:text-teal-700" to="/login">
                Login
              </Link>
              <Link className="block hover:text-teal-700" to="/register">
                Register
              </Link>
              <Link className="block hover:text-teal-700" to="/appointments">
                Appointments
              </Link>
              <Link className="block hover:text-teal-700" to="/prescriptions">
                Prescriptions
              </Link>
            </div>
          </div>
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Legal</div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <span className="block">Privacy Policy</span>
              <span className="block">Terms of Service</span>
              <span className="block">Clinic verification policy</span>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 px-4 py-4 text-center text-sm text-slate-500">
          © 2026 PetConnect. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default SiteLayout;
