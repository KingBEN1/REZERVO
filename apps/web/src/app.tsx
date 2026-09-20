import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Component, lazy as reactLazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GlobalLanguageSwitch, I18nProvider } from './lib/i18n';
import { HomePage } from './pages/home-page';

/**
 * Vercel replaces hashed JavaScript files on every deployment. A visitor who
 * already has the old shell can otherwise get a failed dynamic import and a
 * blank page when opening a lazy route such as /manage/:token.
 */
function lazyWithDeployRecovery<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
) {
  return reactLazy(async () => {
    const retryKey = `rezervo:chunk-reload:${window.location.pathname}`;
    try {
      const module = await loader();
      sessionStorage.removeItem(retryKey);
      return module;
    } catch (error) {
      if (!sessionStorage.getItem(retryKey)) {
        sessionStorage.setItem(retryKey, '1');
        window.location.reload();
        return new Promise<{ default: T }>(() => undefined);
      }
      sessionStorage.removeItem(retryKey);
      throw error;
    }
  });
}

const lazy = lazyWithDeployRecovery;

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error('Rezervo page failed to render', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-sand p-5 text-center">
        <section className="surface max-w-md p-7">
          <p className="eyebrow">Faqja nuk u hap</p>
          <h1 className="display mt-2 text-3xl font-bold">Diçka nuk u ngarkua si duhet.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Provoni përsëri. Nëse sapo është publikuar një version i ri, faqja do të marrë versionin e fundit.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button className="rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white" type="button" onClick={() => window.location.reload()}>Provo përsëri</button>
            <a className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-slate-700" href="/">Ballina</a>
          </div>
        </section>
      </main>
    );
  }
}

const BusinessesPage = lazy(() =>
  import('./pages/businesses-page').then((module) => ({ default: module.BusinessesPage })),
);
const BookingPage = lazy(() =>
  import('./pages/booking-page').then((module) => ({ default: module.BookingPage })),
);
const ManageBookingPage = lazy(() =>
  import('./pages/manage-booking-page').then((module) => ({ default: module.ManageBookingPage })),
);
const CustomerAccountPage = lazy(() =>
  import('./pages/customer-account-page').then((module) => ({
    default: module.CustomerAccountPage,
  })),
);
const BusinessStartPage = lazy(() =>
  import('./pages/business-start-page').then((module) => ({ default: module.BusinessStartPage })),
);
const LoginPage = lazy(() =>
  import('./pages/auth-pages').then((module) => ({ default: module.LoginPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth-pages').then((module) => ({ default: module.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/auth-pages').then((module) => ({ default: module.ResetPasswordPage })),
);
const VerifyEmailPage = lazy(() =>
  import('./pages/auth-pages').then((module) => ({ default: module.VerifyEmailPage })),
);
const RegisterPage = lazy(() =>
  import('./pages/auth-pages').then((module) => ({ default: module.RegisterPage })),
);
const OnboardingPage = lazy(() =>
  import('./pages/onboarding-page').then((module) => ({ default: module.OnboardingPage })),
);
const PricingPage = lazy(() =>
  import('./pages/platform-pages').then((module) => ({ default: module.PricingPage })),
);
const LegalPage = lazy(() =>
  import('./pages/platform-pages').then((module) => ({ default: module.LegalPage })),
);
const SimplePage = lazy(() =>
  import('./pages/platform-pages').then((module) => ({ default: module.SimplePage })),
);
const AboutPage = lazy(() =>
  import('./pages/platform-pages').then((module) => ({ default: module.AboutPage })),
);
const DashboardLayout = lazy(() =>
  import('./pages/dashboard-page').then((module) => ({ default: module.DashboardLayout })),
);
const DashboardHome = lazy(() =>
  import('./pages/dashboard-page').then((module) => ({ default: module.DashboardHome })),
);
const BillingPage = lazy(() =>
  import('./pages/dashboard-page').then((module) => ({ default: module.BillingPage })),
);
const PromotionsPage = lazy(() =>
  import('./pages/dashboard-promotions').then((module) => ({ default: module.PromotionsPage })),
);
const BusinessProfilePage = lazy(() =>
  import('./pages/dashboard-setup').then((module) => ({ default: module.BusinessProfilePage })),
);
const HoursPage = lazy(() =>
  import('./pages/dashboard-setup').then((module) => ({ default: module.HoursPage })),
);
const BookingsPage = lazy(() =>
  import('./pages/dashboard-resources').then((module) => ({ default: module.BookingsPage })),
);
const CustomersPage = lazy(() =>
  import('./pages/dashboard-resources').then((module) => ({ default: module.CustomersPage })),
);
const ServicesPage = lazy(() =>
  import('./pages/dashboard-resources').then((module) => ({ default: module.ServicesPage })),
);
const StaffPage = lazy(() =>
  import('./pages/dashboard-resources').then((module) => ({ default: module.StaffPage })),
);
const AdminPage = lazy(() =>
  import('./pages/admin-page').then((module) => ({ default: module.AdminPage })),
);

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLoadingScreen() {
  return (
    <div className="app-loading-screen" role="status" aria-live="polite" aria-label="Duke ngarkuar">
      <div className="app-loading-mark">R</div>
      <div>
        <p className="display text-2xl font-bold text-white">rezervo</p>
        <p className="mt-1 text-sm text-green-100">Duke përgatitur përvojën tuaj…</p>
      </div>
      <div className="app-loading-bar"><span /></div>
    </div>
  );
}
export function App() {
  return (
    <QueryClientProvider client={client}>
      <I18nProvider>
        <BrowserRouter>
          <GlobalLanguageSwitch />
          <AppErrorBoundary>
            <Suspense fallback={<AppLoadingScreen />}>
              <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/businesses" element={<BusinessesPage />} />
              <Route path="/book/:slug" element={<BookingPage />} />
              <Route path="/manage/:token" element={<ManageBookingPage />} />
              <Route path="/account" element={<CustomerAccountPage />} />
              <Route path="/for-business" element={<BusinessStartPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/terms" element={<LegalPage type="terms" />} />
              <Route path="/privacy" element={<LegalPage type="privacy" />} />
              <Route path="/about" element={<AboutPage />} />
              <Route
                path="/contact"
                element={
                  <SimplePage
                    title="Kontakt"
                    text="Për ndihmë me Rezervo, përdorni kanalin e mbështetjes së biznesit tuaj pasi të hyni në llogari."
                  />
                }
              />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="calendar" element={<BookingsPage calendar />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="promotions" element={<PromotionsPage />} />
                <Route path="staff" element={<StaffPage />} />
                <Route path="hours" element={<HoursPage />} />
                <Route path="profile" element={<BusinessProfilePage />} />
                <Route path="billing" element={<BillingPage />} />
              </Route>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AppErrorBoundary>
        </BrowserRouter>
      </I18nProvider>
    </QueryClientProvider>
  );
}
