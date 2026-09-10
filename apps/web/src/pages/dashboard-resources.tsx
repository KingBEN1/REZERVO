import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, ChevronDown, Clock3, Plus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { api, ApiError } from '../lib/api';
import { dateTime, money } from '../lib/utils';
import { useTenant } from './dashboard-page';

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
function useBusinessQuery<T>(key: string, path: string) {
  const { membership } = useTenant();
  return useQuery({
    queryKey: [key, membership?.business.id],
    enabled: Boolean(membership),
    queryFn: () => api<T>(path, {}, membership!.business.id),
  });
}
export function BookingsPage({ calendar = false }: { calendar?: boolean }) {
  const { membership } = useTenant();
  const query = useBusinessQuery<{ bookings: Booking[] }>('bookings', '/business/bookings');
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(
        `/business/bookings/${id}/status`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
        membership!.business.id,
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: ['bookings'] }),
  });
  if (query.isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-white" />;
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
        <Link to={`/book/${membership?.business.slug}`} target="_blank">
          <Button size="sm">
            <Plus size={15} /> Hap faqen
          </Button>
        </Link>
      </div>
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
                        aria-label="Ndrysho statusin"
                        className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                        defaultValue=""
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
          <p className="eyebrow">Ekipi dhe kapaciteti</p>
          <h1 className="display mt-1 text-3xl font-bold">Ekipi / burimet</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Shtoni persona ose burime që mund të rezervohen: specialistë, dhoma, automjete,
            tavolina, pajisje apo hapësira.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <UserPlus size={15} /> Shto ekip / burim
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
            placeholder="p.sh. Dr. Arben, Dhoma 101, Taxi 04"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
          />
          <input
            className="input"
            placeholder="Roli ose lloji i burimit"
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
            <p className="text-sm text-slate-500">{person.position ?? 'Ofrues / burim'}</p>
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
            title="Nuk keni shtuar ekip ose burim"
            detail="Shtoni personin, dhomën, automjetin ose burimin e parë që klientët do ta rezervojnë."
            action={<Button onClick={() => setOpen(true)}>Shto ekip / burim</Button>}
          />
        </div>
      )}
    </>
  );
}
export function ServicesPage() {
  const { membership } = useTenant();
  const services = useBusinessQuery<{ services: Service[] }>('services', '/business/services');
  const staff = useBusinessQuery<{ staff: Staff[] }>('staff', '/business/staff');
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
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
        '/business/services',
        { method: 'POST', body: JSON.stringify(values) },
        membership!.business.id,
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['services'] });
      setOpen(false);
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
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Oferta juaj</p>
          <h1 className="display mt-1 text-3xl font-bold">Shërbimet / ofertat</h1>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus size={15} /> Shto ofertë
        </Button>
      </div>
      {open && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
          className="surface mt-5 p-5"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              className="input"
              placeholder="p.sh. Vizitë, Dhoma 101, Transfer aeroporti"
              value={values.name}
              onChange={(event) => setValues({ ...values, name: event.target.value })}
            />
            <label>
              <span className="sr-only">Kohëzgjatja</span>
              <input
                required
                aria-label="Kohëzgjatja në minuta"
                className="input"
                type="number"
                min="5"
                max="480"
                value={values.durationMin}
                onChange={(event) =>
                  setValues({ ...values, durationMin: Number(event.target.value) })
                }
              />
            </label>
            <label>
              <span className="sr-only">Çmimi</span>
              <input
                required
                aria-label="Çmimi në euro"
                className="input"
                type="number"
                min="0"
                step="0.5"
                value={values.price}
                onChange={(event) => setValues({ ...values, price: Number(event.target.value) })}
              />
            </label>
          </div>
          <textarea
            className="input mt-3 min-h-24 py-3"
            placeholder="Përshkruani çfarë përfshihet në këtë ofertë. Ky tekst i ndihmon klientët të zgjedhin."
            value={values.description}
            onChange={(event) => setValues({ ...values, description: event.target.value })}
          />
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
            <legend className="text-sm font-semibold">Kush ose cili burim e ofron këtë?</legend>
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
              Anulo
            </Button>
            <Button type="submit" disabled={!values.staffIds.length || mutation.isPending}>
              Ruaj ofertën
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
          <article className="surface p-5" key={service.id}>
            <div className="flex justify-between">
              <div>
                <h2 className="font-bold">{service.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{service.durationMin} minuta</p>
              </div>
              <b className="text-forest">{money(service.price)}</b>
            </div>
            {service.description && (
              <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
            )}
            <p className="mt-5 border-t border-line pt-3 text-xs text-slate-500">
              {service.staff.map((item) => item.staff.name).join(' · ')}
            </p>
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
