import { CalendarDays, Languages, LogOut, Menu, Store, UserRound, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../lib/i18n';
import { api } from '../lib/api';
import { Button } from './ui/button';

type Me = { user: { firstName: string; memberships: Array<{ business: { id: string } }> } };

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
      <span className="grid size-8 place-items-center rounded-xl bg-forest text-white">
        <CalendarDays size={17} />
      </span>
      rezervo
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, locale, setLocale } = useI18n();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/auth/me'),
    retry: false,
    staleTime: 30_000,
  });
  const hasBusiness = Boolean(me.data?.user.memberships.length);
  const logout = useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['me'] });
      queryClient.removeQueries({ queryKey: ['customer-dashboard'] });
      navigate('/');
    },
  });
  const links = [
    { to: '/businesses', label: t('discover') },
    { to: '/account', label: t('myBookings') },
    { to: '/about', label: t('about') },
  ];
  const userActions = me.data ? (
    <>
      <Link to="/account">
        <Button variant="ghost">
          <UserRound size={16} /> {me.data.user.firstName}
        </Button>
      </Link>
      <Button variant="ghost" onClick={() => logout.mutate()} disabled={logout.isPending}>
        <LogOut size={16} /> {t('logout')}
      </Button>
      {hasBusiness && (
        <Link to="/dashboard">
          <Button variant="secondary">
            <Store size={16} /> {t('dashboard')}
          </Button>
        </Link>
      )}
    </>
  ) : (
    <>
      <Link to="/login">
        <Button variant="ghost">{t('login')}</Button>
      </Link>
      <Link to="/register">
        <Button>{t('createAccount')}</Button>
      </Link>
    </>
  );
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-sand/90 shadow-[0_1px_0_rgba(15,42,31,.04)] backdrop-blur-xl">
      <div className="page-shell flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-slate-600 hover:text-ink"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <button
            aria-label={t('language')}
            onClick={() => setLocale(locale === 'sq' ? 'en' : 'sq')}
            className="grid size-10 place-items-center rounded-xl hover:bg-white"
          >
            <Languages size={18} />
          </button>
          {userActions}
          <Link
            to="/for-business"
            className="ml-1 text-sm font-semibold text-forest hover:underline"
          >
            {t('businesses')}
          </Link>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="grid size-10 place-items-center rounded-xl transition hover:bg-white lg:hidden"
          aria-label="Hap menunë"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-white/95 px-4 py-4 shadow-lg backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                onClick={() => setOpen(false)}
                key={link.to}
                to={link.to}
                className="font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Link
              onClick={() => setOpen(false)}
              to={me.data ? '/account' : '/login'}
              className="font-medium"
            >
              {me.data ? t('account') : t('login')}
            </Link>
            {hasBusiness && (
              <Link onClick={() => setOpen(false)} to="/dashboard" className="font-medium">
                {t('dashboard')}
              </Link>
            )}
            {me.data && (
              <button
                onClick={() => {
                  setOpen(false);
                  logout.mutate();
                }}
                className="flex items-center gap-2 font-medium text-slate-700"
              >
                <LogOut size={17} /> {t('logout')}
              </button>
            )}
            <Link
              onClick={() => setOpen(false)}
              to="/for-business"
              className="flex items-center gap-2 font-semibold text-forest"
            >
              <Store size={17} /> {t('businesses')}
            </Link>
            {!me.data && (
              <Link onClick={() => setOpen(false)} to="/register">
                <Button className="w-full">{t('createAccount')}</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
