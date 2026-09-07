import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MapPin,
  Phone,
  Star,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { api, ApiError } from '../lib/api';
import { dateTime, localIsoDate, money } from '../lib/utils';

type Slot = { startAt: string; endAt: string };
type ManagedBooking = {
  reference: string;
  manageToken: string;
  startAt: string;
  endAt: string;
  status: string;
  kind: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  guestCount: number | null;
  pickupAddress: string | null;
  destinationAddress: string | null;
  passengerCount: number | null;
  price: string;
  currency: string;
  cancellationNote: string | null;
  business: {
    name: string;
    slug: string;
    city: string;
    address: string | null;
    phone: string | null;
    settings: { cancellationDeadlineMin: number; reschedulingEnabled: boolean } | null;
  };
  service: { id: string; name: string; durationMin: number };
  staff: { id: string; name: string; position: string | null };
  customer: { name: string };
  review: { rating: number; comment: string | null } | null;
};

function ErrorText({ error }: { error: unknown }) {
  return error ? (
    <p className="mt-3 text-sm text-red-700">
      {error instanceof ApiError ? error.message : 'Diçka shkoi keq. Provoni përsëri.'}
    </p>
  ) : null;
}
function Status({ status }: { status: string }) {
  const text =
    status === 'CONFIRMED'
      ? 'Konfirmuar'
      : status === 'PENDING'
        ? 'Në pritje të miratimit'
        : status === 'COMPLETED'
          ? 'Përfunduar'
          : status === 'CANCELLED'
            ? 'Anuluar'
            : status === 'NO_SHOW'
              ? 'Nuk u paraqit'
              : status;
  const style =
    status === 'CONFIRMED'
      ? 'bg-green-100 text-forest'
      : status === 'COMPLETED'
        ? 'bg-blue-50 text-blue-700'
        : status === 'CANCELLED'
          ? 'bg-red-50 text-red-700'
          : 'bg-amber-50 text-amber-800';
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${style}`}>{text}</span>
  );
}

export function ManageBookingPage() {
  const { token = '' } = useParams();
  const [date, setDate] = useState(localIsoDate(1));
  const [selectedSlot, setSelectedSlot] = useState<Slot>();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const query = useQuery({
    queryKey: ['manage-booking', token],
    enabled: Boolean(token),
    queryFn: () => api<{ booking: ManagedBooking }>(`/public/bookings/manage/${token}`),
  });
  const booking = query.data?.booking;
  const availability = useQuery({
    queryKey: [
      'managed-availability',
      booking?.business.slug,
      booking?.service.id,
      booking?.staff.id,
      date,
    ],
    enabled: Boolean(booking && date),
    queryFn: () =>
      api<{ slots: Slot[] }>(
        `/public/businesses/${booking!.business.slug}/availability?serviceId=${booking!.service.id}&staffId=${booking!.staff.id}&date=${date}`,
      ),
  });
  const cancel = useMutation({
    mutationFn: () =>
      api<{ booking: ManagedBooking }>(`/public/bookings/manage/${token}/cancel`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => query.refetch(),
  });
  const reschedule = useMutation({
    mutationFn: () =>
      api<{ booking: ManagedBooking }>(`/public/bookings/manage/${token}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ startAt: selectedSlot?.startAt }),
      }),
    onSuccess: () => {
      setSelectedSlot(undefined);
      query.refetch();
    },
  });
  const review = useMutation({
    mutationFn: () =>
      api(`/public/bookings/manage/${token}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment: comment || undefined }),
      }),
    onSuccess: () => query.refetch(),
  });
  if (query.isLoading)
    return (
      <main className="grid min-h-screen place-items-center bg-sand">
        <div className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </main>
    );
  if (!booking)
    return (
      <main className="grid min-h-screen place-items-center bg-sand p-4">
        <EmptyState
          title="Rezervimi nuk u gjet"
          detail="Lidhja mund të jetë e vjetruar ose e pasaktë."
          action={
            <Link to="/businesses">
              <Button>Gjej një biznes</Button>
            </Link>
          }
        />
      </main>
    );
  const canChange = ['PENDING', 'CONFIRMED'].includes(booking.status);
  const canReschedule = canChange && booking.kind !== 'ACCOMMODATION';
  const settings = booking.business.settings;
  return (
    <main className="min-h-screen bg-sand">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to={`/book/${booking.business.slug}`}
            className="flex items-center gap-1 text-sm font-semibold text-slate-600"
          >
            <ChevronLeft size={18} /> Faqja e biznesit
          </Link>
          <span className="font-bold">rezervo</span>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="eyebrow">Menaxho rezervimin</p>
        <h1 className="display mt-1 text-3xl font-bold">Përshëndetje, {booking.customer.name}</h1>
        <p className="mt-2 text-slate-600">
          Këtu mund të shihni, ndryshoni ose anuloni rezervimin tuaj në mënyrë të sigurt.
        </p>
        <section className="surface mt-7 overflow-hidden">
          <div className="flex flex-col gap-3 bg-green-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-forest">{booking.business.name}</p>
              <p className="mt-1 text-sm text-green-900">
                Referenca: <span className="font-mono font-bold">{booking.reference}</span>
              </p>
            </div>
            <Status status={booking.status} />
          </div>
          <div className="grid gap-4 p-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-slate-500">Oferta</p>
              <b className="block">{booking.service.name}</b>
            </div>
            <div>
              <p className="text-slate-500">Ofruesi / burimi</p>
              <b className="block">{booking.staff.name}</b>
              <small className="text-slate-500">{booking.staff.position}</small>
            </div>
            <div>
              <p className="text-slate-500">Data dhe ora</p>
              <b className="block">{dateTime(booking.startAt)}</b>
            </div>
            <div>
              <p className="text-slate-500">Totali</p>
              <b className="block">{money(booking.price, booking.currency)}</b>
            </div>
          </div>
          <div className="border-t border-line bg-sand p-4 text-sm text-slate-600">
            <span className="flex gap-2">
              <MapPin size={17} className="shrink-0 text-forest" />
              {booking.business.address
                ? `${booking.business.address}, ${booking.business.city}`
                : booking.business.city}
            </span>
            {booking.business.phone && (
              <span className="mt-2 flex gap-2">
                <Phone size={17} className="shrink-0 text-forest" />
                {booking.business.phone}
              </span>
            )}
          </div>
        </section>
        {canChange && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="surface p-5">
              <div className="flex gap-3">
                <CalendarClock className="shrink-0 text-forest" size={22} />
                <div>
                  <h2 className="font-bold">Ndrysho kohën</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Zgjidhni një orar tjetër të lirë. Ndryshimi respekton politikën e biznesit.
                  </p>
                </div>
              </div>
              {settings?.reschedulingEnabled ? (
                <>
                  <label className="mt-5 block">
                    <span className="mb-1.5 block text-sm font-medium">Data e re</span>
                    <input
                      className="input"
                      type="date"
                      value={date}
                      min={localIsoDate(0)}
                      onChange={(event) => {
                        setDate(event.target.value);
                        setSelectedSlot(undefined);
                      }}
                    />
                  </label>
                  {availability.isLoading && (
                    <div className="mt-4 h-12 animate-pulse rounded-xl bg-sand" />
                  )}
                  {availability.data && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {availability.data.slots.map((slot) => (
                        <button
                          key={slot.startAt}
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-xl border py-2 text-sm font-semibold ${selectedSlot?.startAt === slot.startAt ? 'border-forest bg-green-50 text-forest' : 'border-line hover:border-forest'}`}
                        >
                          {new Intl.DateTimeFormat('sq-XK', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Europe/Belgrade',
                          }).format(new Date(slot.startAt))}
                        </button>
                      ))}
                    </div>
                  )}
                  {availability.data?.slots.length === 0 && (
                    <p className="mt-4 rounded-xl bg-sand p-3 text-sm text-slate-600">
                      Nuk ka orare të lira në këtë datë.
                    </p>
                  )}
                  <ErrorText error={reschedule.error} />
                  <Button
                    className="mt-5 w-full"
                    disabled={!selectedSlot || reschedule.isPending}
                    onClick={() => reschedule.mutate()}
                  >
                    {reschedule.isPending ? 'Duke ndryshuar...' : 'Ruaj kohën e re'}
                  </Button>
                </>
              ) : (
                <p className="mt-5 rounded-xl bg-sand p-3 text-sm text-slate-600">
                  Ky biznes nuk lejon ndryshim online të terminit. Kontaktoni biznesin për ndihmë.
                </p>
              )}
            </div>
            <div className="surface p-5">
              <div className="flex gap-3">
                <XCircle className="shrink-0 text-red-600" size={22} />
                <div>
                  <h2 className="font-bold">Anulo rezervimin</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Anulimi lejohet deri {settings?.cancellationDeadlineMin ?? 120} minuta para
                    terminit.
                  </p>
                </div>
              </div>
              <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                Nëse e anuloni, ora lirohet për klientët e tjerë. Këtë veprim nuk mund ta ktheni
                mbrapa nga kjo faqe.
              </p>
              <ErrorText error={cancel.error} />
              <Button
                className="mt-5 w-full"
                variant="secondary"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending ? 'Duke anuluar...' : 'Anulo rezervimin'}
              </Button>
            </div>
          </section>
        )}
        {booking.status === 'COMPLETED' && (
          <section className="surface mt-6 p-5">
            <div className="flex gap-3">
              <Star className="shrink-0 text-amber-500" size={22} />
              <div>
                <h2 className="font-bold">Si ishte përvoja juaj?</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Vlerësimi juaj ndihmon klientët e tjerë të zgjedhin me besim.
                </p>
              </div>
            </div>
            {booking.review ? (
              <div className="mt-5 rounded-xl bg-green-50 p-4">
                <p className="font-bold text-forest">
                  Faleminderit për vlerësimin tuaj: {booking.review.rating}/5
                </p>
                {booking.review.comment && (
                  <p className="mt-2 text-sm text-green-900">{booking.review.comment}</p>
                )}
              </div>
            ) : (
              <>
                <div className="mt-5 flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      aria-label={`${value} yje`}
                      key={value}
                      onClick={() => setRating(value)}
                      className="p-1"
                    >
                      <Star
                        size={27}
                        className={
                          value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  className="input mt-3 min-h-24 py-3"
                  placeholder="Ndani përshtypjen tuaj (opsionale)"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
                <ErrorText error={review.error} />
                <Button
                  className="mt-4"
                  disabled={review.isPending}
                  onClick={() => review.mutate()}
                >
                  {review.isPending ? 'Duke dërguar...' : 'Dërgo vlerësimin'}
                </Button>
              </>
            )}
          </section>
        )}
        <div className="mt-6 flex gap-2 rounded-xl bg-sand p-4 text-xs leading-5 text-slate-600">
          <Clock3 className="shrink-0 text-forest" size={17} />
          Kjo lidhje është private për rezervimin tuaj. Mos e ndani me persona të tjerë.
        </div>
      </div>
    </main>
  );
}
