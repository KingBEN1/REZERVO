import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  Check,
  ClipboardCheck,
  Clock3,
  Image,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { api, ApiError, uploadBusinessImage } from '../lib/api';
import { useTenant } from './dashboard-page';

type Settings = {
  requireApproval: boolean;
  allowGuestBooking: boolean;
  minNoticeMinutes: number;
  maxBookingDays: number;
  cancellationDeadlineMin: number;
  reschedulingEnabled: boolean;
  reminderHours: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
};
type CurrentBusiness = {
  business: {
    id: string;
    name: string;
    description: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    city: string;
    municipality: string | null;
    address: string | null;
    latitude: string | null;
    longitude: string | null;
    logo: string | null;
    coverImage: string | null;
    category: { name: string } | null;
    settings: Settings | null;
  };
};
type WorkingHour = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
};
type DayHours = {
  dayOfWeek: number;
  label: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
};

const week: Array<Pick<DayHours, 'dayOfWeek' | 'label'>> = [
  { dayOfWeek: 1, label: 'E hënë' },
  { dayOfWeek: 2, label: 'E martë' },
  { dayOfWeek: 3, label: 'E mërkurë' },
  { dayOfWeek: 4, label: 'E enjte' },
  { dayOfWeek: 5, label: 'E premte' },
  { dayOfWeek: 6, label: 'E shtunë' },
  { dayOfWeek: 0, label: 'E diel' },
];
const defaultHours = (): DayHours[] =>
  week.map((day) => ({
    ...day,
    isOpen: day.dayOfWeek !== 0,
    startTime: '09:00',
    endTime: '18:00',
  }));

function MutationError({ error }: { error: unknown }) {
  return error ? (
    <p className="mt-3 text-sm text-red-600">
      {error instanceof ApiError
        ? error.message
        : 'Nuk mundëm t’i ruajmë ndryshimet. Provoni përsëri.'}
    </p>
  ) : null;
}

function PhotoUploader({
  business,
  tenantId,
}: {
  business: CurrentBusiness['business'];
  tenantId: string;
}) {
  const queryClient = useQueryClient();
  const upload = useMutation({
    mutationFn: async ({ file, field }: { file: File; field: 'logo' | 'coverImage' }) => {
      const { image } = await uploadBusinessImage(file, tenantId);
      await api(
        '/business/current',
        { method: 'PATCH', body: JSON.stringify({ [field]: image.url }) },
        tenantId,
      );
      return { image, field };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-current'] }),
  });
  const choose = (field: 'logo' | 'coverImage') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) upload.mutate({ file, field });
    event.currentTarget.value = '';
  };
  return (
    <section className="surface mt-6 max-w-3xl p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-green-50 text-forest">
          <Image size={19} />
        </span>
        <div>
          <h2 className="font-bold">Fotot e biznesit</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ngarkoni JPG, PNG ose WebP deri në 5 MB. Këto ruhen lokalisht gjatë zhvillimit.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="rounded-2xl border border-dashed border-line p-4 text-center hover:border-forest">
          <span className="block text-sm font-bold">Logo</span>
          {business.logo && (
            <img
              src={business.logo}
              alt="Logo e biznesit"
              className="mx-auto mt-3 size-16 rounded-xl object-cover"
            />
          )}
          <input
            className="mt-3 block w-full text-sm"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={upload.isPending}
            onChange={choose('logo')}
          />
        </label>
        <label className="rounded-2xl border border-dashed border-line p-4 text-center hover:border-forest">
          <span className="block text-sm font-bold">Foto e kopertinës</span>
          {business.coverImage && (
            <img
              src={business.coverImage}
              alt="Kopertina e biznesit"
              className="mx-auto mt-3 h-16 w-full rounded-xl object-cover"
            />
          )}
          <input
            className="mt-3 block w-full text-sm"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={upload.isPending}
            onChange={choose('coverImage')}
          />
        </label>
      </div>
      {upload.isPending && <p className="mt-3 text-sm text-slate-500">Fotoja po ngarkohet…</p>}
      <MutationError error={upload.error} />
    </section>
  );
}

export function BusinessProfilePage() {
  const { membership } = useTenant();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['business-current', membership?.business.id],
    enabled: Boolean(membership),
    queryFn: () => api<CurrentBusiness>('/business/current', {}, membership!.business.id),
  });
  const profile = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      api(
        '/business/current',
        { method: 'PATCH', body: JSON.stringify(values) },
        membership!.business.id,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-current'] }),
  });
  const settings = useMutation({
    mutationFn: (values: Settings) =>
      api(
        '/business/current/settings',
        { method: 'PATCH', body: JSON.stringify(values) },
        membership!.business.id,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-current'] }),
  });
  if (query.isLoading) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  if (!query.data)
    return (
      <EmptyState
        title="Profili nuk u ngarkua"
        detail="Provoni përsëri pas pak."
        action={<Button onClick={() => query.refetch()}>Provo përsëri</Button>}
      />
    );
  const business = query.data.business;
  const currentSettings = business.settings ?? {
    requireApproval: false,
    allowGuestBooking: true,
    minNoticeMinutes: 60,
    maxBookingDays: 30,
    cancellationDeadlineMin: 120,
    reschedulingEnabled: true,
    reminderHours: 24,
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
  };
  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const latitude = String(data.get('latitude') ?? '').trim();
    const longitude = String(data.get('longitude') ?? '').trim();
    profile.mutate({
      name: data.get('name'),
      description: data.get('description'),
      phone: data.get('phone'),
      email: data.get('email'),
      website: data.get('website'),
      city: data.get('city'),
      municipality: data.get('municipality'),
      address: data.get('address'),
      logo: data.get('logo'),
      coverImage: data.get('coverImage'),
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
    });
  };
  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    settings.mutate({
      requireApproval: data.get('requireApproval') === 'on',
      allowGuestBooking: data.get('allowGuestBooking') === 'on',
      minNoticeMinutes: Number(data.get('minNoticeMinutes')),
      maxBookingDays: Number(data.get('maxBookingDays')),
      cancellationDeadlineMin: Number(data.get('cancellationDeadlineMin')),
      reschedulingEnabled: data.get('reschedulingEnabled') === 'on',
      reminderHours: Number(data.get('reminderHours')),
      emailEnabled: data.get('emailEnabled') === 'on',
      smsEnabled: data.get('smsEnabled') === 'on',
      whatsappEnabled: data.get('whatsappEnabled') === 'on',
    });
  };
  return (
    <>
      <div>
        <p className="eyebrow">Prezantimi dhe rregullat</p>
        <h1 className="display mt-1 text-3xl font-bold">Profili i biznesit</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Një profil i plotë e bën faqen tuaj më të besueshme dhe u tregon klientëve saktësisht
          çfarë po rezervojnë.
        </p>
      </div>
      <PhotoUploader business={business} tenantId={membership!.business.id} />
      <form onSubmit={saveProfile} className="surface mt-6 max-w-3xl p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-green-50 text-forest">
            <Image size={19} />
          </span>
          <div>
            <h2 className="font-bold">Informacioni publik dhe harta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Shfaqet në faqen e biznesit dhe në rezultatet e kërkimit.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium">Emri i biznesit</span>
            <input required name="name" className="input" defaultValue={business.name} />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium">Përshkrimi</span>
            <textarea
              name="description"
              className="input min-h-28 py-3"
              defaultValue={business.description ?? ''}
              placeholder="Tregoni shkurt çfarë ofroni dhe pse klientët ju zgjedhin."
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium">Qyteti</span>
            <input required name="city" className="input" defaultValue={business.city} />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium">
              Komuna <small className="text-slate-400">(opsionale)</small>
            </span>
            <input
              name="municipality"
              className="input"
              defaultValue={business.municipality ?? ''}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium">Adresa</span>
            <input
              name="address"
              className="input"
              defaultValue={business.address ?? ''}
              placeholder="Rruga, numri, zona"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium">
              Gjerësia gjeografike <small className="text-slate-400">(opsionale)</small>
            </span>
            <input
              name="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              className="input"
              defaultValue={business.latitude ?? ''}
              placeholder="42.6629"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium">
              Gjatësia gjeografike <small className="text-slate-400">(opsionale)</small>
            </span>
            <input
              name="longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              className="input"
              defaultValue={business.longitude ?? ''}
              placeholder="21.1655"
            />
          </label>
          <p className="sm:col-span-2 -mt-2 text-xs text-slate-500">
            Kopjojini koordinatat nga harta për një pin të saktë; pa to përdoret kërkimi me adresë.
          </p>
          <label>
            <span className="mb-1.5 block text-sm font-medium">Telefoni</span>
            <input
              name="phone"
              className="input"
              defaultValue={business.phone ?? ''}
              placeholder="+383 44 123 456"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium">Email</span>
            <input
              name="email"
              type="email"
              className="input"
              defaultValue={business.email ?? ''}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium">
              Faqja web <small className="text-slate-400">(opsionale)</small>
            </span>
            <input
              name="website"
              type="url"
              className="input"
              defaultValue={business.website ?? ''}
              placeholder="https://..."
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium">
              URL e fotos së kopertinës <small className="text-slate-400">(opsionale)</small>
            </span>
            <input
              name="coverImage"
              type="url"
              className="input"
              defaultValue={business.coverImage ?? ''}
              placeholder="https://.../foto.jpg"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium">
              URL e logos <small className="text-slate-400">(opsionale)</small>
            </span>
            <input
              name="logo"
              type="url"
              className="input"
              defaultValue={business.logo ?? ''}
              placeholder="https://.../logo.png"
            />
          </label>
        </div>
        <MutationError error={profile.error} />
        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
          <span className="text-sm text-slate-500">
            Kategoria: <b className="text-ink">{business.category?.name ?? 'E pa zgjedhur'}</b>
          </span>
          <Button type="submit" disabled={profile.isPending}>
            {profile.isPending ? (
              'Duke ruajtur...'
            ) : (
              <>
                <Save size={16} /> Ruaj profilin
              </>
            )}
          </Button>
        </div>
      </form>
      <form onSubmit={saveSettings} className="surface mt-6 max-w-3xl p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-green-50 text-forest">
            <ShieldCheck size={19} />
          </span>
          <div>
            <h2 className="font-bold">Rregullat e rezervimit</h2>
            <p className="mt-1 text-sm text-slate-500">
              Këto rregulla u shfaqen klientëve para se ta konfirmojnë rezervimin.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-sm font-medium">Njoftimi minimal (minuta)</span>
            <input
              required
              name="minNoticeMinutes"
              type="number"
              min="0"
              max="10080"
              className="input"
              defaultValue={currentSettings.minNoticeMinutes}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium">
              Sa ditë përpara mund të rezervohet?
            </span>
            <input
              required
              name="maxBookingDays"
              type="number"
              min="1"
              max="365"
              className="input"
              defaultValue={currentSettings.maxBookingDays}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium">Afati i anulimit (minuta)</span>
            <input
              required
              name="cancellationDeadlineMin"
              type="number"
              min="0"
              max="43200"
              className="input"
              defaultValue={currentSettings.cancellationDeadlineMin}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium">Kujtesa para rezervimit (orë)</span>
            <input
              required
              name="reminderHours"
              type="number"
              min="0"
              max="720"
              className="input"
              defaultValue={currentSettings.reminderHours}
            />
          </label>
        </div>
        <div className="mt-5 grid gap-3 border-t border-line pt-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-3">
            <input
              name="allowGuestBooking"
              type="checkbox"
              className="mt-1 size-4 accent-[#155e75]"
              defaultChecked={currentSettings.allowGuestBooking}
            />
            <span>
              <b className="block text-sm">Lejo rezervim pa llogari</b>
              <small className="text-slate-500">
                Klienti mund të rezervojë vetëm me emër, telefon dhe email opsional.
              </small>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-3">
            <input
              name="requireApproval"
              type="checkbox"
              className="mt-1 size-4 accent-[#155e75]"
              defaultChecked={currentSettings.requireApproval}
            />
            <span>
              <b className="block text-sm">Kërko miratim para konfirmimit</b>
              <small className="text-slate-500">
                Rezervimet shkojnë fillimisht në pritje që t’i miratoni ju.
              </small>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-3">
            <input
              name="reschedulingEnabled"
              type="checkbox"
              className="mt-1 size-4 accent-[#155e75]"
              defaultChecked={currentSettings.reschedulingEnabled}
            />
            <span>
              <b className="block text-sm">Lejo ndryshim termini</b>
              <small className="text-slate-500">
                Politika shfaqet qartë në konfirmimin e klientit.
              </small>
            </span>
          </label>
          <div className="pt-2 text-sm font-bold text-slate-700">Njoftimet për klientin</div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-3">
            <input
              name="emailEnabled"
              type="checkbox"
              className="mt-1 size-4 accent-[#155e75]"
              defaultChecked={currentSettings.emailEnabled}
            />
            <span>
              <b className="block text-sm">Email</b>
              <small className="text-slate-500">
                Konfirmime dhe ndryshime dërgohen në emailin e klientit.
              </small>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-3">
            <input
              name="smsEnabled"
              type="checkbox"
              className="mt-1 size-4 accent-[#155e75]"
              defaultChecked={currentSettings.smsEnabled}
            />
            <span>
              <b className="block text-sm">SMS</b>
              <small className="text-slate-500">
                Kërkon lidhjen e një ofruesi SMS para dërgimit real.
              </small>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-3">
            <input
              name="whatsappEnabled"
              type="checkbox"
              className="mt-1 size-4 accent-[#155e75]"
              defaultChecked={currentSettings.whatsappEnabled}
            />
            <span>
              <b className="block text-sm">WhatsApp</b>
              <small className="text-slate-500">
                Kërkon WhatsApp Business dhe një ofrues të konfiguruar.
              </small>
            </span>
          </label>
        </div>
        <MutationError error={settings.error} />
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={settings.isPending}>
            {settings.isPending ? (
              'Duke ruajtur...'
            ) : (
              <>
                <Check size={16} /> Ruaj rregullat
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}

export function HoursPage() {
  const { membership } = useTenant();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['working-hours', membership?.business.id],
    enabled: Boolean(membership),
    queryFn: () => api<{ hours: WorkingHour[] }>('/business/hours', {}, membership!.business.id),
  });
  const [hours, setHours] = useState<DayHours[]>(defaultHours);
  const save = useMutation({
    mutationFn: () =>
      api(
        '/business/hours',
        {
          method: 'PUT',
          body: JSON.stringify({
            hours: hours.map(({ dayOfWeek, isOpen, startTime, endTime }) => ({
              dayOfWeek,
              isOpen,
              startTime,
              endTime,
            })),
          }),
        },
        membership!.business.id,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['working-hours'] }),
  });
  useEffect(() => {
    if (query.data)
      setHours(
        week.map((day) => {
          const found = query.data!.hours.find((item) => item.dayOfWeek === day.dayOfWeek);
          return found
            ? { ...day, isOpen: found.isOpen, startTime: found.startTime, endTime: found.endTime }
            : { ...day, isOpen: false, startTime: '09:00', endTime: '18:00' };
        }),
      );
  }, [query.data]);
  const update = (dayOfWeek: number, patch: Partial<DayHours>) =>
    setHours((current) =>
      current.map((item) => (item.dayOfWeek === dayOfWeek ? { ...item, ...patch } : item)),
    );
  if (query.isLoading) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  if (query.isError)
    return (
      <EmptyState
        title="Orari nuk u ngarkua"
        detail="Provoni përsëri pas pak."
        action={<Button onClick={() => query.refetch()}>Provo përsëri</Button>}
      />
    );
  return (
    <>
      <div>
        <p className="eyebrow">Disponueshmëria publike</p>
        <h1 className="display mt-1 text-3xl font-bold">Orari i punës</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Klientët shohin vetëm oraret e lira brenda këtij programi. Mund ta ndryshoni gjithmonë më
          vonë.
        </p>
      </div>
      <section className="surface mt-7 max-w-3xl p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-green-50 text-forest">
            <CalendarClock size={19} />
          </span>
          <div>
            <h2 className="font-bold">Programi javor</h2>
            <p className="mt-1 text-sm text-slate-500">
              Për orar të ndryshëm të secilit person ose burim, përdorni blloqet e veçanta të
              disponueshmërisë në një fazë të ardhshme.
            </p>
          </div>
        </div>
        <div className="mt-6 divide-y divide-line">
          {hours.map((day) => (
            <div key={day.dayOfWeek} className="grid gap-3 py-4 sm:grid-cols-[150px_1fr_1fr]">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="size-4 accent-[#155e75]"
                  checked={day.isOpen}
                  onChange={(event) => update(day.dayOfWeek, { isOpen: event.target.checked })}
                />
                <span className="font-semibold">{day.label}</span>
              </label>
              {day.isOpen ? (
                <>
                  <label>
                    <span className="sr-only">Hapja</span>
                    <input
                      aria-label={`${day.label} hapja`}
                      className="input"
                      type="time"
                      value={day.startTime}
                      onChange={(event) => update(day.dayOfWeek, { startTime: event.target.value })}
                    />
                  </label>
                  <label>
                    <span className="sr-only">Mbyllja</span>
                    <input
                      aria-label={`${day.label} mbyllja`}
                      className="input"
                      type="time"
                      value={day.endTime}
                      onChange={(event) => update(day.dayOfWeek, { endTime: event.target.value })}
                    />
                  </label>
                </>
              ) : (
                <p className="text-sm text-slate-400 sm:col-span-2">Mbyllur</p>
              )}
            </div>
          ))}
        </div>
        <MutationError error={save.error} />
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 text-sm text-slate-500">
            <Clock3 className="shrink-0 text-forest" size={18} />
            Sigurohuni që koha e mbylljes të jetë pas kohës së hapjes.
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? (
              'Duke ruajtur...'
            ) : (
              <>
                <ClipboardCheck size={16} /> Ruaj orarin
              </>
            )}
          </Button>
        </div>
      </section>
    </>
  );
}
