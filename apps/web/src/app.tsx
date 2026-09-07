import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nProvider } from './lib/i18n';

const HomePage = lazy(() =>
  import('./pages/home-page').then((module) => ({ default: module.HomePage })),
);
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
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});
export function App() {
  return (
    <QueryClientProvider client={client}>
      <I18nProvider>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="grid min-h-screen place-items-center bg-sand">
                <div className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
              </div>
            }
          >
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
              <Route
                path="/about"
                element={
                  <SimplePage
                    title="Rezervo, për bizneset e Kosovës"
                    text="Ne po e bëjmë rezervimin më të lehtë për bizneset dhe klientët e tyre."
                  />
                }
              />
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
        </BrowserRouter>
      </I18nProvider>
    </QueryClientProvider>
  );
}
