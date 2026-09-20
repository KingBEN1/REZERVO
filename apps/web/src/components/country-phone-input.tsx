import { useState } from 'react';

type Country = { name: string; dial: string };

// Kosovo and Albania intentionally lead the list. The remainder covers every
// internationally assigned country calling code used by the application.
const countries: Country[] = [
  { name: 'Kosovë', dial: '+383' }, { name: 'Shqipëri', dial: '+355' },
  { name: 'Afganistan', dial: '+93' }, { name: 'Afrika e Jugut', dial: '+27' }, { name: 'Algjeri', dial: '+213' }, { name: 'Andorrë', dial: '+376' }, { name: 'Angola', dial: '+244' }, { name: 'Antigua dhe Barbuda', dial: '+1-268' }, { name: 'Arabia Saudite', dial: '+966' }, { name: 'Argjentinë', dial: '+54' }, { name: 'Armeni', dial: '+374' }, { name: 'Australi', dial: '+61' }, { name: 'Austri', dial: '+43' }, { name: 'Azerbajxhan', dial: '+994' },
  { name: 'Bahame', dial: '+1-242' }, { name: 'Bahrein', dial: '+973' }, { name: 'Bangladesh', dial: '+880' }, { name: 'Barbados', dial: '+1-246' }, { name: 'Belgjikë', dial: '+32' }, { name: 'Belize', dial: '+501' }, { name: 'Benin', dial: '+229' }, { name: 'Bjellorusi', dial: '+375' }, { name: 'Bolivi', dial: '+591' }, { name: 'Bosnje dhe Hercegovinë', dial: '+387' }, { name: 'Botsvana', dial: '+267' }, { name: 'Brazil', dial: '+55' }, { name: 'Brunei', dial: '+673' }, { name: 'Bullgari', dial: '+359' }, { name: 'Burkina Faso', dial: '+226' }, { name: 'Burundi', dial: '+257' }, { name: 'Butan', dial: '+975' },
  { name: 'Bregu i Fildishtë', dial: '+225' }, { name: 'Cape Verde', dial: '+238' }, { name: 'Kamboxhia', dial: '+855' }, { name: 'Kamerun', dial: '+237' }, { name: 'Kanada / SHBA', dial: '+1' }, { name: 'Katar', dial: '+974' }, { name: 'Kazakistan', dial: '+7' }, { name: 'Kenia', dial: '+254' }, { name: 'Kili', dial: '+56' }, { name: 'Kinë', dial: '+86' }, { name: 'Qipro', dial: '+357' }, { name: 'Kolumbi', dial: '+57' }, { name: 'Komore', dial: '+269' }, { name: 'Kongo', dial: '+242' }, { name: 'Kongo (DR)', dial: '+243' }, { name: 'Kore e Jugut', dial: '+82' }, { name: 'Kore e Veriut', dial: '+850' }, { name: 'Kosta Rikë', dial: '+506' }, { name: 'Kroaci', dial: '+385' }, { name: 'Kubë', dial: '+53' }, { name: 'Kuvajt', dial: '+965' },
  { name: 'Danimarkë', dial: '+45' }, { name: 'Xhibuti', dial: '+253' }, { name: 'Dominikë', dial: '+1-767' }, { name: 'Republika Dominikane', dial: '+1-809' }, { name: 'Ekuador', dial: '+593' }, { name: 'Egjipt', dial: '+20' }, { name: 'El Salvador', dial: '+503' }, { name: 'Emiratet e Bashkuara Arabe', dial: '+971' }, { name: 'Eritre', dial: '+291' }, { name: 'Estoni', dial: '+372' }, { name: 'Eswatini', dial: '+268' }, { name: 'Etiopi', dial: '+251' },
  { name: 'Fixhi', dial: '+679' }, { name: 'Filipine', dial: '+63' }, { name: 'Finlandë', dial: '+358' }, { name: 'Francë', dial: '+33' }, { name: 'Gabon', dial: '+241' }, { name: 'Gambi', dial: '+220' }, { name: 'Gjeorgji', dial: '+995' }, { name: 'Gjermani', dial: '+49' }, { name: 'Gana', dial: '+233' }, { name: 'Grenada', dial: '+1-473' }, { name: 'Greqi', dial: '+30' }, { name: 'Guatemalë', dial: '+502' }, { name: 'Guine', dial: '+224' }, { name: 'Guine-Bissau', dial: '+245' }, { name: 'Guajana', dial: '+592' }, { name: 'Guine Ekuatoriale', dial: '+240' },
  { name: 'Haiti', dial: '+509' }, { name: 'Honduras', dial: '+504' }, { name: 'Hungari', dial: '+36' }, { name: 'Indi', dial: '+91' }, { name: 'Indonezi', dial: '+62' }, { name: 'Irak', dial: '+964' }, { name: 'Iran', dial: '+98' }, { name: 'Irlandë', dial: '+353' }, { name: 'Islandë', dial: '+354' }, { name: 'Izrael', dial: '+972' }, { name: 'Itali', dial: '+39' },
  { name: 'Xhamajkë', dial: '+1-876' }, { name: 'Japoni', dial: '+81' }, { name: 'Jemen', dial: '+967' }, { name: 'Jordani', dial: '+962' }, { name: 'Kirgistan', dial: '+996' }, { name: 'Kiribati', dial: '+686' }, { name: 'Laos', dial: '+856' }, { name: 'Letoni', dial: '+371' }, { name: 'Lesoto', dial: '+266' }, { name: 'Liban', dial: '+961' }, { name: 'Liberi', dial: '+231' }, { name: 'Libi', dial: '+218' }, { name: 'Lihtenshtajn', dial: '+423' }, { name: 'Lituani', dial: '+370' }, { name: 'Luksemburg', dial: '+352' },
  { name: 'Madagaskar', dial: '+261' }, { name: 'Malajzi', dial: '+60' }, { name: 'Malavi', dial: '+265' }, { name: 'Maldivet', dial: '+960' }, { name: 'Mali', dial: '+223' }, { name: 'Maltë', dial: '+356' }, { name: 'Marok', dial: '+212' }, { name: 'Ishujt Marshall', dial: '+692' }, { name: 'Mauricius', dial: '+230' }, { name: 'Mauritani', dial: '+222' }, { name: 'Meksikë', dial: '+52' }, { name: 'Mikronezi', dial: '+691' }, { name: 'Moldavi', dial: '+373' }, { name: 'Monako', dial: '+377' }, { name: 'Mongoli', dial: '+976' }, { name: 'Mali i Zi', dial: '+382' }, { name: 'Mozambik', dial: '+258' }, { name: 'Mianmar', dial: '+95' },
  { name: 'Namibi', dial: '+264' }, { name: 'Nauru', dial: '+674' }, { name: 'Nepal', dial: '+977' }, { name: 'Niger', dial: '+227' }, { name: 'Nigeri', dial: '+234' }, { name: 'Nikaragua', dial: '+505' }, { name: 'Norvegji', dial: '+47' }, { name: 'Zelanda e Re', dial: '+64' },
  { name: 'Oman', dial: '+968' }, { name: 'Pakistan', dial: '+92' }, { name: 'Palau', dial: '+680' }, { name: 'Palestinë', dial: '+970' }, { name: 'Panama', dial: '+507' }, { name: 'Papua Guinea e Re', dial: '+675' }, { name: 'Paraguaj', dial: '+595' }, { name: 'Peru', dial: '+51' }, { name: 'Poloni', dial: '+48' }, { name: 'Portugali', dial: '+351' },
  { name: 'Republika Çeke', dial: '+420' }, { name: 'Republika e Afrikës Qendrore', dial: '+236' }, { name: 'Rumani', dial: '+40' }, { name: 'Rusi', dial: '+7' }, { name: 'Ruandë', dial: '+250' },
  { name: 'Saint Kitts dhe Nevis', dial: '+1-869' }, { name: 'Saint Lucia', dial: '+1-758' }, { name: 'Saint Vincent dhe Grenadinet', dial: '+1-784' }, { name: 'Samoa', dial: '+685' }, { name: 'San Marino', dial: '+378' }, { name: 'Sao Tome dhe Principe', dial: '+239' }, { name: 'Senegal', dial: '+221' }, { name: 'Serbi', dial: '+381' }, { name: 'Seychelles', dial: '+248' }, { name: 'Sierra Leone', dial: '+232' }, { name: 'Singapor', dial: '+65' }, { name: 'Siri', dial: '+963' }, { name: 'Sllovaki', dial: '+421' }, { name: 'Slloveni', dial: '+386' }, { name: 'Ishujt Solomon', dial: '+677' }, { name: 'Somali', dial: '+252' }, { name: 'Spanjë', dial: '+34' }, { name: 'Sri Lanka', dial: '+94' }, { name: 'Sudan', dial: '+249' }, { name: 'Sudani i Jugut', dial: '+211' }, { name: 'Surinam', dial: '+597' }, { name: 'Suedi', dial: '+46' }, { name: 'Zvicër', dial: '+41' },
  { name: 'Taxhikistan', dial: '+992' }, { name: 'Tajlandë', dial: '+66' }, { name: 'Tanzani', dial: '+255' }, { name: 'Timori Lindor', dial: '+670' }, { name: 'Togo', dial: '+228' }, { name: 'Tonga', dial: '+676' }, { name: 'Trinidad dhe Tobago', dial: '+1-868' }, { name: 'Tunizi', dial: '+216' }, { name: 'Turkmenistan', dial: '+993' }, { name: 'Turqi', dial: '+90' }, { name: 'Tuvalu', dial: '+688' },
  { name: 'Ugandë', dial: '+256' }, { name: 'Ukrainë', dial: '+380' }, { name: 'Uruguaj', dial: '+598' }, { name: 'Uzbekistan', dial: '+998' }, { name: 'Vanuatu', dial: '+678' }, { name: 'Vatikan', dial: '+379' }, { name: 'Venezuelë', dial: '+58' }, { name: 'Vietnam', dial: '+84' }, { name: 'Zambi', dial: '+260' }, { name: 'Zimbabve', dial: '+263' },
];

const normaliseDial = (dial: string) => dial.replace(/-/g, '');
const findCountry = (value: string) => [...countries]
  .sort((a, b) => b.dial.length - a.dial.length)
  .find((country) => value.replace(/\s/g, '').startsWith(normaliseDial(country.dial))) ?? countries[0]!;

type Props = { value?: string; defaultValue?: string; onChange?: (value: string) => void; name?: string; required?: boolean; disabled?: boolean };

export function CountryPhoneInput({ value, defaultValue, onChange, name, required, disabled }: Props) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '');
  const number = value ?? uncontrolled;
  const country = findCountry(number);
  const national = number.replace(/\s/g, '').startsWith(normaliseDial(country.dial))
    ? number.replace(/\s/g, '').slice(normaliseDial(country.dial).length)
    : number.replace(/\D/g, '').replace(/^0+/, '');
  const update = (next: string) => { if (value === undefined) setUncontrolled(next); onChange?.(next); };
  return <div className="flex">
    {name && <input type="hidden" name={name} value={number} />}
    <select aria-label="Shteti dhe prefiksi" className="input w-[9.5rem] shrink-0 rounded-r-none border-r-0 px-2 text-sm" value={country.dial} disabled={disabled} onChange={(event) => update(`${normaliseDial(event.target.value)}${national}`)}>
      {countries.map((item) => <option key={`${item.name}-${item.dial}`} value={item.dial}>{item.name} ({item.dial})</option>)}
    </select>
    <input required={required} disabled={disabled} className="input rounded-l-none" inputMode="tel" autoComplete="tel-national" placeholder="44 123 456" value={national} onChange={(event) => update(`${normaliseDial(country.dial)}${event.target.value.replace(/\D/g, '').replace(/^0+/, '')}`)} />
  </div>;
}
