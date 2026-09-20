import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, ChevronDown, Clock3, Info, Pencil, Plus, Sparkles, UserPlus } from 'lucide-react';
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
  staff: Array<{ staff: Staff }>;
};
type Booking = {
  id: string;
  startAt: string;
  status: string;
  price: string;
  customerNote: string | null;
  kind: 'APPOINTMENT' | 'ACCOMMODATION' | 'TRANSPORT';
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
  const query = useBusinessQuery<{ staff: Staff[] }>('staff', '/business/staff');
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ name: '', position: '', bio: '', capacity: 1 });
  const mutation = useMutation({
    mutationFn: () =>
      api(
        '/business/staff',
        { method: 'POST', body: JSON.stringify(values) },
        membership!.business.id,
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['staff'] });
      setValues({ name: '', position: '', bio: '', capacity: 1 });
      setOpen(false);
    },
  });
  const staff = query.data?.staff ?? [];
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Kapaciteti i biznesit</p>
          <h1 className="display mt-1 text-3xl font-bold">{ui.resourcePlural}</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Shtoni çdo {ui.resourceSingular} që klienti mund ta rezervojë.
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
          <input
            required
            className="input"
            placeholder={`p.sh. ${ui.resourceExample}`}
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
          />
          <input
            className="input"
            placeholder={`Roli ose lloji i ${ui.resourceSingular}`}
            value={values.position}
            onChange={(event) => setValues({ ...values, position: event.target.value })}
          />
          <label>
            <span className="sr-only">Kapaciteti</span>
            <input
              required
              aria-label="Kapaciteti"
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
              placeholder="Përshkrim i shkurtër"
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
            <p className="mt-1 text-xs text-slate-500">Kapaciteti: {person.capacity}</p>
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
            detail={`Shtoni ${ui.resourceSingular}in e parë që klientët do ta rezervojnë.`}
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
      });
    },
  });
  const category = current.data?.business.category?.slug ?? '';
  const ui = categoryUi(category);
  const isHotel = category === 'hotels';
  const isTaxi = category === 'taxi-transport';
  const copy = locale === 'en'
    ? {
        eyebrow: 'Your catalog', title: 'What can customers book?', add: 'Create offer',
        intro: 'Create one offer for each service, stay, transfer, table or activity, then connect it to the person or resource that delivers it.',
        offer: 'Offer', resource: 'Provider / resource', newTitle: editingId ? 'Edit offer' : 'New offer',
        newHelp: 'Add only the information customers need before booking.', name: isHotel ? 'Room or stay name' : isTaxi ? 'Route or transfer name' : 'Offer name',
        namePlaceholder: isHotel ? 'e.g. Standard double room' : isTaxi ? 'e.g. Prishtina Airport transfer' : 'e.g. Haircut or consultation',
        duration: isHotel ? 'Default booking block' : isTaxi ? 'Estimated trip duration' : 'Booking duration',
        price: isHotel ? 'Price per night (€)' : isTaxi ? 'Trip price (€)' : 'Price per booking (€)',
        description: 'Offer description', select: 'Who or which resource provides this?', close: 'Close without saving',
        save: editingId ? 'Save changes' : 'Create and publish offer', edit: 'Edit', assigned: 'Provider / resource:', minutes: 'minutes',
        offerHelp: 'This is the option a customer books.', resourceHelp: 'Choose the person or resource that delivers it.',
        durationHelp: isHotel ? 'For stays, the price is calculated per night.' : 'Set the typical duration for this booking.',
        priceHelp: isHotel ? 'Set the price per night.' : 'Set the price for this booking; use 0 only when it is free.',
        descriptionPlaceholder: 'Add the details customers need before booking.', selectHelp: 'Select at least one person or resource.', titleLabel: 'Title customers see',
      }
    : {
        eyebrow: 'Katalogu juaj', title: ui.servicePlural, add: `Shto ${ui.serviceSingular}`,
        intro: `Krijoni një ${ui.serviceSingular} për çdo zgjedhje që ofroni dhe lidheni me ${ui.resourceSingular}in që e realizon.`,
        offer: ui.serviceSingular, resource: ui.resourceSingular, newTitle: editingId ? `Ndrysho ${ui.serviceSingular}` : `Shto ${ui.serviceSingular}`,
        newHelp: `Plotësoni vetëm informacionin që klienti duhet të shohë para se të rezervojë këtë ${ui.serviceSingular}.`, name: isHotel ? 'Emri i dhomës ose qëndrimit' : isTaxi ? 'Emri i rrugës ose transferit' : `Emri i ${ui.serviceSingular}`,
        namePlaceholder: isHotel ? 'p.sh. Dhomë dyshe standarde' : isTaxi ? 'p.sh. Transfer Aeroporti i Prishtinës' : `p.sh. ${ui.serviceExample}`,
        duration: isHotel ? 'Blloku bazë i rezervimit' : isTaxi ? 'Kohëzgjatja e parashikuar e udhëtimit' : 'Kohëzgjatja e rezervimit',
        price: isHotel ? 'Çmimi për një natë (€)' : isTaxi ? 'Çmimi i udhëtimit (€)' : 'Çmimi për një rezervim (€)',
        description: `Përshkrimi për klientin`, select: `Cili ${ui.resourceSingular} e realizon?`, close: 'Mbyll pa ruajtur',
        save: editingId ? 'Ruaj ndryshimet' : `Ruaj ${ui.serviceSingular}in`, edit: 'Ndrysho', assigned: `${ui.resourcePlural}:`, minutes: 'minuta',
        offerHelp: `Kjo është zgjedhja që klienti rezervon, p.sh. “${ui.serviceExample}”.`, resourceHelp: `Zgjidhni ${ui.resourceSingular}in që e realizon, p.sh. “${ui.resourceExample}”.`,
        durationHelp: isHotel ? 'Për qëndrime, çmimi llogaritet për natë.' : isTaxi ? 'Vendosni kohën e parashikuar të udhëtimit.' : `Vendosni sa zgjat zakonisht ${ui.serviceSingular}i.`,
        priceHelp: isHotel ? 'Vendosni çmimin për një natë.' : isTaxi ? 'Vendosni çmimin e transferit ose niseni nga 0 për marrëveshje.' : `Vendosni çmimin për këtë ${ui.serviceSingular}; 0 përdoret vetëm kur është falas.`,
        descriptionPlaceholder: `p.sh. Detaje për ${ui.serviceExample.toLowerCase()}.`, selectHelp: `Zgjidhni të paktën një ${ui.resourceSingular}.`, titleLabel: 'Titulli që shohin klientët',
      };
  const editService = (service: Service) => {
    setValues({
      name: service.name, description: service.description ?? '', durationMin: service.durationMin,
      price: Number(service.price), bufferBefore: service.bufferBefore, bufferAfter: service.bufferAfter,
      staffIds: service.staff.map((item) => item.staff.id),
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
            <label>
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
            </label>
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
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-medium">
                Kohë përgatitjeje para rezervimit (min)
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
                Kohë pushimi pas rezervimit (min)
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
          </div>
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
