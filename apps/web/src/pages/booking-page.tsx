import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, ChevronLeft, Clock3, MapPin, Moon, Phone, Star, Sun } from 'lucide-react';
import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { CountryPhoneInput } from '../components/country-phone-input';
import { TurnstileWidget } from '../components/security-widgets';
import { api, ApiError } from '../lib/api';
import { dateTime, localIsoDate, money } from '../lib/utils';

type Staff = {
  id: string;
  name: string;
  position: string | null;
  roomNumber: string | null;
  bedCount: number | null;
  capacity: number;
  photo: string | null;
};
type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: string;
  bookingDetails: {
    departurePoint?: string;
    returnPoint?: string;
    departureTime?: string;
    minParticipants?: number;
    maxParticipants?: number;
    inclusions?: string;
  } | null;
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
    requirePrepayment: boolean;
    depositPercent: number;
    cashPaymentEnabled: boolean;
    bankTransferEnabled: boolean;
  } | null;
};
type Slot = { startAt: string; endAt: string };
type TourDeparture = { id: string; staffId: string; startAt: string; endAt: string; capacity: number; availableSeats: number };
type SignedInUser = { user: { firstName: string; lastName: string; email: string } };
type PayPalButtonApi = { Buttons: (options: Record<string, unknown>) => { render: (target: string) => Promise<void> } };
declare global { interface Window { paypal?: PayPalButtonApi } }
const detailsSchema = z.object({
  name: z.string().trim().min(2, 'Shkruani emrin.'),
  email: z.string().trim().email('Shkruani një email të vlefshëm.'),
  phone: z.string().trim().max(32).refine((value) => !value || value.length >= 6, 'Shkruani numrin e telefonit.'),
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
        className={`grid size-7 place-items-center rounded-xl text-xs font-bold shadow-sm ${done ? 'bg-gradient-to-br from-teal-500 to-indigo-600 text-white' : active ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500' : 'bg-slate-100 text-slate-400'}`}
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
  const [tourDepartureId, setTourDepartureId] = useState<string>();
  const [details, setDetails] = useState({
    name: '',
    email: '',
    phone: '',
    pickupAddress: '',
    destinationAddress: '',
    passengerCount: 1,
    tourParticipants: 1,
    couponCode: '',
    customerNote: '',
    website: '',
  });
  const [verification, setVerification] = useState<{ challengeId: string; channel: 'EMAIL' | 'SMS'; contact: string; verified: boolean }>();
  const [verificationChannel, setVerificationChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [smsUnavailableOpen, setSmsUnavailableOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileAttempt, setTurnstileAttempt] = useState(0);
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
    paymentMethod?: 'CASH' | 'BANK_TRANSFER';
    bankTransfer?: { bankName: string; accountHolder: string; iban: string; instructions?: string | null; qrUrlTemplate?: string | null } | null;
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
  const cashEnabled = business?.settings?.cashPaymentEnabled !== false;
  const bankEnabled = Boolean(business?.settings?.bankTransferEnabled);
  const selectedPaymentMethod = !cashEnabled && bankEnabled ? 'BANK_TRANSFER' : paymentMethod;
  const isHotel = business?.category?.slug === 'hotels';
  const isTour = business?.category?.slug === 'tourism-activities';
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
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: Boolean(serviceId && staffId && date && !isHotel && !isTour),
    queryFn: () =>
      api<{ slots: Slot[] }>(
        `/public/businesses/${slug}/availability?serviceId=${serviceId}&staffId=${staffId}&date=${date}`,
      ),
  });
  const tourDepartures = useQuery({
    queryKey: ['tour-departures', slug, serviceId],
    enabled: Boolean(isTour && serviceId),
    queryFn: () => api<{ departures: TourDeparture[] }>(`/public/businesses/${slug}/tour-departures?serviceId=${serviceId}`),
  });
  const selectedDeparture = tourDepartures.data?.departures.find((departure) => departure.id === tourDepartureId);
  const slotTime = (startAt: string) => new Intl.DateTimeFormat('sq-XK', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Belgrade',
  }).format(new Date(startAt));
  const morningSlots = (availability.data?.slots ?? []).filter((item) => Number(slotTime(item.startAt).slice(0, 2)) < 12);
  const afternoonSlots = (availability.data?.slots ?? []).filter((item) => Number(slotTime(item.startAt).slice(0, 2)) >= 12);
  const hotelSearch = useQuery({
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryKey: [
      'accommodation-search',
      slug,
      serviceId,
      stay.checkInDate,
      stay.checkOutDate,
      stay.guestCount,
    ],
    enabled: Boolean(
      isHotel &&
      serviceId &&
      stay.checkInDate &&
      stay.checkOutDate &&
      stay.checkOutDate > stay.checkInDate &&
      stay.guestCount > 0,
    ),
    queryFn: () =>
      api<{ availableRoomIds: string[]; availableCount: number }>(
        `/public/businesses/${slug}/accommodation-search?serviceId=${serviceId}&checkInDate=${stay.checkInDate}&checkOutDate=${stay.checkOutDate}&guestCount=${stay.guestCount}`,
      ),
  });
  const requestVerification = useMutation({
    mutationFn: () => api<{ challengeId: string }>('/public/booking-verification/request', {
      method: 'POST', body: JSON.stringify({ channel: verificationChannel, contact: verificationChannel === 'EMAIL' ? details.email.trim() : details.phone.trim(), turnstileToken }),
    }),
    onSuccess: (data) => {
      setVerification({ challengeId: data.challengeId, channel: verificationChannel, contact: (verificationChannel === 'EMAIL' ? details.email : details.phone).trim().toLowerCase(), verified: false });
      setVerificationCode('');
    },
    onSettled: () => { setTurnstileToken(''); setTurnstileAttempt((current) => current + 1); },
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
          bookingKind: isHotel ? 'ACCOMMODATION' : isTaxi ? 'TRANSPORT' : isTour ? 'TOUR' : 'APPOINTMENT',
          ...(isHotel
            ? {
                checkInDate: stay.checkInDate,
                checkOutDate: stay.checkOutDate,
                guestCount: stay.guestCount,
              }
            : { startAt: slot?.startAt }),
          ...(isTour ? { guestCount: details.tourParticipants } : {}),
          ...(isTour ? { tourDepartureId } : {}),
          ...(isTaxi
            ? {
                pickupAddress: details.pickupAddress,
                destinationAddress: details.destinationAddress,
                passengerCount: details.passengerCount,
              }
            : {}),
          couponCode: details.couponCode.trim() || undefined,
          paymentMethod: selectedPaymentMethod,
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
      <main className="tech-grid grid min-h-screen place-items-center bg-[#07111f] p-4">
        <section className="surface w-full max-w-lg p-7 text-center sm:p-10">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-forest">
            <CheckCircle2 size={34} />
          </span>
          <p className="eyebrow mt-5">
            {submitted.payment ? 'Pagesa kërkohet' : submitted.paymentMethod === 'BANK_TRANSFER' || business.settings?.requireApproval ? 'Kërkesa u pranua' : 'Rezervimi u konfirmua'}
          </p>
          <h1 className="display mt-2 text-3xl font-bold">
            {submitted.payment
              ? 'Kryeni pagesën e sigurt për ta konfirmuar termin. Pa pagesë, kërkesa mbetet në pritje.'
              : submitted.paymentMethod === 'BANK_TRANSFER'
              ? 'Bëjeni transferin bankar dhe biznesi do ta konfirmojë rezervimin.'
              : business.settings?.requireApproval
              ? 'Biznesi do ta konfirmojë së shpejti.'
              : 'Shihemi së shpejti!'}
          </h1>
          <p className="mt-3 text-slate-600">
            Ruajeni referencën më poshtë.{' '}
            {submitted.payment
              ? `Për të paguar tani: ${money(submitted.payment.amount, submitted.payment.currency)}.`
              : submitted.paymentMethod === 'BANK_TRANSFER'
              ? 'Përdorni të dhënat e bankës më poshtë dhe vendosni referencën e rezervimit në përshkrimin e pagesës.'
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
              {!isHotel && <div className="flex justify-between gap-5">
                <dt className="text-slate-500">Ofruesi / burimi</dt>
                <dd className="font-semibold">{submitted.staff.name}</dd>
              </div>}
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
          {submitted.bankTransfer && (
            <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-left text-sm text-indigo-950">
              <p className="font-bold">Udhëzime për transfer bankar</p>
              <dl className="mt-3 space-y-2">
                <div><dt className="text-indigo-700">Banka</dt><dd className="font-semibold">{submitted.bankTransfer.bankName}</dd></div>
                <div><dt className="text-indigo-700">Mbajtësi i llogarisë</dt><dd className="font-semibold">{submitted.bankTransfer.accountHolder}</dd></div>
                <div><dt className="text-indigo-700">IBAN / llogaria</dt><dd className="break-all font-mono font-bold">{submitted.bankTransfer.iban}</dd></div>
                <div><dt className="text-indigo-700">Referenca</dt><dd className="font-mono font-bold">{submitted.reference}</dd></div>
              </dl>
              {submitted.bankTransfer.instructions && <p className="mt-3 border-t border-indigo-200 pt-3 leading-6">{submitted.bankTransfer.instructions}</p>}
              {submitted.bankTransfer.qrUrlTemplate && <BankTransferQr bankTransfer={submitted.bankTransfer} amount={submitted.price} currency={submitted.currency} reference={submitted.reference} businessName={business.name} />}
            </div>
          )}
          {submitted.payment && <PayPalPayment manageToken={submitted.manageToken} amount={submitted.payment.amount} currency={submitted.payment.currency} />}
          <Link to={`/manage/${submitted.manageToken}`} className="mt-5 block">
            <Button className="w-full">Menaxho ose anulo rezervimin</Button>
          </Link>
          {me.data && (
            <Link to="/account" className="mt-3 block">
              <Button variant="secondary" className="w-full">Shiko te rezervimet e mia</Button>
            </Link>
          )}
          <Link to={`/${slug}`} className="mt-3 inline-block">
            <Button variant="secondary">Kthehu te faqja e biznesit</Button>
          </Link>
        </section>
      </main>
    );
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.13),transparent_30rem),radial-gradient(circle_at_90%_10%,rgba(99,102,241,.11),transparent_28rem),#f5f7fb]">
      <header className="border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to="/businesses"
            className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-ink"
          >
            <ChevronLeft size={18} /> Të gjitha bizneset
          </Link>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-ink">
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-teal-600 to-indigo-600 text-xs text-white">R</span>
            rezervo
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_22px_65px_rgba(15,23,42,.12)]">
          <div className="tech-grid h-28 bg-gradient-to-br from-[#0b1d32] via-indigo-950 to-teal-900 sm:h-40">
            {business.coverImage && (
              <img src={business.coverImage} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="relative px-5 pb-5 pt-0 sm:px-8">
            <div className="-mt-7 grid size-14 place-items-center rounded-2xl border-4 border-white bg-gradient-to-br from-teal-500 to-indigo-600 text-xl font-bold text-white shadow-lg">
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
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-[0_18px_55px_rgba(15,23,42,.09)] sm:p-7">
            <div className="mb-7 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/70 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-ink">Rezervo në 4 hapa të thjeshtë</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-forest shadow-sm">Hapi {step} / 4</span>
              </div>
              <div className="flex justify-between">
              <Step number={1} title="Oferta" active={step === 1} done={step > 1} />
              <Step number={2} title="Ofruesi" active={step === 2} done={step > 2} />
              <Step number={3} title="Koha" active={step === 3} done={step > 3} />
              <Step number={4} title="Të dhënat" active={step === 4} done={step > 4} />
              </div>
            </div>
            {!serviceId && (
              <div>
                <h2 className="text-lg font-bold">Zgjidh çfarë dëshiron të rezervosh</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Zgjidhni ofertën, shërbimin ose burimin që ju nevojitet.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {business.services.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setServiceId(item.id);
                        setStaffId(undefined);
                        setTourDepartureId(undefined);
                        setSlot(undefined);
                      }}
                      className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-line bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50/40 hover:shadow-md"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-100 to-indigo-100 text-sm font-extrabold text-indigo-700">{item.name.slice(0, 1)}</span>
                        <span>
                        <b className="block">{item.name}</b>
                        {item.description && (
                          <small className="mt-1 block text-slate-500">{item.description}</small>
                        )}
                        {isTour && item.bookingDetails?.departurePoint && <small className="mt-1 flex items-center gap-1 font-semibold text-amber-800"><MapPin size={13} /> Nisja: {item.bookingDetails.departurePoint}{item.bookingDetails.departureTime ? ` · ${item.bookingDetails.departureTime}` : ''}</small>}
                        </span>
                      </span>
                      <span className="text-right text-sm">
                        <b className="block">{money(item.price, business.currency)}</b>
                        <small className="text-slate-500">
                          {isHotel ? 'për natë' : isTour ? 'për person' : `${item.durationMin} min`}
                        </small>
                        <small className="mt-1 block font-bold text-forest opacity-0 transition group-hover:opacity-100">Zgjidh →</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {serviceId && !staffId && !isHotel && !isTour && (
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
                      className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50/40 hover:shadow-md"
                    >
                      {item.photo ? <img src={item.photo} alt="" className="size-11 rounded-2xl object-cover" /> : <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-100 to-indigo-100 font-bold text-indigo-700">{item.name.slice(0, 1)}</span>}
                      <span>
                        <b className="block">{item.name}</b>
                        <small className="text-slate-500">
                          {item.position ?? 'Ofrues / burim'}
                        </small>
                        {isHotel && <small className="mt-1 block font-semibold text-indigo-700">{item.roomNumber ? `Dhoma ${item.roomNumber} · ` : ''}{item.bedCount ?? 1} {item.bedCount === 1 ? 'shtrat' : 'shtretër'} · deri në {item.capacity} mysafirë</small>}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {serviceId && !staffId && isTour && (
              <div>
                <button onClick={() => setServiceId(undefined)} className="text-sm font-semibold text-forest">← Ndrysho turin</button>
                <h2 className="mt-4 text-lg font-bold">Zgjidh nisjen</h2>
                <p className="mt-1 text-sm text-slate-500">Zgjidhni një datë dhe orë reale. Vendet e mbetura përditësohen automatikisht.</p>
                {tourDepartures.isLoading && <div className="mt-5 h-28 animate-pulse rounded-2xl bg-sand" />}
                {tourDepartures.data?.departures.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{tourDepartures.data.departures.map((departure) => <button key={departure.id} type="button" onClick={() => { setTourDepartureId(departure.id); setStaffId(departure.staffId); setSlot({ startAt: departure.startAt, endAt: departure.endAt }); }} className="rounded-2xl border border-line bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50"><b className="block">{dateTime(departure.startAt)}</b><span className="mt-1 block text-sm text-slate-600">{departure.availableSeats} {departure.availableSeats === 1 ? 'vend i lirë' : 'vende të lira'}</span></button>)}</div> : !tourDepartures.isLoading && <p className="mt-5 rounded-2xl bg-sand p-4 text-sm text-slate-600">Ende nuk ka nisje të hapura për këtë tur. Kontaktoni organizatorin ose provoni më vonë.</p>}
              </div>
            )}
            {serviceId && !staffId && isHotel && (
              <div>
                <button
                  onClick={() => setServiceId(undefined)}
                  className="text-sm font-semibold text-forest"
                >
                  ← Ndrysho llojin e dhomës
                </button>
                <h2 className="mt-4 text-lg font-bold">Kontrollo disponueshmërinë</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Zgjidhni datat dhe mysafirët. Hoteli cakton automatikisht një dhomë të lirë të këtij lloji.
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
                {hotelSearch.isLoading && (
                  <p className="mt-3 text-sm text-slate-500">
                    Po kontrollojmë disponueshmërinë e dhomës…
                  </p>
                )}
                {hotelSearch.data && hotelSearch.data.availableCount === 0 && (
                  <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    Nuk ka dhoma të lira të këtij lloji për këto data. Ndryshoni datat, mysafirët ose zgjidhni një lloj tjetër dhome.
                  </p>
                )}
                {hotelSearch.data && hotelSearch.data.availableCount > 0 && (
                  <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-900">
                    {hotelSearch.data.availableCount} {hotelSearch.data.availableCount === 1 ? 'dhomë e lirë' : 'dhoma të lira'} për këtë qëndrim.
                  </p>
                )}
                {hotelSearch.isError && (
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
                    hotelSearch.isLoading ||
                    !hotelSearch.data ||
                    hotelSearch.data?.availableCount === 0
                  }
                  onClick={() => {
                    const roomId = hotelSearch.data?.availableRoomIds[0];
                    if (!roomId) return;
                    setStaffId(roomId);
                    setSlot({
                      startAt: new Date(`${stay.checkInDate}T12:00:00.000Z`).toISOString(),
                      endAt: new Date(`${stay.checkOutDate}T12:00:00.000Z`).toISOString(),
                    });
                  }}
                >
                  Vazhdo me të dhënat
                </Button>
              </div>
            )}
            {staffId && !slot && !isHotel && !isTour && (
              <div>
                <button
                  onClick={() => setStaffId(undefined)}
                  className="text-sm font-semibold text-forest"
                >
                  ← Ndrysho ofruesin
                </button>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="eyebrow">Hapi 3 nga 4</p>
                    <h2 className="mt-1 text-xl font-bold">Zgjidh termin</h2>
                    <p className="mt-1 text-sm text-slate-500">Zgjidh një datë, pastaj kohën që të përshtatet.</p>
                  </div>
                  <label className="relative block sm:w-52">
                    <span className="sr-only">Data e rezervimit</span>
                    <CalendarDays className="pointer-events-none absolute left-3 top-3 text-forest" size={18} />
                    <input
                      className="input pl-10 font-semibold"
                      type="date"
                      value={date}
                      min={localIsoDate(0)}
                      max={localIsoDate(business.settings?.maxBookingDays ?? 30)}
                      onChange={(event) => { setDate(event.target.value); setSlot(undefined); }}
                    />
                  </label>
                </div>
                <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                  {[0, 1, 2, 3, 4].map((offset) => {
                    const option = localIsoDate(offset);
                    const label = new Intl.DateTimeFormat('sq-XK', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${option}T12:00:00`));
                    return <button key={option} type="button" onClick={() => { setDate(option); setSlot(undefined); }} className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold transition ${date === option ? 'border-forest bg-forest text-white shadow-md' : 'border-line bg-white text-slate-600 hover:border-forest/50 hover:bg-green-50'}`}>{offset === 0 ? 'Sot' : offset === 1 ? 'Nesër' : label}</button>;
                  })}
                </div>
                {availability.isLoading && (
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 8 }, (_, index) => (
                      <span className="h-10 animate-pulse rounded-xl bg-sand" key={index} />
                    ))}
                  </div>
                )}
                {availability.data && (
                  <div className="mt-6 space-y-5">
                    {[
                      { label: 'Paradite', icon: Sun, items: morningSlots },
                      { label: 'Pasdite', icon: Moon, items: afternoonSlots },
                    ].map(({ label, icon: Icon, items }) => items.length > 0 && (
                      <section key={label}>
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><Icon size={16} className="text-amber-500" /> {label} <span className="font-normal text-slate-400">· {items.length} termine të lira</span></div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {items.map((item) => <button key={item.startAt} onClick={() => setSlot(item)} className="group relative rounded-xl border border-line bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-forest hover:bg-green-50 hover:text-forest hover:shadow-md"><Clock3 className="mr-1 inline text-slate-400 group-hover:text-forest" size={14} />{slotTime(item.startAt)}</button>)}
                        </div>
                      </section>
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
                <h2 className="mt-4 text-xl font-bold">Pothuajse gati</h2>
              <p className="mt-1 text-sm text-slate-500">
                Shkruani emailin për konfirmim. Telefoni është opsional.
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
                  {isTour && (
                    <label>
                      <span className="mb-1.5 block text-sm font-medium">Numri i pjesëmarrësve</span>
                      <input className="input" type="number" min={service?.bookingDetails?.minParticipants ?? 1} max={selectedDeparture?.availableSeats ?? 1} value={details.tourParticipants} onChange={(event) => setDetails({ ...details, tourParticipants: Number(event.target.value) })} />
                      <small className="mt-1.5 block text-slate-500">Çmimi llogaritet për person.</small>
                    </label>
                  )}
                  {!isTaxi && !isTour && (
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
                    <span className="mb-1.5 block text-sm font-medium">Telefoni <small className="text-slate-400">(opsional)</small></span>
                    <CountryPhoneInput
                      value={details.phone}
                      onChange={(phone) => {
                        setDetails({ ...details, phone });
                        if (verification?.channel === 'SMS' && verification.contact !== phone.trim().toLowerCase()) setVerification(undefined);
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
                    <div className="mt-3"><TurnstileWidget key={turnstileAttempt} onToken={setTurnstileToken} /></div>
                    <div className="mt-3 flex gap-2 text-sm">
                      <button type="button" onClick={() => { setVerificationChannel('EMAIL'); setVerification(undefined); }} className={`rounded-lg px-3 py-2 font-semibold ${verificationChannel === 'EMAIL' ? 'bg-forest text-white' : 'bg-white text-slate-600 ring-1 ring-line'}`}>Me email</button>
                      <button
                        type="button"
                        onClick={() => setSmsUnavailableOpen(true)}
                        className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-600 ring-1 ring-line hover:bg-slate-50"
                      >
                        Me SMS
                      </button>
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
                          disabled={(verificationChannel === 'EMAIL' ? !detailsSchema.shape.email.safeParse(details.email.trim()).success : !detailsSchema.shape.phone.safeParse(details.phone.trim()).success) || (Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY) && !turnstileToken) || requestVerification.isPending}
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
                  {business.settings?.requirePrepayment && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                      <b className="block">Kërkohet parapagim me PayPal</b>
                      <span className="mt-1 block">
                        Pas dërgimit të rezervimit do të paguani {business.settings.depositPercent}% të shumës. Termini konfirmohet vetëm pasi pagesa të përfundojë.
                      </span>
                    </div>
                  )}
                  {!business.settings?.requirePrepayment && (cashEnabled || bankEnabled) && (
                    <fieldset className="rounded-2xl border border-line bg-slate-50 p-4">
                      <legend className="px-1 text-sm font-bold text-ink">Mënyra e pagesës</legend>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {cashEnabled && (
                          <label className={`cursor-pointer rounded-xl border p-3 transition ${selectedPaymentMethod === 'CASH' ? 'border-forest bg-green-50' : 'border-line bg-white'}`}>
                            <input className="sr-only" type="radio" name="paymentMethod" checked={selectedPaymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} />
                            <b className="block text-sm">Cash në biznes</b><small className="mt-1 block text-slate-500">Paguani kur të arrini për termin.</small>
                          </label>
                        )}
                        {bankEnabled && (
                          <label className={`cursor-pointer rounded-xl border p-3 transition ${selectedPaymentMethod === 'BANK_TRANSFER' ? 'border-indigo-500 bg-indigo-50' : 'border-line bg-white'}`}>
                            <input className="sr-only" type="radio" name="paymentMethod" checked={selectedPaymentMethod === 'BANK_TRANSFER'} onChange={() => setPaymentMethod('BANK_TRANSFER')} />
                            <b className="block text-sm">Transfer bankar</b><small className="mt-1 block text-slate-500">Detajet e bankës shfaqen pas rezervimit.</small>
                          </label>
                        )}
                      </div>
                    </fieldset>
                  )}
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
                      alert('Verifikoni emailin me kodin 6-shifror para rezervimit.');
                      return;
                    }
                    booking.mutate();
                  }}
                >
                  {booking.isPending
                    ? 'Duke konfirmuar...'
                    : !verification?.verified
                      ? 'Verifiko kontaktin për të vazhduar'
                    : business.settings?.requirePrepayment
                      ? 'Vazhdo te pagesa PayPal'
                    : business.settings?.requireApproval
                      ? 'Dërgo kërkesën për rezervim'
                      : selectedPaymentMethod === 'BANK_TRANSFER'
                        ? 'Dërgo kërkesën dhe shiko bankën'
                      : 'Konfirmo rezervimin'}
                </Button>
              </div>
            )}
          </section>
          <aside className="h-fit overflow-hidden rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.10)] lg:sticky lg:top-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Përmbledhja</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-forest"><CheckCircle2 size={13} /> E sigurt</span>
            </div>
            {service ? (
              <div className="mt-4 space-y-3 text-sm">
                <div className="border-b border-line pb-3">
                  <b className="block">{service.name}</b>
                  <span className="text-slate-500">
                    {isHotel
                      ? `për natë · ${money(service.price, business.currency)}`
                      : isTour
                        ? `${service.durationMin} minuta · ${money(service.price, business.currency)} për person`
                        : `${service.durationMin} minuta · ${money(service.price, business.currency)}`}
                  </span>
                </div>
                {staffId && !isHotel && (
                  <div>
                    <span className="text-slate-500">Ofruesi / burimi</span>
                    <b className="block">
                      {eligibleStaff.find((item) => item.id === staffId)?.name}
                    </b>
                  </div>
                )}
                {staffId && isHotel && <div><span className="text-slate-500">Disponueshmëria</span><b className="block">Lloji i dhomës është i konfirmuar</b></div>}
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
                <div className="flex justify-between rounded-xl bg-gradient-to-r from-teal-50 to-indigo-50 px-3 py-3">
                  <span className="text-slate-500">Totali</span>
                  <b className="text-ink">
                    {money(
                      isHotel ? Number(service.price) * nights : isTour ? Number(service.price) * details.tourParticipants : service.price,
                      business.currency,
                    )}
                  </b>
                </div>
                {business.settings?.requirePrepayment && (
                  <div className="rounded-xl bg-amber-50 p-3 text-amber-950">
                    <div className="flex justify-between gap-3">
                      <span>Parapagimi me PayPal ({business.settings.depositPercent}%)</span>
                      <b>
                        {money(
                          (isHotel ? Number(service.price) * nights : isTour ? Number(service.price) * details.tourParticipants : Number(service.price)) *
                            business.settings.depositPercent /
                            100,
                          business.currency,
                        )}
                      </b>
                    </div>
                    <p className="mt-2 text-xs">Verifikoni kontaktin dhe shtypni “Vazhdo te pagesa PayPal”. Butoni i sigurt PayPal hapet në hapin tjetër.</p>
                  </div>
                )}
                {!business.settings?.requirePrepayment && service && (cashEnabled || bankEnabled) && (
                  <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
                    <b className="block">{selectedPaymentMethod === 'BANK_TRANSFER' ? 'Transfer bankar' : 'Cash në biznes'}</b>
                    <p className="mt-1 text-xs">{selectedPaymentMethod === 'BANK_TRANSFER' ? 'Detajet e bankës së biznesit dalin pas krijimit të rezervimit.' : 'Pagesa bëhet kur të arrini për termin.'}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Zgjidhni ofertën për të parë përmbledhjen.
              </p>
            )}
            <div className="mt-5 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
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
                {business.settings?.requirePrepayment
                  ? 'Rezervimi konfirmohet vetëm pasi parapagimi me PayPal të kryhet me sukses.'
                  : business.settings?.requireApproval
                  ? 'Rezervimi konfirmohet pas miratimit nga biznesi.'
                  : 'Rezervimi konfirmohet menjëherë pasi ta dërgoni.'}
              </p>
            </div>
            <p className="mt-4 text-center text-xs leading-5 text-slate-400">Pa telefonata. Konfirmimi ju dërgohet në email.</p>
          </aside>
        </div>
      </div>
      {smsUnavailableOpen && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sms-unavailable-title"
        >
          <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <p className="eyebrow">Verifikimi me SMS</p>
            <h2 id="sms-unavailable-title" className="mt-2 text-xl font-bold text-ink">
              SMS është përkohësisht jashtë funksionit
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ju lutem përdorni emailin për të marrë kodin 6-shifror dhe për të konfirmuar rezervimin.
            </p>
            <Button className="mt-6 w-full" type="button" onClick={() => setSmsUnavailableOpen(false)}>
              Vazhdo me email
            </Button>
          </section>
        </div>
      )}
    </main>
  );
}

type BankTransferDetails = {
  bankName: string;
  accountHolder: string;
  iban: string;
  instructions?: string | null;
  qrUrlTemplate?: string | null;
};

function BankTransferQr({
  bankTransfer,
  amount,
  currency,
  reference,
  businessName,
}: {
  bankTransfer: BankTransferDetails;
  amount: string;
  currency: string;
  reference: string;
  businessName: string;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const template = bankTransfer.qrUrlTemplate;
    if (!template) return;
    const values: Record<string, string> = {
      amount: Number(amount).toFixed(2),
      iban: bankTransfer.iban,
      reference,
      name: bankTransfer.accountHolder,
      business: businessName,
      currency,
    };
    const paymentUrl = template.replace(/\{(amount|iban|reference|name|business|currency)\}/g, (_match, key: string) => encodeURIComponent(values[key] ?? ''));
    try {
      const url = new URL(paymentUrl);
      if (url.protocol !== 'https:') throw new Error('URL jo e sigurt');
      void QRCode.toDataURL(url.toString(), { width: 220, margin: 1, errorCorrectionLevel: 'M' })
        .then(setImage)
        .catch(() => setUnavailable(true));
    } catch {
      setUnavailable(true);
    }
  }, [amount, bankTransfer, businessName, currency, reference]);

  if (unavailable) return null;
  return (
    <div className="mt-4 border-t border-indigo-200 pt-4 text-center">
      <p className="font-semibold">Paguaj me QR bankar</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-indigo-800">Skanoje me aplikacionin e bankës. Kontrollo gjithmonë përfituesin dhe shumën para konfirmimit.</p>
      {image ? <img className="mx-auto mt-3 size-44 rounded-xl bg-white p-2" src={image} alt="QR për transfer bankar" /> : <div className="mx-auto mt-3 size-44 animate-pulse rounded-xl bg-white" />}
    </div>
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
