import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BedDouble, CalendarDays, Check, ChevronDown, Clock3, Info, MapPinned, Pencil, Plus, Route, Sparkles, UserPlus, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { api, ApiError } from '../lib/api';
import { dateTime, money } from '../lib/utils';
import { useTenant } from './dashboard-page';
import { useI18n } from '../lib/i18n';
import { categoryUi } from '../lib/business-category-ui';

type Staff = {
  id: string;
  name: string;
  position: string | null;
  roomNumber: string | null;
  bedCount: number | null;
  capacity: number;
  active: boolean;
  services?: Array<{ service: { name: string } }>;
};
type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: string;
  bufferBefore: number;
  bufferAfter: number;
  active: boolean;
  bookingDetails: TourDetails | null;
  staff: Array<{ staff: Staff }>;
};
type TourDetails = {
  departurePoint?: string;
  returnPoint?: string;
  departureTime?: string;
  minParticipants?: number;
  maxParticipants?: number;
  inclusions?: string;
};
type TourDeparture = {
  id: string;
  startAt: string;
  endAt: string;
  capacity: number;
  active: boolean;
  bookedSeats: number;
  staff: { id: string; name: string };
};
type Booking = {
  id: string;
  startAt: string;
  status: string;
  price: string;
  customerNote: string | null;
  kind: 'APPOINTMENT' | 'ACCOMMODATION' | 'TRANSPORT' | 'TOUR';
  checkInDate: string | null;
  checkOutDate: string | null;
  guestCount: number | null;
  pickupAddress: string | null;
  destinationAddress: string | null;
  passengerCount: number | null;
  payment: { status: string; amount: string; currency: string } | null;
  customer: { name: string; phone: string | null; email: string | null };
  service: { name: string };
  staff: { name: string };
};
function BookingDetails({ booking }: { booking: Booking }) {
  if (booking.kind === 'TRANSPORT') return (
    <span className="mt-1 block max-w-md text-xs leading-5 text-slate-600">
      Rruga: <b>{booking.pickupAddress}</b> → <b>{booking.destinationAddress}</b>{booking.passengerCount ? ` · ${booking.passengerCount} udhëtarë` : ''}
    </span>
  );
  if (booking.kind === 'ACCOMMODATION') return (
    <span className="mt-1 block text-xs leading-5 text-slate-600">
      Qëndrim: <b>{booking.checkInDate?.slice(0, 10)}</b> → <b>{booking.checkOutDate?.slice(0, 10)}</b>{booking.guestCount ? ` · ${booking.guestCount} mysafirë` : ''}
    </span>
  );
  if (booking.kind === 'TOUR') return (
    <span className="mt-1 block text-xs leading-5 text-slate-600">
      Tur: <b>{booking.guestCount ?? 1} pjesëmarrës</b>
    </span>
  );
  return booking.customerNote ? <span className="mt-1 block max-w-64 text-xs leading-5 text-slate-500">Shënim: {booking.customerNote}</span> : null;
}
function PaymentStatus({ payment }: { payment: Booking['payment'] }) {
  if (!payment) return null;
  return <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${payment.status === 'PAID' ? 'bg-green-50 text-forest' : 'bg-amber-50 text-amber-800'}`}>
    {payment.status === 'PAID' ? `Paguar · ${money(payment.amount, payment.currency)}` : `Në pritje të pagesës · ${money(payment.amount, payment.currency)}`}
  </span>;
}
type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bookings: Array<{ status: string; price: string; startAt: string }>;
};
function useBusinessQuery<T>(key: string, path: string, refresh = false) {
  const { membership } = useTenant();
  return useQuery({
    queryKey: [key, membership?.business.id],
    enabled: Boolean(membership),
    queryFn: () => api<T>(path, {}, membership!.business.id),
    refetchInterval: refresh ? 15_000 : false,
  });
}
function TourDeparturePanel({ service }: { service: Service }) {
  const { membership } = useTenant();
  const client = useQueryClient();
  const guides = service.staff.map((item) => item.staff);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    staffId: guides[0]?.id ?? '',
    startAt: '',
    capacity: Math.min(service.bookingDetails?.maxParticipants ?? guides[0]?.capacity ?? 1, guides[0]?.capacity ?? 1),
  });
  const departures = useQuery({
    queryKey: ['tour-departures', membership?.business.id, service.id],
    enabled: Boolean(membership),
    queryFn: () => api<{ departures: TourDeparture[] }>(`/business/tour-departures?serviceId=${service.id}`, {}, membership!.business.id),
  });
  const create = useMutation({
    mutationFn: () => api('/business/tour-departures', {
      method: 'POST',
      body: JSON.stringify({ ...values, startAt: new Date(values.startAt).toISOString() }),
    }, membership!.business.id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['tour-departures', membership?.business.id, service.id] });
      setValues({ ...values, startAt: '' });
      setOpen(false);
    },
  });
  const close = useMutation({
    mutationFn: (id: string) => api(`/business/tour-departures/${id}`, { method: 'PATCH', body: JSON.stringify({ active: false }) }, membership!.business.id),
    onSuccess: () => client.invalidateQueries({ queryKey: ['tour-departures', membership?.business.id, service.id] }),
  });
  const selectGuide = (staffId: string) => {
    const guide = guides.find((item) => item.id === staffId);
    setValues({ ...values, staffId, capacity: Math.min(service.bookingDetails?.maxParticipants ?? guide?.capacity ?? 1, guide?.capacity ?? 1) });
  };
  return (
    <section className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink"><CalendarDays size={16} className="text-indigo-700" /> Nisjet e planifikuara</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">Publikoni vetëm datat, orët dhe vendet që janë realisht në dispozicion.</p>
        </div>
        <Button type="button" size="sm" onClick={() => setOpen(!open)} disabled={!guides.length}><Plus size={14} /> Nisje</Button>
      </div>
      {!guides.length && <p className="mt-3 rounded-xl bg-white p-3 text-xs text-amber-800">Së pari lidheni këtë tur me një guidë ose automjet.</p>}
      {open && (
        <form className="mt-4 grid gap-3 rounded-xl bg-white p-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
          <label><span className="mb-1 block text-xs font-semibold">Guida / automjeti</span><select required className="input" value={values.staffId} onChange={(event) => selectGuide(event.target.value)}>{guides.map((guide) => <option key={guide.id} value={guide.id}>{guide.name}</option>)}</select></label>
          <label><span className="mb-1 block text-xs font-semibold">Data dhe ora e nisjes</span><input required className="input" type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={values.startAt} onChange={(event) => setValues({ ...values, startAt: event.target.value })} /></label>
          <label><span className="mb-1 block text-xs font-semibold">Vende në dispozicion</span><input required className="input" type="number" min="1" max={guides.find((guide) => guide.id === values.staffId)?.capacity ?? 1} value={values.capacity} onChange={(event) => setValues({ ...values, capacity: Number(event.target.value) })} /></label>
          <div className="flex items-end gap-2"><Button type="submit" size="sm" disabled={create.isPending}>Publiko nisjen</Button><Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>Mbyll</Button></div>
          {create.error && <p className="sm:col-span-2 text-xs text-red-700">{create.error instanceof Error ? create.error.message : 'Nuk mundëm ta krijojmë nisjen.'}</p>}
        </form>
      )}
      {departures.isLoading && <div className="mt-3 h-12 animate-pulse rounded-xl bg-white" />}
      {departures.data?.departures.length ? <div className="mt-3 space-y-2">{departures.data.departures.map((departure) => <div key={departure.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-xs ${departure.active ? '' : 'opacity-60'}`}><span><b className="block text-sm text-ink">{dateTime(departure.startAt)}</b><span className="text-slate-500">{departure.staff.name} · {departure.bookedSeats}/{departure.capacity} vende të zëna</span></span>{departure.active ? <Button type="button" size="sm" variant="secondary" disabled={close.isPending} onClick={() => close.mutate(departure.id)}>Mbyll nisjen</Button> : <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">E mbyllur</span>}</div>)}</div> : !departures.isLoading && <p className="mt-3 text-xs text-slate-500">Ende nuk ka nisje të publikuara.</p>}
    </section>
  );
}
export function BookingsPage({ calendar = false }: { calendar?: boolean }) {
  const { membership } = useTenant();
  const query = useBusinessQuery<{ bookings: Booking[] }>(
    calendar ? 'calendar-bookings' : 'bookings',
    calendar ? '/business/bookings?scope=upcoming&limit=100' : '/business/bookings?limit=100',
    true,
  );
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(
        `/business/bookings/${id}/status`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
        membership!.business.id,
      ),
    onSuccess: () => Promise.all(['bookings', 'calendar-bookings', 'dashboard', 'customers'].map((key) => client.invalidateQueries({ queryKey: [key] }))),
  });
  if (query.isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-white" />;
  if (query.isError) return <EmptyState title="Rezervimet nuk u ngarkuan" detail="Provoni përsëri." action={<Button onClick={() => query.refetch()}>Provo përsëri</Button>} />;
  const bookings = query.data?.bookings ?? [];
  if (calendar)
    return (
      <>
        <div>
          <p className="eyebrow">Kalendari</p>
          <h1 className="display mt-1 text-3xl font-bold">Terminet e ardhshme</h1>
        </div>
        <div className="surface mt-7 divide-y divide-line">
          {bookings.length ? (
            bookings.map((booking) => (
              <article
                className="grid gap-2 p-5 sm:grid-cols-[145px_1fr_auto] sm:items-center"
                key={booking.id}
              >
                <div className="font-semibold text-forest">{dateTime(booking.startAt)}</div>
                <div>
                  <b className="block">{booking.customer.name}</b>
                  <span className="text-sm text-slate-500">
                    {booking.service.name} · {booking.staff.name}
                  </span>
                  <BookingDetails booking={booking} />
                  <PaymentStatus payment={booking.payment} />
                </div>
                <Status status={booking.status} />
              </article>
            ))
          ) : (
            <div className="p-5">
              <EmptyState
                title="Kalendari është i lirë"
                detail="Rezervimet e konfirmuara do të shfaqen këtu."
              />
            </div>
          )}
        </div>
      </>
    );
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Rezervimet</p>
          <h1 className="display mt-1 text-3xl font-bold">Të gjitha rezervimet</h1>
        </div>
        <Link to={`/${membership?.business.slug}`} target="_blank">
          <Button size="sm">
            <Plus size={15} /> Hap faqen
          </Button>
        </Link>
      </div>
      {mutation.error && <p role="alert" className="mt-4 text-sm text-red-600">{mutation.error.message}</p>}
      <section className="surface mt-7 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-sand text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Klienti</th>
                <th className="px-5 py-3">Shërbimi</th>
                <th className="px-5 py-3">Ora</th>
                <th className="px-5 py-3">Statusi</th>
                <th className="px-5 py-3">Veprimi</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-t border-line">
                  <td className="px-5 py-4">
                    <b className="block">{booking.customer.name}</b>
                    <span className="text-xs text-slate-500">
                      {booking.customer.phone ?? booking.customer.email}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {booking.service.name}
                    <span className="block text-xs text-slate-500">{booking.staff.name}</span>
                    <BookingDetails booking={booking} />
                    <PaymentStatus payment={booking.payment} />
                  </td>
                  <td className="px-5 py-4">{dateTime(booking.startAt)}</td>
                  <td className="px-5 py-4">
                    <Status status={booking.status} />
                  </td>
                  <td className="px-5 py-4">
                    {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                      <select
                        disabled={mutation.isPending}
                        aria-label="Ndrysho statusin"
                        className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                        value=""
                        onChange={(event) =>
                          event.target.value &&
                          mutation.mutate({ id: booking.id, status: event.target.value })
                        }
                      >
                        <option value="" disabled>
                          Ndrysho
                        </option>
                        {booking.status === 'PENDING' && (
                          <option value="CONFIRMED">Konfirmo</option>
                        )}
                        <option value="COMPLETED">Përfundo</option>
                        <option value="NO_SHOW">Nuk u paraqit</option>
                        <option value="CANCELLED">Anulo</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!bookings.length && (
          <div className="p-5">
            <EmptyState
              title="Ende nuk ka rezervime"
              detail="Rezervimet e reja do të shfaqen këtu automatikisht."
            />
          </div>
        )}
      </section>
    </>
  );
}
function Status({ status }: { status: string }) {
  const style =
    status === 'CONFIRMED'
      ? 'bg-green-50 text-forest'
      : status === 'CANCELLED'
        ? 'bg-red-50 text-red-700'
        : status === 'COMPLETED'
          ? 'bg-blue-50 text-blue-700'
          : 'bg-amber-50 text-amber-700';
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${style}`}>
      {status === 'CONFIRMED'
        ? 'Konfirmuar'
        : status === 'PENDING'
          ? 'Në pritje'
          : status === 'COMPLETED'
            ? 'Përfunduar'
            : status === 'NO_SHOW'
              ? 'Nuk u paraqit'
              : 'Anuluar'}
    </span>
  );
}
export function StaffPage() {
  const { membership } = useTenant();
  const current = useBusinessQuery<{ business: { category: { slug: string } | null } }>('business-current', '/business/current');
  const ui = categoryUi(current.data?.business.category?.slug);
  const isHotel = current.data?.business.category?.slug === 'hotels';
  const query = useBusinessQuery<{ staff: Staff[] }>('staff', '/business/staff');
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ name: '', position: '', bio: '', capacity: 1, roomNumber: '', bedCount: 1 });
  const mutation = useMutation({
    mutationFn: () =>
      api(
        '/business/staff',
        { method: 'POST', body: JSON.stringify(values) },
        membership!.business.id,
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['staff'] });
      setValues({ name: '', position: '', bio: '', capacity: 1, roomNumber: '', bedCount: 1 });
      setOpen(false);
    },
  });
  const staff = query.data?.staff ?? [];
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">{isHotel ? 'Inventari i akomodimit' : 'Kapaciteti i biznesit'}</p>
          <h1 className="display mt-1 text-3xl font-bold">{ui.resourcePlural}</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            {isHotel ? 'Shtoni çdo dhomë fizike që klienti mund ta rezervojë.' : `Shtoni çdo ${ui.resourceSingular} që klienti mund ta rezervojë.`}
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <UserPlus size={15} /> Shto {ui.resourceSingular}
        </Button>
      </div>
      {open && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
          className="surface mt-5 grid gap-3 p-5 sm:grid-cols-4"
        >
          {isHotel && (
            <div className="sm:col-span-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-950">
              <b className="flex items-center gap-2"><BedDouble size={17} /> Dhoma fizike</b>
              <p className="mt-1 text-indigo-800">Shtoni secilën dhomë që mund të rezervohet: p.sh. Dhoma 123, lloji “Dyshe”, 2 shtretër dhe 2 mysafirë maksimum.</p>
            </div>
          )}
          <input
            required
            className="input"
            placeholder={isHotel ? 'p.sh. Dhoma 123' : `p.sh. ${ui.resourceExample}`}
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
          />
          {isHotel && <input className="input" placeholder="Numri i dhomës, p.sh. 123" value={values.roomNumber} onChange={(event) => setValues({ ...values, roomNumber: event.target.value })} />}
          <input
            className="input"
            placeholder={isHotel ? 'Lloji, p.sh. Dyshe standarde' : `Roli ose lloji i ${ui.resourceSingular}`}
            value={values.position}
            onChange={(event) => setValues({ ...values, position: event.target.value })}
          />
          {isHotel && <label><span className="sr-only">Numri i shtretërve</span><input required aria-label="Numri i shtretërve" className="input" type="number" min="1" max="20" value={values.bedCount} onChange={(event) => setValues({ ...values, bedCount: Number(event.target.value) })} /></label>}
          <label>
            <span className="sr-only">{isHotel ? 'Mysafirë maksimum' : 'Kapaciteti'}</span>
            <input
              required
              aria-label={isHotel ? 'Mysafirë maksimum' : 'Kapaciteti'}
              className="input"
              type="number"
              min="1"
              max="1000"
              value={values.capacity}
              onChange={(event) => setValues({ ...values, capacity: Number(event.target.value) })}
            />
          </label>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder={isHotel ? 'Detaje të dhomës (opsionale)' : 'Përshkrim i shkurtër'}
              value={values.bio}
              onChange={(event) => setValues({ ...values, bio: event.target.value })}
            />
            <Button type="submit" disabled={mutation.isPending}>
              <Check size={16} />
            </Button>
          </div>
          {mutation.error && (
            <p className="text-sm text-red-600 sm:col-span-3">
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : 'Nuk mundëm ta shtojmë.'}
            </p>
          )}
        </form>
      )}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((person) => (
          <article key={person.id} className="surface p-5">
            <span className="grid size-12 place-items-center rounded-full bg-green-100 font-bold text-forest">
              {person.name.slice(0, 1)}
            </span>
            <h2 className="mt-4 font-bold">{person.name}</h2>
            <p className="text-sm text-slate-500">{person.position ?? ui.resourceSingular}</p>
            {isHotel && <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-indigo-700"><span>{person.roomNumber ? `Dhoma ${person.roomNumber}` : person.name}</span><span>{person.bedCount ?? 1} {person.bedCount === 1 ? 'shtrat' : 'shtretër'}</span></p>}
            <p className="mt-1 text-xs text-slate-500">{isHotel ? 'Mysafirë maksimum' : 'Kapaciteti'}: {person.capacity}</p>
            <p className="mt-4 border-t border-line pt-3 text-xs text-slate-500">
              {person.services?.length
                ? person.services.map((item) => item.service.name).join(', ')
                : 'Pa oferta të caktuara'}
            </p>
          </article>
        ))}
      </div>
      {!staff.length && !query.isLoading && (
        <div className="mt-7">
          <EmptyState
            title={`Nuk keni shtuar ${ui.resourcePlural.toLowerCase()}`}
            detail={isHotel ? 'Shtoni dhomën e parë fizike që klientët mund ta rezervojnë.' : `Shtoni ${ui.resourceSingular}in e parë që klientët do ta rezervojnë.`}
            action={<Button onClick={() => setOpen(true)}>Shto {ui.resourceSingular}</Button>}
          />
        </div>
      )}
    </>
  );
}
export function ServicesPage() {
  const { membership } = useTenant();
  const { locale } = useI18n();
  const services = useBusinessQuery<{ services: Service[] }>('services', '/business/services');
  const staff = useBusinessQuery<{ staff: Staff[] }>('staff', '/business/staff');
  const current = useBusinessQuery<{ business: { category: { slug: string } | null } }>('business-current', '/business/current');
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [values, setValues] = useState({
    name: '',
    description: '',
    durationMin: 30,
    price: 0,
    bufferBefore: 0,
    bufferAfter: 0,
    staffIds: [] as string[],
    bookingDetails: {} as TourDetails,
  });
  const mutation = useMutation({
    mutationFn: () =>
      api(
        editingId ? `/business/services/${editingId}` : '/business/services',
        { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(values) },
        membership!.business.id,
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['services'] });
      setOpen(false);
      setEditingId(undefined);
      setValues({
        name: '',
        description: '',
        durationMin: 30,
        price: 0,
        bufferBefore: 0,
        bufferAfter: 0,
        staffIds: [],
        bookingDetails: {},
      });
    },
  });
  const category = current.data?.business.category?.slug ?? '';
  const ui = categoryUi(category);
  const isHotel = category === 'hotels';
  const isTaxi = category === 'taxi-transport';
  const isTour = category === 'tourism-activities';
  const operationCopy = {
    restaurants: { duration: 'Kohëzgjatja e qëndrimit në tavolinë', before: 'Kohë për përgatitjen e tavolinës (min)', after: 'Kohë për pastrimin e tavolinës (min)' },
    'taxi-transport': { duration: 'Kohëzgjatja e parashikuar e udhëtimit', before: 'Kohë para nisjes (min)', after: 'Kohë ndërmjet udhëtimeve (min)' },
    rentals: { duration: 'Kohëzgjatja e qirasë', before: 'Kohë për dorëzim (min)', after: 'Kohë për kontroll pas kthimit (min)' },
    'events-venues': { duration: 'Kohëzgjatja e eventit', before: 'Kohë për përgatitjen e hapësirës (min)', after: 'Kohë për pastrimin e hapësirës (min)' },
    coworking: { duration: 'Kohëzgjatja e përdorimit', before: 'Kohë për përgatitjen e hapësirës (min)', after: 'Kohë për rregullimin e hapësirës (min)' },
    'home-services': { duration: 'Kohëzgjatja e vizitës', before: 'Kohë para nisjes në terren (min)', after: 'Kohë ndërmjet vizitave (min)' },
    photography: { duration: 'Kohëzgjatja e fotosesionit', before: 'Kohë për përgatitje (min)', after: 'Kohë për përfundim / përpunim (min)' },
    fitness: { duration: 'Kohëzgjatja e klasës ose seancës', before: 'Kohë për përgatitjen e sallës (min)', after: 'Kohë për pushim mes seancave (min)' },
    'tourism-activities': { duration: 'Kohëzgjatja e turit', before: 'Kohë për përgatitjen e grupit (min)', after: 'Kohë pas kthimit (min)' },
  }[category] ?? { duration: 'Kohëzgjatja e rezervimit', before: 'Kohë përgatitjeje para rezervimit (min)', after: 'Kohë pushimi pas rezervimit (min)' };
  const operationCopyEn = {
    restaurants: { duration: 'Table stay duration', before: 'Table preparation time (min)', after: 'Table cleaning time (min)' },
    'taxi-transport': { duration: 'Estimated trip duration', before: 'Time before departure (min)', after: 'Time between trips (min)' },
    rentals: { duration: 'Rental duration', before: 'Handover time (min)', after: 'Return inspection time (min)' },
    'events-venues': { duration: 'Event duration', before: 'Venue setup time (min)', after: 'Venue cleanup time (min)' },
    coworking: { duration: 'Usage duration', before: 'Workspace setup time (min)', after: 'Workspace reset time (min)' },
    'home-services': { duration: 'Visit duration', before: 'Travel preparation time (min)', after: 'Time between visits (min)' },
    photography: { duration: 'Photoshoot duration', before: 'Setup time (min)', after: 'Wrap-up / processing time (min)' },
    fitness: { duration: 'Class or session duration', before: 'Room setup time (min)', after: 'Break between sessions (min)' },
    'tourism-activities': { duration: 'Tour duration', before: 'Group preparation time (min)', after: 'Time after return (min)' },
  }[category] ?? { duration: 'Booking duration', before: 'Preparation time before booking (min)', after: 'Buffer time after booking (min)' };
  const copy = locale === 'en'
    ? {
        eyebrow: 'Your catalog', title: 'What can customers book?', add: 'Create offer',
        intro: isHotel ? 'Create one room type for every accommodation category, then connect the physical rooms that belong to that room type.' : isTour ? 'Create each tour with its itinerary, departure point, group size and price per guest.' : 'Create one offer for each service, stay, transfer, table or activity, then connect it to the person or resource that delivers it.',
        offer: 'Offer', resource: 'Provider / resource', newTitle: editingId ? 'Edit offer' : 'New offer',
        newHelp: 'Add only the information customers need before booking.', name: isHotel ? 'Room or stay name' : isTour ? 'Tour or activity name' : isTaxi ? 'Route or transfer name' : 'Offer name',
        namePlaceholder: isHotel ? 'e.g. Standard double room' : isTour ? 'e.g. Prizren day tour' : isTaxi ? 'e.g. Prishtina Airport transfer' : 'e.g. Haircut or consultation',
        duration: operationCopyEn.duration,
        price: isHotel ? 'Price per night (€)' : isTour ? 'Price per guest (€)' : isTaxi ? 'Trip price (€)' : 'Price per booking (€)',
        description: 'Offer description', select: isHotel ? 'Which rooms belong to this room type?' : 'Who or which resource provides this?', close: 'Close without saving',
        save: editingId ? 'Save changes' : 'Create and publish offer', edit: 'Edit', assigned: 'Provider / resource:', minutes: 'minutes',
        offerHelp: isHotel ? 'This is the room type customers see and book.' : 'This is the option a customer books.', resourceHelp: isHotel ? 'Choose at least one physical room for this room type.' : 'Choose the person or resource that delivers it.',
        durationHelp: 'Set the typical duration for this booking.',
        priceHelp: isHotel ? 'Set the price per night.' : 'Set the price for this booking; use 0 only when it is free.',
        descriptionPlaceholder: 'Add the details customers need before booking.', selectHelp: 'Select at least one person or resource.', titleLabel: 'Title customers see',
      }
    : {
        eyebrow: 'Katalogu juaj', title: ui.servicePlural, add: `Shto ${ui.serviceSingular}`,
        intro: isHotel ? 'Krijoni një lloj dhome për çdo kategori akomodimi, pastaj lidhni dhomat fizike që i përkasin atij lloji.' : isTour ? 'Krijoni secilin tur me itinerar, pikë nisjeje, pjesëmarrës dhe çmim për person.' : `Krijoni një ${ui.serviceSingular} për çdo zgjedhje që ofroni dhe lidheni me ${ui.resourceSingular}in që e realizon.`,
        offer: ui.serviceSingular, resource: ui.resourceSingular, newTitle: editingId ? `Ndrysho ${ui.serviceSingular}` : `Shto ${ui.serviceSingular}`,
        newHelp: `Plotësoni vetëm informacionin që klienti duhet të shohë para se të rezervojë këtë ${ui.serviceSingular}.`, name: isHotel ? 'Emri i dhomës ose qëndrimit' : isTour ? 'Emri i turit ose aktivitetit' : isTaxi ? 'Emri i rrugës ose transferit' : `Emri i ${ui.serviceSingular}`,
        namePlaceholder: isHotel ? 'p.sh. Dhomë dyshe standarde' : isTour ? 'p.sh. Tur ditor në Prizren' : isTaxi ? 'p.sh. Transfer Aeroporti i Prishtinës' : `p.sh. ${ui.serviceExample}`,
        duration: operationCopy.duration,
        price: isHotel ? 'Çmimi për një natë (€)' : isTour ? 'Çmimi për person (€)' : isTaxi ? 'Çmimi i udhëtimit (€)' : 'Çmimi për një rezervim (€)',
        description: `Përshkrimi për klientin`, select: isHotel ? 'Cilat dhoma i përkasin këtij lloji?' : `Cili ${ui.resourceSingular} e realizon?`, close: 'Mbyll pa ruajtur',
        save: editingId ? 'Ruaj ndryshimet' : `Ruaj ${ui.serviceSingular}in`, edit: 'Ndrysho', assigned: `${ui.resourcePlural}:`, minutes: 'minuta',
        offerHelp: isHotel ? `Ky është lloji i dhomës që e sheh klienti, p.sh. “${ui.serviceExample}”.` : `Kjo është zgjedhja që klienti rezervon, p.sh. “${ui.serviceExample}”.`, resourceHelp: isHotel ? `Zgjidhni të paktën një dhomë fizike, p.sh. “${ui.resourceExample}”.` : `Zgjidhni ${ui.resourceSingular}in që e realizon, p.sh. “${ui.resourceExample}”.`,
        durationHelp: isTour ? 'Vendosni kohëzgjatjen e plotë të turit.' : isTaxi ? 'Vendosni kohën e parashikuar të udhëtimit.' : `Vendosni sa zgjat zakonisht ${ui.serviceSingular}i.`,
        priceHelp: isHotel ? 'Vendosni çmimin për një natë.' : isTour ? 'Vendosni çmimin për një pjesëmarrës.' : isTaxi ? 'Vendosni çmimin e transferit ose niseni nga 0 për marrëveshje.' : `Vendosni çmimin për këtë ${ui.serviceSingular}; 0 përdoret vetëm kur është falas.`,
        descriptionPlaceholder: `p.sh. Detaje për ${ui.serviceExample.toLowerCase()}.`, selectHelp: `Zgjidhni të paktën një ${ui.resourceSingular}.`, titleLabel: 'Titulli që shohin klientët',
      };
  const editService = (service: Service) => {
    setValues({
      name: service.name, description: service.description ?? '', durationMin: service.durationMin,
      price: Number(service.price), bufferBefore: service.bufferBefore, bufferAfter: service.bufferAfter,
      staffIds: service.staff.map((item) => item.staff.id),
      bookingDetails: service.bookingDetails ?? {},
    });
    setEditingId(service.id);
    setOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="display mt-1 text-3xl font-bold">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {copy.intro}
          </p>
        </div>
        <Button size="sm" title="Hap formularin për të krijuar një ofertë të re" onClick={() => setOpen(!open)}>
          <Plus size={15} /> {copy.add}
        </Button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm text-slate-600">
          <b className="flex items-center gap-2 text-ink"><Sparkles size={16} className="text-cyan-700" /> {copy.offer}</b>
          <p className="mt-1">{copy.offerHelp}</p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-slate-600">
          <b className="flex items-center gap-2 text-ink"><UserPlus size={16} className="text-indigo-700" /> {copy.resource}</b>
          <p className="mt-1">{copy.resourceHelp}</p>
        </div>
      </div>
      {open && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
          className="surface mt-5 p-5 sm:p-7"
        >
          <div className="mb-6 flex items-start gap-3 border-b border-line pb-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-100 to-indigo-100 text-indigo-700"><Plus size={18} /></span>
            <div><h2 className="font-bold">{copy.newTitle}</h2><p className="mt-1 text-sm text-slate-500">{copy.newHelp}</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-semibold">{copy.titleLabel}</span>
              <input required className="input" placeholder={copy.namePlaceholder} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
              <small className="mt-1.5 block text-slate-500">{copy.offerHelp}</small>
            </label>
            {!isHotel && <label>
              <span className="mb-1.5 block text-sm font-semibold">{copy.duration}</span>
              <input
                required
                aria-label="Kohëzgjatja në minuta"
                className="input"
                type="number"
                min="5"
                max="480"
                value={values.durationMin}
                placeholder="30"
                onChange={(event) =>
                  setValues({ ...values, durationMin: Number(event.target.value) })
                }
              />
              <small className="mt-1.5 block text-slate-500">{copy.durationHelp}</small>
            </label>}
            <label>
              <span className="mb-1.5 block text-sm font-semibold">{copy.price}</span>
              <input
                required
                aria-label="Çmimi në euro"
                className="input"
                type="number"
                min="0"
                step="0.5"
                value={values.price}
                placeholder="p.sh. 45"
                onChange={(event) => setValues({ ...values, price: Number(event.target.value) })}
              />
              <small className="mt-1.5 block text-slate-500">{copy.priceHelp}</small>
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-semibold">{copy.description}</span>
              <textarea className="input min-h-24 py-3" placeholder={copy.descriptionPlaceholder} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} />
              <small className="mt-1.5 block text-slate-500">Tregoni shkurt çfarë merr klienti.</small>
            </label>
          </div>
          {isTour && (
            <section className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/60 p-4 sm:p-5">
              <div className="flex gap-3"><MapPinned className="mt-0.5 shrink-0 text-amber-700" size={19} /><div><h3 className="font-bold">Itinerari i turit</h3><p className="mt-1 text-sm text-slate-600">Këto shfaqen para rezervimit që klienti të dijë saktësisht ku, kur dhe çfarë po rezervon.</p></div></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label><span className="mb-1.5 block text-sm font-semibold">Pika e nisjes</span><input className="input" placeholder="p.sh. Sheshi Nënë Terezë, Prishtinë" value={values.bookingDetails.departurePoint ?? ''} onChange={(event) => setValues({ ...values, bookingDetails: { ...values.bookingDetails, departurePoint: event.target.value } })} /></label>
                <label><span className="mb-1.5 block text-sm font-semibold">Koha e nisjes</span><input className="input" placeholder="p.sh. 08:30" value={values.bookingDetails.departureTime ?? ''} onChange={(event) => setValues({ ...values, bookingDetails: { ...values.bookingDetails, departureTime: event.target.value } })} /></label>
                <label><span className="mb-1.5 block text-sm font-semibold">Pika e kthimit</span><input className="input" placeholder="p.sh. Prishtinë" value={values.bookingDetails.returnPoint ?? ''} onChange={(event) => setValues({ ...values, bookingDetails: { ...values.bookingDetails, returnPoint: event.target.value } })} /></label>
                <div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-sm font-semibold">Minimumi</span><input className="input" type="number" min="1" placeholder="1" value={values.bookingDetails.minParticipants ?? ''} onChange={(event) => setValues({ ...values, bookingDetails: { ...values.bookingDetails, minParticipants: event.target.value ? Number(event.target.value) : undefined } })} /></label><label><span className="mb-1.5 block text-sm font-semibold">Maksimumi</span><input className="input" type="number" min="1" placeholder="12" value={values.bookingDetails.maxParticipants ?? ''} onChange={(event) => setValues({ ...values, bookingDetails: { ...values.bookingDetails, maxParticipants: event.target.value ? Number(event.target.value) : undefined } })} /></label></div>
                <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Çfarë përfshihet <small className="font-normal text-slate-500">(opsionale)</small></span><textarea className="input min-h-20 py-3" placeholder="p.sh. Transporti, guida, hyrja në muze dhe drekë." value={values.bookingDetails.inclusions ?? ''} onChange={(event) => setValues({ ...values, bookingDetails: { ...values.bookingDetails, inclusions: event.target.value } })} /></label>
              </div>
            </section>
          )}
          {!isHotel && !isTour && <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-medium">
                {locale === 'en' ? operationCopyEn.before : operationCopy.before}
              </span>
              <input
                className="input"
                type="number"
                min="0"
                max="120"
                value={values.bufferBefore}
                onChange={(event) =>
                  setValues({ ...values, bufferBefore: Number(event.target.value) })
                }
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium">
                {locale === 'en' ? operationCopyEn.after : operationCopy.after}
              </span>
              <input
                className="input"
                type="number"
                min="0"
                max="120"
                value={values.bufferAfter}
                onChange={(event) =>
                  setValues({ ...values, bufferAfter: Number(event.target.value) })
                }
              />
            </label>
          </div>}
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">{copy.select}</legend>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Info size={14} /> {copy.selectHelp}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(staff.data?.staff ?? []).map((person) => (
                <label
                  key={person.id}
                  className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${values.staffIds.includes(person.id) ? 'border-forest bg-green-50 text-forest' : 'border-line'}`}
                >
                  <input
                    className="sr-only"
                    type="checkbox"
                    checked={values.staffIds.includes(person.id)}
                    onChange={() =>
                      setValues({
                        ...values,
                        staffIds: values.staffIds.includes(person.id)
                          ? values.staffIds.filter((id) => id !== person.id)
                          : [...values.staffIds, person.id],
                      })
                    }
                  />
                  {person.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {copy.close}
            </Button>
            <Button type="submit" disabled={!values.staffIds.length || mutation.isPending}>
              {copy.save}
            </Button>
          </div>
          {mutation.error && (
            <p className="mt-2 text-sm text-red-600">
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : 'Nuk mundëm ta ruajmë.'}
            </p>
          )}
        </form>
      )}
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {(services.data?.services ?? []).map((service) => (
          <article className="surface lift-3d p-5" key={service.id}>
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="font-bold">{service.name}</h2>
                {!isHotel && <p className="mt-1 text-sm text-slate-500">{copy.duration}: {service.durationMin} {copy.minutes}</p>}
              </div>
              <div className="text-right"><b className="block text-forest">{money(service.price)}</b>{isHotel && <small className="text-slate-500">/{locale === 'en' ? 'night' : 'natë'}</small>}</div>
            </div>
            {service.description && (
              <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
            )}
            {isTour && service.bookingDetails && (
              <div className="mt-4 grid gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-950 sm:grid-cols-2">
                {service.bookingDetails.departurePoint && <span className="flex gap-1.5"><Route size={14} className="shrink-0" /> Nisja: <b>{service.bookingDetails.departurePoint}</b></span>}
                {service.bookingDetails.departureTime && <span className="flex gap-1.5"><Clock3 size={14} className="shrink-0" /> Nisja në: <b>{service.bookingDetails.departureTime}</b></span>}
                {service.bookingDetails.returnPoint && <span>Kthimi: <b>{service.bookingDetails.returnPoint}</b></span>}
                {service.bookingDetails.maxParticipants && <span className="flex gap-1.5"><UsersRound size={14} className="shrink-0" /> Deri në <b>{service.bookingDetails.maxParticipants} pjesëmarrës</b></span>}
                {service.bookingDetails.inclusions && <span className="sm:col-span-2">Përfshin: <b>{service.bookingDetails.inclusions}</b></span>}
              </div>
            )}
            {isTour && <TourDeparturePanel service={service} />}
            <p className="mt-5 border-t border-line pt-3 text-xs text-slate-500">
              <b className="text-slate-700">{copy.assigned}</b>{' '}
              {service.staff.map((item) => item.staff.name).join(' · ') || 'Nuk është caktuar'}
            </p>
            <Button type="button" size="sm" variant="secondary" className="mt-4 w-full" title={locale === 'en' ? 'Change the name, price, details or assigned resource' : 'Ndrysho emrin, çmimin, detajet ose burimin e caktuar'} onClick={() => editService(service)}><Pencil size={14} /> {copy.edit}</Button>
          </article>
        ))}
      </div>
      {!services.data?.services.length && !services.isLoading && (
        <div className="mt-7">
          <EmptyState
            title="Nuk keni oferta"
            detail="Shtoni ofertën e parë dhe caktoni personin ose burimin që e ofron."
            action={
              staff.data?.staff.length ? (
                <Button onClick={() => setOpen(true)}>Shto ofertë</Button>
              ) : (
                <Link to="/dashboard/staff">
                  <Button>Shto ekipin ose burimin së pari</Button>
                </Link>
              )
            }
          />
        </div>
      )}
    </>
  );
}
export function CustomersPage() {
  const query = useBusinessQuery<{ customers: Customer[] }>('customers', '/business/customers');
  const customers = query.data?.customers ?? [];
  return (
    <>
      <div>
        <p className="eyebrow">Marrëdhëniet</p>
        <h1 className="display mt-1 text-3xl font-bold">Klientët</h1>
      </div>
      <section className="surface mt-7 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-sand text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Klienti</th>
                <th className="px-5 py-3">Kontakti</th>
                <th className="px-5 py-3">Rezervime</th>
                <th className="px-5 py-3">Shpenzime</th>
                <th className="px-5 py-3">Vizita e fundit</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const total = customer.bookings
                  .filter((item) => item.status === 'COMPLETED')
                  .reduce((sum, item) => sum + Number(item.price), 0);
                const last = customer.bookings.sort((a, b) =>
                  b.startAt.localeCompare(a.startAt),
                )[0];
                return (
                  <tr key={customer.id} className="border-t border-line">
                    <td className="px-5 py-4 font-semibold">{customer.name}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {customer.phone ?? customer.email ?? '—'}
                    </td>
                    <td className="px-5 py-4">{customer.bookings.length}</td>
                    <td className="px-5 py-4">{money(total)}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {last ? dateTime(last.startAt) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!customers.length && !query.isLoading && (
          <div className="p-5">
            <EmptyState
              title="Ende nuk ka klientë"
              detail="Klientët shfaqen këtu pasi krijohet rezervimi i parë."
            />
          </div>
        )}
      </section>
    </>
  );
}
