import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft, Clock3, MapPin, Phone, Star } from 'lucide-react';
import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { api, ApiError } from '../lib/api';
import { dateTime, localIsoDate, money } from '../lib/utils';

type Staff = {
  id: string;
  name: string;
  position: string | null;
  capacity: number;
  photo: string | null;
};
type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: string;
  staff: Array<{ staff: Staff }>;
};
type PublicBusiness = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  coverImage: string | null;
  logo: string | null;
  currency: string;
  category: { name: string; slug: string } | null;
  services: Service[];
  staff: Staff[];
  reviews: Array<{ rating: number; comment: string | null; createdAt: string }>;
  settings: {
    primaryColor: string;
    requireApproval: boolean;
    allowGuestBooking: boolean;
    minNoticeMinutes: number;
    maxBookingDays: number;
    cancellationDeadlineMin: number;
    reschedulingEnabled: boolean;
  } | null;
};
type Slot = { startAt: string; endAt: string };
type SignedInUser = { user: { firstName: string; lastName: string; email: string } };
type PayPalButtonApi = { Buttons: (options: Record<string, unknown>) => { render: (target: string) => Promise<void> } };
declare global { interface Window { paypal?: PayPalButtonApi } }
const detailsSchema = z.object({
  name: z.string().trim().min(2, 'Shkruani emrin.'),
  email: z.string().trim().email('Shkruani një email të vlefshëm.'),
  phone: z.string().trim().min(6, 'Shkruani numrin e telefonit.'),
});

function Step({
  number,
  title,
  active,
  done,
}: {
  number: number;
  title: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`grid size-6 place-items-center rounded-full text-xs font-bold ${done ? 'bg-forest text-white' : active ? 'bg-green-100 text-forest ring-2 ring-forest' : 'bg-slate-100 text-slate-400'}`}
      >
        {done ? '✓' : number}
      </span>
      <span
        className={`hidden text-xs font-semibold sm:block ${active ? 'text-ink' : 'text-slate-400'}`}
      >
        {title}
      </span>
    </div>
  );
}
class BookingErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-ink">Nuk mund ta hapim këtë hap të rezervimit</h1>
          <p className="mt-3 text-slate-600">Provo përsëri ose kthehu te zgjedhja e shërbimit.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
              Ngarko përsëri
            </Button>
            <Button type="button" onClick={() => window.history.back()}>
              Kthehu mbrapa
            </Button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export function BookingPage() {
  return (
    <BookingErrorBoundary>
      <BookingFlow />
    </BookingErrorBoundary>
  );
}

function BookingFlow() {
  const { slug = '' } = useParams();
  const [serviceId, setServiceId] = useState<string>();
  const [staffId, setStaffId] = useState<string>();
  const [date, setDate] = useState(localIsoDate(1));
  const [slot, setSlot] = useState<Slot>();
  const [details, setDetails] = useState({
    name: '',
    email: '',
    phone: '',
    pickupAddress: '',
    destinationAddress: '',
    passengerCount: 1,
    couponCode: '',
    customerNote: '',
    website: '',
  });
  const [verification, setVerification] = useState<{ challengeId: string; channel: 'EMAIL' | 'SMS'; contact: string; verified: boolean }>();
  const [verificationChannel, setVerificationChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [verificationCode, setVerificationCode] = useState('');
  const [stay, setStay] = useState({
    checkInDate: localIsoDate(1),
    checkOutDate: localIsoDate(2),
    guestCount: 1,
  });
  const [submitted, setSubmitted] = useState<{
    reference: string;
    manageToken: string;
    startAt: string;
    price: string;
    currency: string;
    service: Service;
    staff: Staff;
    business: PublicBusiness;
    payment?: { amount: string; currency: string; status: string } | null;
  }>();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<SignedInUser>('/auth/me'),
    retry: false,
    staleTime: 30_000,
  });
  useEffect(() => {
    if (!me.data?.user) return;
    setDetails((current) => ({
      ...current,
      name: current.name || `${me.data.user.firstName} ${me.data.user.lastName}`.trim(),
      email: current.email || me.data.user.email,
    }));
  }, [me.data]);
  const businessQuery = useQuery({
    queryKey: ['public-business', slug],
    queryFn: () => api<{ business: PublicBusiness }>(`/public/businesses/${slug}`),
  });
  const business = businessQuery.data?.business;
  const mapLink = business
    ? business.latitude && business.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.address ?? ''}, ${business.city}`)}`
    : '';
  const service = business?.services.find((item) => item.id === serviceId);
  const isHotel = business?.category?.slug === 'hotels';
  const isTaxi = business?.category?.slug === 'taxi-transport';
  const requestLabel =
    business?.category?.slug === 'restaurants'
      ? 'Kërkesë për tavolinën'
      : business?.category?.slug === 'car-service'
        ? 'Automjeti (marka, modeli ose targa)'
        : business?.category?.slug === 'events-venues'
          ? 'Detajet e eventit'
          : business?.category?.slug === 'home-services'
            ? 'Adresa ose detaje për vizitën'
            : business?.category?.slug === 'rentals'
              ? 'Detaje për qiranë'
              : 'Shënim për rezervimin';
  const requestPlaceholder =
    business?.category?.slug === 'restaurants'
      ? 'p.sh. 4 persona, tavolinë pranë dritares'
      : business?.category?.slug === 'car-service'
        ? 'p.sh. VW Golf 7, 2017, 01-123-AB'
        : business?.category?.slug === 'events-venues'
          ? 'p.sh. Ditëlindje, rreth 40 mysafirë'
          : business?.category?.slug === 'home-services'
            ? 'p.sh. Rr. Dëshmorët, nr. 12, kati 3'
            : 'Opsionale — tregoni çfarë ju nevojitet.';
  const nights = Math.max(
    1,
    Math.round(
      (new Date(`${stay.checkOutDate}T00:00:00Z`).getTime() -
        new Date(`${stay.checkInDate}T00:00:00Z`).getTime()) /
        86_400_000,
    ),
  );
  const eligibleStaff = useMemo(() => service?.staff.map((item) => item.staff) ?? [], [service]);
  const availability = useQuery({
    queryKey: ['availability', slug, serviceId, staffId, date],
    enabled: Boolean(serviceId && staffId && date && !isHotel),
    queryFn: () =>
      api<{ slots: Slot[] }>(
        `/public/businesses/${slug}/availability?serviceId=${serviceId}&staffId=${staffId}&date=${date}`,
      ),
  });
  const hotelAvailability = useQuery({
    queryKey: [
      'accommodation-availability',
      slug,
      serviceId,
      staffId,
      stay.checkInDate,
      stay.checkOutDate,
      stay.guestCount,
    ],
    enabled: Boolean(
      isHotel &&
      serviceId &&
      staffId &&
      stay.checkInDate &&
      stay.checkOutDate &&
      stay.checkOutDate > stay.checkInDate &&
      stay.guestCount > 0,
    ),
    queryFn: () =>
      api<{ available: boolean }>(
        `/public/businesses/${slug}/accommodation-availability?serviceId=${serviceId}&staffId=${staffId}&checkInDate=${stay.checkInDate}&checkOutDate=${stay.checkOutDate}&guestCount=${stay.guestCount}`,
      ),
  });
  const requestVerification = useMutation({
    mutationFn: () => api<{ challengeId: string }>('/public/booking-verification/request', {
      method: 'POST', body: JSON.stringify({ channel: verificationChannel, contact: verificationChannel === 'EMAIL' ? details.email.trim() : details.phone.trim() }),
    }),
    onSuccess: (data) => {
      setVerification({ challengeId: data.challengeId, channel: verificationChannel, contact: (verificationChannel === 'EMAIL' ? details.email : details.phone).trim().toLowerCase(), verified: false });
      setVerificationCode('');
    },
  });
  const confirmVerification = useMutation({
    mutationFn: () => api('/public/booking-verification/confirm', {
      method: 'POST', body: JSON.stringify({ challengeId: verification?.challengeId, code: verificationCode }),
    }),
    onSuccess: () => verification && setVerification({ ...verification, verified: true }),
  });
  const booking = useMutation({
    mutationFn: () =>
      api<{
        booking: {
          reference: string;
          manageToken: string;
          startAt: string;
          price: string;
          currency: string;
          service: Service;
          staff: Staff;
          business: PublicBusiness;
        };
      }>(`/public/businesses/${slug}/bookings`, {
        method: 'POST',
        body: JSON.stringify({
          serviceId,
          staffId,
          bookingKind: isHotel ? 'ACCOMMODATION' : isTaxi ? 'TRANSPORT' : 'APPOINTMENT',
          ...(isHotel
            ? {
                checkInDate: stay.checkInDate,
                checkOutDate: stay.checkOutDate,
                guestCount: stay.guestCount,
              }
            : { startAt: slot?.startAt }),
          ...(isTaxi
            ? {
                pickupAddress: details.pickupAddress,
                destinationAddress: details.destinationAddress,
                passengerCount: details.passengerCount,
              }
            : {}),
          couponCode: details.couponCode.trim() || undefined,
          customer: { name: details.name, email: details.email || undefined, phone: details.phone },
          customerNote: details.customerNote.trim() || undefined,
          bookingVerificationId: verification?.challengeId,
          website: details.website,
        }),
      }),
    onSuccess: (data) => setSubmitted(data.booking),
    onError: () => setSlot(undefined),
  });
  const step = submitted ? 5 : slot ? 4 : staffId ? 3 : serviceId ? 2 : 1;
  if (businessQuery.isLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-sand">
        <div
          className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent"
          aria-label="Duke u ngarkuar"
        />
      </div>
    );
  if (businessQuery.isError || !business)
    return (
      <main className="grid min-h-screen place-items-center bg-sand p-4">
        <div className="surface max-w-md p-7 text-center">
          <h1 className="display text-2xl font-bold">Biznesi nuk u gjet</h1>
          <p className="mt-2 text-sm text-slate-500">
            Lidhja mund të jetë e vjetruar ose biznesi nuk pranon rezervime tani.
          </p>
          <Link to="/businesses" className="mt-5 inline-block">
            <Button>Shiko bizneset</Button>
          </Link>
        </div>
      </main>
    );
  if (submitted)
    return (
      <main className="grid min-h-screen place-items-center bg-[#e6f3e7] p-4">
        <section className="surface w-full max-w-lg p-7 text-center sm:p-10">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-forest">
            <CheckCircle2 size={34} />
          </span>
          <p className="eyebrow mt-5">
            {submitted.payment ? 'Pagesa kërkohet' : business.settings?.requireApproval ? 'Kërkesa u pranua' : 'Rezervimi u konfirmua'}
          </p>
          <h1 className="display mt-2 text-3xl font-bold">
            {submitted.payment
              ? 'Kryeni pagesën e sigurt për ta konfirmuar termin. Pa pagesë, kërkesa mbetet në pritje.'
              : business.settings?.requireApproval
              ? 'Biznesi do ta konfirmojë së shpejti.'
              : 'Shihemi së shpejti!'}
          </h1>
          <p className="mt-3 text-slate-600">
            Ruajeni referencën më poshtë.{' '}
            {submitted.payment
              ? `Për të paguar tani: ${money(submitted.payment.amount, submitted.payment.currency)}.`
              : business.settings?.requireApproval
              ? 'Do të merrni njoftim pasi biznesi ta miratojë kërkesën.'
              : 'Do të merrni konfirmimin e rezervimit në email ose telefon.'}
          </p>
          <div className="mt-7 rounded-2xl bg-sand p-5 text-left">
            <p className="text-xs font-semibold text-slate-500">REFERENCA</p>
            <p className="mt-1 font-mono text-lg font-bold">{submitted.reference}</p>
            <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-5">
                <dt className="text-slate-500">Oferta</dt>
                <dd className="font-semibold">{submitted.service.name}</dd>
              </div>
              <div className="flex justify-between gap-5">
                <dt className="text-slate-500">Ofruesi / burimi</dt>
                <dd className="font-semibold">{submitted.staff.name}</dd>
              </div>
              <div className="flex justify-between gap-5">
                <dt className="text-slate-500">Data dhe ora</dt>
                <dd className="text-right font-semibold">{dateTime(submitted.startAt)}</dd>
              </div>
              <div className="flex justify-between gap-5">
                <dt className="text-slate-500">Pagesa</dt>
                <dd className="font-semibold">{money(submitted.price, submitted.currency)}</dd>
              </div>
            </dl>
          </div>
          {submitted.payment && <PayPalPayment manageToken={submitted.manageToken} amount={submitted.payment.amount} currency={submitted.payment.currency} />}
          <Link to={`/manage/${submitted.manageToken}`} className="mt-5 block">
            <Button className="w-full">Menaxho ose anulo rezervimin</Button>
          </Link>
          {me.data && (
            <Link to="/account" className="mt-3 block">
              <Button variant="secondary" className="w-full">Shiko te rezervimet e mia</Button>
            </Link>
          )}
          <Link to={`/book/${slug}`} className="mt-3 inline-block">
            <Button variant="secondary">Kthehu te faqja e biznesit</Button>
          </Link>
        </section>
      </main>
    );
  return (
    <main className="min-h-screen bg-sand">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to="/businesses"
            className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-ink"
          >
            <ChevronLeft size={18} /> Të gjitha bizneset
          </Link>
          <span className="text-sm font-bold">rezervo</span>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
        <div className="surface overflow-hidden">
          <div className="h-28 bg-green-100 sm:h-40">
            {business.coverImage && (
              <img src={business.coverImage} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="relative px-5 pb-5 pt-0 sm:px-8">
            <div className="-mt-7 grid size-14 place-items-center rounded-2xl border-4 border-white bg-forest text-xl font-bold text-white shadow-sm">
              {business.name.slice(0, 1)}
            </div>
            <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                {business.slug === 'blend-barber' && <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">BIZNES DEMO · Testoni rezervimin</span>}
                <p className="text-xs font-semibold text-moss">
                  {business.category?.name ?? 'Rezervime online'}
                </p>
                <h1 className="display mt-1 text-2xl font-bold">{business.name}</h1>
                <p className="mt-1 text-sm text-slate-600">{business.description}</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 underline-offset-2 hover:text-forest hover:underline"
                >
                  <MapPin size={14} />
                  {business.address ? `${business.address}, ${business.city}` : business.city}
                </a>
                {business.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={14} />
                    {business.phone}
                  </span>
                )}
                {business.reviews.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    {(
                      business.reviews.reduce((sum, review) => sum + review.rating, 0) /
                      business.reviews.length
                    ).toFixed(1)}{' '}
                    ({business.reviews.length})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          <section className="surface p-5 sm:p-7">
            <div className="mb-7 flex justify-between border-b border-line pb-5">
              <Step number={1} title="Oferta" active={step === 1} done={step > 1} />
              <Step number={2} title="Ofruesi" active={step === 2} done={step > 2} />
              <Step number={3} title="Koha" active={step === 3} done={step > 3} />
              <Step number={4} title="Të dhënat" active={step === 4} done={step > 4} />
            </div>
            {!serviceId && (
              <div>
                <h2 className="text-lg font-bold">Zgjidh çfarë dëshiron të rezervosh</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Zgjidhni ofertën, shërbimin ose burimin që ju nevojitet.
                </p>
                <div className="mt-5 space-y-3">
                  {business.services.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setServiceId(item.id);
                        setStaffId(undefined);
                        setSlot(undefined);
                      }}
                      className="flex w-full items-center justify-between rounded-2xl border border-line p-4 text-left transition hover:border-forest hover:bg-green-50"
                    >
                      <span>
                        <b className="block">{item.name}</b>
                        {item.description && (
                          <small className="mt-1 block text-slate-500">{item.description}</small>
                        )}
                      </span>
                      <span className="text-right text-sm">
                        <b className="block">{money(item.price, business.currency)}</b>
                        <small className="text-slate-500">
                          {isHotel ? 'për natë' : `${item.durationMin} min`}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {serviceId && !staffId && (
              <div>
                <button
                  onClick={() => setServiceId(undefined)}
                  className="text-sm font-semibold text-forest"
                >
                  ← Ndrysho ofertën
                </button>
                <h2 className="mt-4 text-lg font-bold">Zgjidh ofruesin ose burimin</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mund të jetë specialist, dhomë, automjet, tavolinë ose një burim tjetër i
                  biznesit.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {eligibleStaff.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setStaffId(item.id);
                        setSlot(undefined);
                      }}
                      className="flex items-center gap-3 rounded-2xl border border-line p-4 text-left transition hover:border-forest hover:bg-green-50"
                    >
                      <span className="grid size-11 place-items-center rounded-full bg-green-100 font-bold text-forest">
                        {item.name.slice(0, 1)}
                      </span>
                      <span>
                        <b className="block">{item.name}</b>
                        <small className="text-slate-500">
                          {item.position ?? 'Ofrues / burim'}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {staffId && !slot && isHotel && (
              <div>
                <button
                  onClick={() => setStaffId(undefined)}
                  className="text-sm font-semibold text-forest"
                >
                  ← Ndrysho dhomën
                </button>
                <h2 className="mt-4 text-lg font-bold">Zgjidh qëndrimin</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Çmimi llogaritet për natë. Dhoma bllokohet për të gjithë periudhën e qëndrimit.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">Hyrja</span>
                    <input
                      className="input"
                      type="date"
                      min={localIsoDate(1)}
                      value={stay.checkInDate}
                      onChange={(event) => setStay({ ...stay, checkInDate: event.target.value })}
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">Dalja</span>
                    <input
                      className="input"
                      type="date"
                      min={stay.checkInDate}
                      value={stay.checkOutDate}
                      onChange={(event) => setStay({ ...stay, checkOutDate: event.target.value })}
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">Mysafirë</span>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      max={eligibleStaff.find((item) => item.id === staffId)?.capacity ?? 1000}
                      value={stay.guestCount}
                      onChange={(event) =>
                        setStay({ ...stay, guestCount: Number(event.target.value) })
                      }
                    />
                  </label>
                </div>
                <p className="mt-4 rounded-xl bg-sand p-3 text-sm text-slate-600">
                  {nights} {nights === 1 ? 'natë' : 'net'} · Totali i vlerësuar:{' '}
                  {money(Number(service?.price ?? 0) * nights, business.currency)}
                </p>
                {hotelAvailability.isLoading && (
                  <p className="mt-3 text-sm text-slate-500">
                    Po kontrollojmë disponueshmërinë e dhomës…
                  </p>
                )}
                {hotelAvailability.data && !hotelAvailability.data.available && (
                  <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    Kjo dhomë nuk është e lirë për këto data. Ndryshoni datat ose zgjidhni një dhomë
                    tjetër.
                  </p>
                )}
                {hotelAvailability.isError && (
                  <p className="mt-3 text-sm text-red-700">
                    Nuk mund ta kontrollojmë disponueshmërinë tani. Provoni përsëri.
                  </p>
                )}
                <Button
                  className="mt-5"
                  disabled={
                    !stay.checkInDate ||
                    !stay.checkOutDate ||
                    stay.checkOutDate <= stay.checkInDate ||
                    stay.guestCount < 1 ||
                    hotelAvailability.isLoading ||
                    hotelAvailability.data?.available === false
                  }
                  onClick={() =>
                    setSlot({
                      startAt: new Date(`${stay.checkInDate}T12:00:00.000Z`).toISOString(),
                      endAt: new Date(`${stay.checkOutDate}T12:00:00.000Z`).toISOString(),
                    })
                  }
                >
                  Vazhdo me të dhënat
                </Button>
              </div>
            )}
            {staffId && !slot && !isHotel && (
              <div>
                <button
                  onClick={() => setStaffId(undefined)}
                  className="text-sm font-semibold text-forest"
                >
                  ← Ndrysho ofruesin
                </button>
                <h2 className="mt-4 text-lg font-bold">Zgjidh kohën</h2>
                <label className="mt-4 block max-w-xs">
                  <span className="mb-1.5 block text-sm font-medium">Data</span>
                  <input
                    className="input"
                    type="date"
                    value={date}
                    min={localIsoDate(0)}
                    max={localIsoDate(business.settings?.maxBookingDays ?? 30)}
                    onChange={(event) => {
                      setDate(event.target.value);
                      setSlot(undefined);
                    }}
                  />
                </label>
                {availability.isLoading && (
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 8 }, (_, index) => (
                      <span className="h-10 animate-pulse rounded-xl bg-sand" key={index} />
                    ))}
                  </div>
                )}
                {availability.data && (
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availability.data.slots.map((item) => (
                      <button
                        key={item.startAt}
                        onClick={() => setSlot(item)}
                        className="rounded-xl border border-line py-2.5 text-sm font-semibold hover:border-forest hover:bg-green-50"
                      >
                        {new Intl.DateTimeFormat('sq-XK', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Europe/Belgrade',
                        }).format(new Date(item.startAt))}
                      </button>
                    ))}
                  </div>
                )}
                {availability.data?.slots.length === 0 && (
                  <p className="mt-5 rounded-xl bg-sand p-4 text-sm text-slate-600">
                    Nuk ka orare të lira në këtë datë. Provoni një ditë tjetër.
                  </p>
                )}
                {availability.isError && (
                  <p className="mt-5 text-sm text-red-600">
                    Nuk mund t’i ngarkojmë oraret. Provoni përsëri.
                  </p>
                )}
              </div>
            )}
            {slot && (
              <div>
                <button
                  onClick={() => setSlot(undefined)}
                  className="text-sm font-semibold text-forest"
                >
                  ← Ndrysho kohën
                </button>
                <h2 className="mt-4 text-lg font-bold">Të dhënat tuaja</h2>
              <p className="mt-1 text-sm text-slate-500">
                Na duhen vetëm për konfirmimin e rezervimit.
              </p>
              {me.data && (
                <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-900">
                  Jeni i kyçur si <b>{me.data.user.email}</b>. Ky rezervim do të ruhet automatikisht te profili juaj.
                </p>
              )}
                <div className="mt-5 grid gap-4">
                  {isTaxi && (
                    <>
                      <label>
                        <span className="mb-1.5 block text-sm font-medium">Vendi i nisjes</span>
                        <input
                          className="input"
                          placeholder="p.sh. Qendra e Prishtinës"
                          value={details.pickupAddress}
                          onChange={(event) =>
                            setDetails({ ...details, pickupAddress: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        <span className="mb-1.5 block text-sm font-medium">Destinacioni</span>
                        <input
                          className="input"
                          placeholder="p.sh. Aeroporti i Prishtinës"
                          value={details.destinationAddress}
                          onChange={(event) =>
                            setDetails({ ...details, destinationAddress: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        <span className="mb-1.5 block text-sm font-medium">Numri i udhëtarëve</span>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="100"
                          value={details.passengerCount}
                          onChange={(event) =>
                            setDetails({ ...details, passengerCount: Number(event.target.value) })
                          }
                        />
                      </label>
                    </>
                  )}
                  {!isTaxi && (
                    <label>
                      <span className="mb-1.5 block text-sm font-medium">
                        {requestLabel} <small className="text-slate-400">(opsionale)</small>
                      </span>
                      <textarea
                        className="input min-h-24 py-3"
                        maxLength={1000}
                        placeholder={requestPlaceholder}
                        value={details.customerNote}
                        onChange={(event) =>
                          setDetails({ ...details, customerNote: event.target.value })
                        }
                      />
                    </label>
                  )}
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">Emri dhe mbiemri</span>
                    <input
                      className="input"
                      value={details.name}
                      onChange={(event) => setDetails({ ...details, name: event.target.value })}
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">Telefoni</span>
                    <input
                      className="input"
                      inputMode="tel"
                      value={details.phone}
                      onChange={(event) => {
                        setDetails({ ...details, phone: event.target.value });
                        if (verification?.channel === 'SMS' && verification.contact !== event.target.value.trim().toLowerCase()) setVerification(undefined);
                      }}
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Email
                    </span>
                    <input
                      className="input"
                      type="email"
                      required
                      value={details.email}
                      onChange={(event) => {
                        setDetails({ ...details, email: event.target.value });
                        if (verification?.channel === 'EMAIL' && verification.contact !== event.target.value.trim().toLowerCase()) setVerification(undefined);
                      }}
                    />
                  </label>
                  <div className="rounded-xl border border-line bg-sand p-4">
                    <p className="font-semibold">Verifiko kontaktin për rezervim</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Për siguri, kodi 6-shifror është i detyrueshëm para se të dërgoni rezervimin.
                    </p>
                    <div className="mt-3 flex gap-2 text-sm">
                      <button type="button" onClick={() => { setVerificationChannel('EMAIL'); setVerification(undefined); }} className={`rounded-lg px-3 py-2 font-semibold ${verificationChannel === 'EMAIL' ? 'bg-forest text-white' : 'bg-white text-slate-600 ring-1 ring-line'}`}>Me email</button>
                      <button type="button" onClick={() => { setVerificationChannel('SMS'); setVerification(undefined); }} className={`rounded-lg px-3 py-2 font-semibold ${verificationChannel === 'SMS' ? 'bg-forest text-white' : 'bg-white text-slate-600 ring-1 ring-line'}`}>Me SMS</button>
                    </div>
                    {!verification?.verified ? (
                      <>
                        {verification && (
                          <div className="mt-3 flex gap-2">
                            <input className="input" inputMode="numeric" maxLength={6} value={verificationCode}
                              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
                              placeholder="Kodi 6-shifror" />
                            <Button type="button" variant="secondary" disabled={verificationCode.length !== 6 || confirmVerification.isPending}
                              onClick={() => confirmVerification.mutate()}>
                              {confirmVerification.isPending ? 'Po kontrollohet…' : 'Verifiko'}
                            </Button>
                          </div>
                        )}
                        <Button type="button" variant="ghost" className="mt-3"
                          disabled={(verificationChannel === 'EMAIL' ? !detailsSchema.shape.email.safeParse(details.email.trim()).success : !detailsSchema.shape.phone.safeParse(details.phone.trim()).success) || requestVerification.isPending}
                          onClick={() => requestVerification.mutate()}>
                          {requestVerification.isPending ? 'Po dërgohet…' : verification ? 'Dërgo kod të ri' : 'Dërgo kodin'}
                        </Button>
                        {(requestVerification.error || confirmVerification.error) && (
                          <p className="mt-2 text-sm text-red-600">
                            {(requestVerification.error ?? confirmVerification.error) instanceof ApiError
                              ? ((requestVerification.error ?? confirmVerification.error) as ApiError).message
                              : 'Kodi nuk mund të dërgohet ose verifikohet tani.'}
                          </p>
                        )}
                      </>
                    ) : <p className="mt-3 text-sm font-semibold text-forest">✓ {verification?.channel === 'SMS' ? 'Telefoni' : 'Emaili'} u verifikua.</p>}
                  </div>
                  <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" name="website"
                    value={details.website} onChange={(event) => setDetails({ ...details, website: event.target.value })} />
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Kod promocional <small className="text-slate-400">(opsional)</small>
                    </span>
                    <input
                      className="input"
                      value={details.couponCode}
                      onChange={(event) =>
                        setDetails({ ...details, couponCode: event.target.value.toUpperCase() })
                      }
                      placeholder="p.sh. MIRESEVINI10"
                    />
                  </label>
                </div>
                {booking.error && (
                  <p className="mt-4 text-sm text-red-600">
                    {booking.error instanceof ApiError
                      ? booking.error.message
                      : 'Rezervimi nuk u krye. Provoni përsëri.'}
                  </p>
                )}
                <Button
                  className="mt-6 w-full"
                  disabled={booking.isPending}
                  onClick={() => {
                    const parsed = detailsSchema.safeParse(details);
                    if (!parsed.success) {
                      alert(parsed.error.issues[0]?.message);
                      return;
                    }
                    const currentContact = (verificationChannel === 'EMAIL' ? details.email : details.phone).trim().toLowerCase();
                    if (!verification?.verified || verification.channel !== verificationChannel || verification.contact !== currentContact) {
                      alert('Verifikoni emailin ose telefonin me kodin 6-shifror para rezervimit.');
                      return;
                    }
                    booking.mutate();
                  }}
                >
                  {booking.isPending
                    ? 'Duke konfirmuar...'
                    : !verification?.verified
                      ? 'Verifiko kontaktin për të vazhduar'
                    : business.settings?.requireApproval
                      ? 'Dërgo kërkesën për rezervim'
                      : 'Konfirmo rezervimin'}
                </Button>
              </div>
            )}
          </section>
          <aside className="surface h-fit p-5">
            <h2 className="font-bold">Përmbledhja</h2>
            {service ? (
              <div className="mt-4 space-y-3 text-sm">
                <div className="border-b border-line pb-3">
                  <b className="block">{service.name}</b>
                  <span className="text-slate-500">
                    {isHotel
                      ? `për natë · ${money(service.price, business.currency)}`
                      : `${service.durationMin} minuta · ${money(service.price, business.currency)}`}
                  </span>
                </div>
                {staffId && (
                  <div>
                    <span className="text-slate-500">Ofruesi / burimi</span>
                    <b className="block">
                      {eligibleStaff.find((item) => item.id === staffId)?.name}
                    </b>
                  </div>
                )}
                {slot && (
                  <div>
                    <span className="text-slate-500">{isHotel ? 'Qëndrimi' : 'Rezervimi'}</span>
                    <b className="block">
                      {isHotel
                        ? `${stay.checkInDate} → ${stay.checkOutDate}`
                        : dateTime(slot.startAt)}
                    </b>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-3">
                  <span className="text-slate-500">Totali</span>
                  <b>
                    {money(
                      isHotel ? Number(service.price) * nights : service.price,
                      business.currency,
                    )}
                  </b>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Zgjidhni ofertën për të parë përmbledhjen.
              </p>
            )}
            <div className="mt-5 space-y-3 rounded-xl bg-sand p-3 text-xs leading-5 text-slate-600">
              <p className="flex gap-2">
                <Clock3 className="shrink-0 text-forest" size={17} />
                Rezervoni të paktën {business.settings?.minNoticeMinutes ?? 60} minuta përpara.
                Afati maksimal: {business.settings?.maxBookingDays ?? 30} ditë.
              </p>
              <p>
                <b className="text-ink">Anulimi:</b> njoftoni biznesin të paktën{' '}
                {business.settings?.cancellationDeadlineMin ?? 120} minuta përpara.{' '}
                {business.settings?.reschedulingEnabled
                  ? 'Ndryshimi i terminit lejohet sipas kësaj politike.'
                  : 'Ndryshimi i terminit nuk është aktiv për këtë biznes.'}
              </p>
              <p>
                {business.settings?.requireApproval
                  ? 'Rezervimi konfirmohet pas miratimit nga biznesi.'
                  : 'Rezervimi konfirmohet menjëherë pasi ta dërgoni.'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PayPalPayment({ manageToken, amount, currency }: { manageToken: string; amount: string; currency: string }) {
  const [error, setError] = useState<string>();
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const mount = async () => {
      try {
        const config = await api<{ enabled: boolean; clientId?: string }>('/public/payments/paypal/config');
        if (!config.enabled || !config.clientId) throw new Error('PayPal nuk është konfiguruar ende nga platforma.');
        const clientId = config.clientId;
        const existing = document.querySelector('script[data-rezervo-paypal]');
        if (!existing) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.dataset.rezervoPaypal = 'true';
            script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture`;
            script.onload = () => resolve(); script.onerror = () => reject(new Error('PayPal nuk u ngarkua.'));
            document.head.appendChild(script);
          });
        }
        if (cancelled || !window.paypal) return;
        await window.paypal.Buttons({
          createOrder: async () => (await api<{ orderId: string }>('/public/payments/paypal/order', {
            method: 'POST', body: JSON.stringify({ manageToken }),
          })).orderId,
          onApprove: async (data: { orderID: string }) => {
            await api('/public/payments/paypal/capture', { method: 'POST', body: JSON.stringify({ manageToken, orderId: data.orderID }) });
            if (!cancelled) setPaid(true);
          },
          onError: () => !cancelled && setError('Pagesa nuk u krye. Provoni përsëri.'),
        }).render('#rezervo-paypal-button');
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'PayPal nuk mund të hapet tani.');
      }
    };
    void mount();
    return () => { cancelled = true; };
  }, [currency, manageToken]);
  if (paid) return <p className="mt-5 rounded-xl bg-green-100 p-4 font-semibold text-forest">✓ Pagesa u pranua. Rezervimi u konfirmua.</p>;
  return <section className="mt-5 text-left"><p className="mb-2 text-sm font-semibold">Paguaj {money(amount, currency)} me PayPal</p><div id="rezervo-paypal-button" />{error && <p className="mt-2 text-sm text-red-600">{error}</p>}</section>;
}
