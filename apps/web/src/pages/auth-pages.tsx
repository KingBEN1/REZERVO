import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Logo } from '../components/site-header';
import { Button } from '../components/ui/button';
import { api, ApiError } from '../lib/api';

const loginSchema = z.object({
  email: z.string().email('Shkruani një email të vlefshëm.'),
  password: z.string().min(1, 'Shkruani fjalëkalimin.'),
});
const registerSchema = loginSchema.extend({
  firstName: z.string().min(2, 'Shkruani emrin.'),
  lastName: z.string().min(2, 'Shkruani mbiemrin.'),
  password: z.string().min(12, 'Fjalëkalimi duhet të ketë të paktën 12 karaktere.'),
});
type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
const forgotPasswordSchema = z.object({
  email: z.string().email('Shkruani një email të vlefshëm.'),
});
const resetPasswordSchema = z
  .object({
    password: z.string().min(12, 'Fjalëkalimi duhet të ketë të paktën 12 karaktere.'),
    confirmPassword: z.string().min(1, 'Përsëriteni fjalëkalimin.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Fjalëkalimet nuk përputhen.',
  });
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex items-center justify-center bg-sand px-4 py-10">
        <div className="w-full max-w-md">
          <Logo />
          {children}
        </div>
      </section>
      <aside className="hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="eyebrow text-green-200">Rezervo për çdo biznes</p>
        <div>
          <h1 className="display text-5xl font-bold leading-tight">
            Më shumë kohë për klientët tuaj.
          </h1>
          <p className="mt-5 max-w-md leading-7 text-green-100">
            Për bukuri, klinika, hotele, restorante, taksi, automjete, evente dhe çdo shërbim që
            punon me termine.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-green-100">
          <CheckCircle2 size={20} /> 30 ditë falas · Pastaj 30 € në muaj · Pa kartelë sot
        </div>
      </aside>
    </main>
  );
}
function Field({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input className="input" {...props} />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const businessIntent = params.get('intent') === 'business';
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const mutation = useMutation({
    mutationFn: (values: LoginValues) =>
      api('/auth/login', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => navigate(businessIntent ? '/dashboard' : '/account'),
  });
  return (
    <AuthShell>
      <div className="mt-14">
        <p className="eyebrow">Mirë se u kthyet</p>
        <h2 className="display mt-2 text-3xl font-bold">
          {businessIntent ? 'Hyni në biznesin tuaj' : 'Hyni në llogarinë tuaj'}
        </h2>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="mt-8 space-y-4"
        >
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <Field
            label="Fjalëkalimi"
            type="password"
            autoComplete="current-password"
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />
          <div className="text-right text-sm">
            <Link className="font-semibold text-forest" to="/forgot-password">
              Harruat fjalëkalimin?
            </Link>
          </div>
          {mutation.error && (
            <p className="text-sm text-red-600">
              {mutation.error instanceof ApiError ? mutation.error.message : 'Provoni përsëri.'}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              'Duke hyrë...'
            ) : (
              <>
                Hyr <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Nuk keni llogari?{' '}
          <Link
            to={businessIntent ? '/register?intent=business' : '/register'}
            className="font-semibold text-forest"
          >
            Krijo llogari
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
export function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const businessIntent = params.get('intent') === 'business';
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const mutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      api('/auth/register', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => navigate(businessIntent ? '/onboarding' : '/account'),
  });
  return (
    <AuthShell>
      <div className="mt-10">
        <p className="eyebrow">{businessIntent ? 'Fillo biznesin' : 'Fillo si klient'}</p>
        <h2 className="display mt-2 text-3xl font-bold">
          {businessIntent ? 'Krijoni llogarinë e biznesit' : 'Krijoni llogarinë tuaj'}
        </h2>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="mt-7 grid gap-4 sm:grid-cols-2"
        >
          <Field
            label="Emri"
            autoComplete="given-name"
            error={form.formState.errors.firstName?.message}
            {...form.register('firstName')}
          />
          <Field
            label="Mbiemri"
            autoComplete="family-name"
            error={form.formState.errors.lastName?.message}
            {...form.register('lastName')}
          />
          <div className="sm:col-span-2">
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              error={form.formState.errors.email?.message}
              {...form.register('email')}
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Fjalëkalimi"
              type="password"
              autoComplete="new-password"
              error={form.formState.errors.password?.message}
              {...form.register('password')}
            />
          </div>
          {mutation.error && (
            <p className="text-sm text-red-600 sm:col-span-2">
              {mutation.error instanceof ApiError ? mutation.error.message : 'Provoni përsëri.'}
            </p>
          )}
          <Button type="submit" className="sm:col-span-2" disabled={mutation.isPending}>
            {mutation.isPending ? (
              'Duke krijuar...'
            ) : (
              <>
                {businessIntent ? 'Vazhdo me biznesin' : 'Krijo llogari'} <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Keni llogari?{' '}
          <Link
            to={businessIntent ? '/login?intent=business' : '/login'}
            className="font-semibold text-forest"
          >
            Hyni
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });
  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordValues) =>
      api<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(values),
      }),
  });
  return (
    <AuthShell>
      <div className="mt-14">
        <p className="eyebrow">Rikupero llogarinë</p>
        <h2 className="display mt-2 text-3xl font-bold">Harruat fjalëkalimin?</h2>
        <p className="mt-3 leading-6 text-slate-600">
          Shkruani emailin e llogarisë. Do t’ju dërgojmë një lidhje të sigurt për fjalëkalim të ri.
        </p>
        {mutation.isSuccess ? (
          <div className="mt-7 rounded-2xl bg-green-50 p-5 text-sm leading-6 text-green-900">
            Kontrolloni emailin tuaj. Në versionin lokal, lidhja shfaqet në dritaren e serverit.
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="mt-8 space-y-4"
          >
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              error={form.formState.errors.email?.message}
              {...form.register('email')}
            />
            {mutation.error && (
              <p className="text-sm text-red-600">
                Nuk mundëm ta përpunojmë kërkesën. Provoni përsëri.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Duke dërguar...' : 'Dërgo lidhjen e rikuperimit'}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-slate-600">
          <Link className="font-semibold text-forest" to="/login">
            Kthehu te hyrja
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const form = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });
  const mutation = useMutation({
    mutationFn: (values: ResetPasswordValues) =>
      api<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: values.password }),
      }),
    onSuccess: () => navigate('/account'),
  });
  return (
    <AuthShell>
      <div className="mt-14">
        <p className="eyebrow">Fjalëkalim i ri</p>
        <h2 className="display mt-2 text-3xl font-bold">Vendosni fjalëkalimin e ri</h2>
        {!token ? (
          <div className="mt-7 rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            Lidhja mungon ose nuk është e plotë. Kërkoni një lidhje të re rikuperimi.
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="mt-8 space-y-4"
          >
            <Field
              label="Fjalëkalimi i ri"
              type="password"
              autoComplete="new-password"
              error={form.formState.errors.password?.message}
              {...form.register('password')}
            />
            <Field
              label="Përsëriteni fjalëkalimin"
              type="password"
              autoComplete="new-password"
              error={form.formState.errors.confirmPassword?.message}
              {...form.register('confirmPassword')}
            />
            {mutation.error && (
              <p className="text-sm text-red-600">
                Lidhja ka skaduar ose nuk është e vlefshme. Kërkoni një lidhje të re.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Duke ruajtur...' : 'Ruaj fjalëkalimin e ri'}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-slate-600">
          <Link className="font-semibold text-forest" to="/forgot-password">
            Kërko lidhje të re
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const mutation = useMutation({
    mutationFn: () =>
      api<{ message: string }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
    onSuccess: () => navigate('/login'),
  });
  return (
    <AuthShell>
      <div className="mt-14">
        <p className="eyebrow">Siguria e llogarisë</p>
        <h2 className="display mt-2 text-3xl font-bold">Verifikoni emailin</h2>
        <p className="mt-3 leading-6 text-slate-600">
          Verifikimi ndihmon që rezervimet dhe rikuperimi i llogarisë të mbeten të sigurt.
        </p>
        {!token ? (
          <p className="mt-7 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900">
            Lidhja e verifikimit mungon ose nuk është e plotë.
          </p>
        ) : (
          <>
            {mutation.error && (
              <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                Lidhja ka skaduar ose nuk është e vlefshme. Hyni në llogari për të kërkuar një
                tjetër.
              </p>
            )}
            <Button
              className="mt-7 w-full"
              disabled={mutation.isPending || mutation.isSuccess}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending
                ? 'Duke verifikuar...'
                : mutation.isSuccess
                  ? 'Emaili u verifikua'
                  : 'Verifiko emailin'}
            </Button>
          </>
        )}
        <p className="mt-6 text-center text-sm text-slate-600">
          <Link className="font-semibold text-forest" to="/login">
            Kthehu te hyrja
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
