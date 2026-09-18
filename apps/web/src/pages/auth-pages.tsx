import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, MailCheck, ShieldCheck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Logo } from '../components/site-header';
import { Button } from '../components/ui/button';
import { GoogleSignInButton, TurnstileWidget } from '../components/security-widgets';
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
  const google = useMutation({
    mutationFn: (credential: string) => api('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
    onSuccess: () => navigate(businessIntent ? '/dashboard' : '/account'),
  });
  const googleCredential = useCallback((credential: string) => google.mutate(credential), [google]);
  return (
    <AuthShell>
      <div className="mt-14">
        <p className="eyebrow">Mirë se u kthyet</p>
        <h2 className="display mt-2 text-3xl font-bold">
          {businessIntent ? 'Hyni në biznesin tuaj' : 'Hyni në llogarinë tuaj'}
        </h2>
        <div className="mt-7"><GoogleSignInButton onCredential={googleCredential} /></div>
        {import.meta.env.VITE_GOOGLE_CLIENT_ID && <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-line" />ose me email<span className="h-px flex-1 bg-line" /></div>}
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
  const [turnstileToken, setTurnstileToken] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const mutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      api<{ email: string; verificationRequired: boolean }>('/auth/register', { method: 'POST', body: JSON.stringify({ ...values, turnstileToken }) }),
    onSuccess: (data) => setPendingEmail(data.email),
  });
  const verifyCode = useMutation({
    mutationFn: () => api('/auth/verify-registration-code', {
      method: 'POST',
      body: JSON.stringify({ email: pendingEmail, code: verificationCode }),
    }),
    onSuccess: () => navigate(businessIntent ? '/onboarding' : '/account'),
  });
  const google = useMutation({
    mutationFn: (credential: string) => api('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
    onSuccess: () => navigate(businessIntent ? '/onboarding' : '/account'),
  });
  const googleCredential = useCallback((credential: string) => google.mutate(credential), [google]);
  if (pendingEmail) return (
    <AuthShell>
      <div className="mt-14">
        <span className="grid size-14 place-items-center rounded-2xl bg-green-100 text-forest"><MailCheck size={28} /></span>
        <p className="eyebrow mt-6">Kontrolloni emailin</p>
        <h2 className="display mt-2 text-3xl font-bold">Shkruani kodin 6-shifror</h2>
        <p className="mt-3 leading-6 text-slate-600">Kodi u dërgua te <strong className="text-ink">{pendingEmail}</strong> dhe vlen 10 minuta.</p>
        <form className="mt-7 space-y-4" onSubmit={(event) => { event.preventDefault(); verifyCode.mutate(); }}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Kodi i verifikimit</span>
            <input
              autoFocus
              className="input h-14 text-center text-2xl font-bold tracking-[.35em]"
              inputMode="numeric"
              maxLength={6}
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
              placeholder="000000"
            />
          </label>
          {verifyCode.error && <p className="text-sm text-red-600">{verifyCode.error instanceof ApiError ? verifyCode.error.message : 'Kodi nuk mund të verifikohet.'}</p>}
          <Button className="w-full" type="submit" disabled={verificationCode.length !== 6 || verifyCode.isPending}>
            {verifyCode.isPending ? 'Duke verifikuar...' : <><ShieldCheck size={17} /> Verifiko dhe vazhdo</>}
          </Button>
        </form>
        <button className="mt-5 w-full text-center text-sm font-semibold text-forest" type="button" onClick={() => { setPendingEmail(''); setVerificationCode(''); mutation.reset(); }}>
          Ndrysho emailin ose dërgo kod të ri
        </button>
      </div>
    </AuthShell>
  );
  return (
    <AuthShell>
      <div className="mt-10">
        <p className="eyebrow">{businessIntent ? 'Fillo biznesin' : 'Fillo si klient'}</p>
        <h2 className="display mt-2 text-3xl font-bold">
          {businessIntent ? 'Krijoni llogarinë e biznesit' : 'Krijoni llogarinë tuaj'}
        </h2>
        <div className="mt-6"><GoogleSignInButton onCredential={googleCredential} /></div>
        {import.meta.env.VITE_GOOGLE_CLIENT_ID && <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-line" />ose regjistrohu me email<span className="h-px flex-1 bg-line" /></div>}
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
          <div className="sm:col-span-2"><TurnstileWidget onToken={setTurnstileToken} /></div>
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
