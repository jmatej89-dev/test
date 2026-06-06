// Military aircraft detection — ICAO24 hex ranges + callsign prefixes

const ICAO_RANGES = [
  { lo: 0xAE0000, hi: 0xAFFFFF, country: 'United States',   branch: 'USAF / USN / USMC', flag: '🇺🇸' },
  { lo: 0x43C000, hi: 0x43CFFF, country: 'United Kingdom',  branch: 'Royal Air Force',    flag: '🇬🇧' },
  { lo: 0x43F000, hi: 0x43FFFF, country: 'United Kingdom',  branch: 'UK Military',        flag: '🇬🇧' },
  { lo: 0x302000, hi: 0x307FFF, country: 'France',          branch: "Armée de l'Air",     flag: '🇫🇷' },
  { lo: 0x38A000, hi: 0x38AFFF, country: 'France',          branch: 'Marine Nationale',   flag: '🇫🇷' },
  { lo: 0x3E0000, hi: 0x3EFFFF, country: 'Germany',         branch: 'Luftwaffe',          flag: '🇩🇪' },
  { lo: 0x448000, hi: 0x44FFFF, country: 'Belgium',         branch: 'Composante air',     flag: '🇧🇪' },
  { lo: 0x47C000, hi: 0x47FFFF, country: 'Norway',          branch: 'Luftforsvaret',      flag: '🇳🇴' },
  { lo: 0x480000, hi: 0x487FFF, country: 'Netherlands',     branch: 'KLu',                flag: '🇳🇱' },
  { lo: 0x4A0000, hi: 0x4AFFFF, country: 'Sweden',          branch: 'Flygvapnet',         flag: '🇸🇪' },
  { lo: 0x4B3000, hi: 0x4B3FFF, country: 'Switzerland',     branch: 'Schweizer Luftwaffe',flag: '🇨🇭' },
  { lo: 0x44F000, hi: 0x44FFFF, country: 'NATO',            branch: 'NATO AEW&C',         flag: '🌐' },
  { lo: 0x45F000, hi: 0x45FFFF, country: 'NATO',            branch: 'NATO',               flag: '🌐' },
  { lo: 0x100000, hi: 0x1FFFFF, country: 'Russia',          branch: 'VKS / AV-MF',        flag: '🇷🇺' },
  { lo: 0x738000, hi: 0x73FFFF, country: 'Israel',          branch: 'Heyl Ha\'Avir',      flag: '🇮🇱' },
  { lo: 0xC00000, hi: 0xC3FFFF, country: 'Canada',          branch: 'RCAF',               flag: '🇨🇦' },
  { lo: 0x7C0000, hi: 0x7C3FFF, country: 'Australia',       branch: 'RAAF',               flag: '🇦🇺' },
  { lo: 0x840000, hi: 0x87FFFF, country: 'Japan',           branch: 'Kōkū Jieitai',       flag: '🇯🇵' },
  { lo: 0x340000, hi: 0x37FFFF, country: 'Spain',           branch: 'Ejército del Aire',  flag: '🇪🇸' },
];

const CS_PREFIXES = [
  { prefix: 'REACH',  country: 'United States', branch: 'Air Mobility Command', flag: '🇺🇸' },
  { prefix: 'SPAR',   country: 'United States', branch: 'USAF VIP Transport',   flag: '🇺🇸' },
  { prefix: 'SAM',    country: 'United States', branch: 'Special Air Mission',  flag: '🇺🇸' },
  { prefix: 'USAF',   country: 'United States', branch: 'US Air Force',         flag: '🇺🇸' },
  { prefix: 'NAVY',   country: 'United States', branch: 'US Navy',              flag: '🇺🇸' },
  { prefix: 'DUKE',   country: 'United States', branch: 'US Air Force',         flag: '🇺🇸' },
  { prefix: 'HAVOC',  country: 'United States', branch: 'US Air Force',         flag: '🇺🇸' },
  { prefix: 'BISON',  country: 'United States', branch: 'US Air Force',         flag: '🇺🇸' },
  { prefix: 'VIPER',  country: 'United States', branch: 'US Air Force',         flag: '🇺🇸' },
  { prefix: 'EAGLE',  country: 'United States', branch: 'US Air Force',         flag: '🇺🇸' },
  { prefix: 'GHOST',  country: 'United States', branch: 'US Air Force',         flag: '🇺🇸' },
  { prefix: 'RAPTOR', country: 'United States', branch: 'US Air Force',         flag: '🇺🇸' },
  { prefix: 'TALON',  country: 'United States', branch: 'US Air Force',         flag: '🇺🇸' },
  { prefix: 'GAF',    country: 'Germany',       branch: 'Luftwaffe',            flag: '🇩🇪' },
  { prefix: 'RRR',    country: 'United Kingdom',branch: 'Royal Air Force',      flag: '🇬🇧' },
  { prefix: 'RFF',    country: 'United Kingdom',branch: 'Royal Air Force',      flag: '🇬🇧' },
  { prefix: 'NATOAW', country: 'NATO',          branch: 'NATO AWACS',           flag: '🌐' },
  { prefix: 'NATO',   country: 'NATO',          branch: 'NATO',                 flag: '🌐' },
  { prefix: 'COTAM',  country: 'France',        branch: "Armée de l'Air",       flag: '🇫🇷' },
  { prefix: 'FAF',    country: 'France',        branch: "Armée de l'Air",       flag: '🇫🇷' },
  { prefix: 'FALCON', country: 'United States', branch: 'US Air Force',         flag: '🇺🇸' },
  { prefix: 'RAVEN',  country: 'United States', branch: 'US Air Force',         flag: '🇺🇸' },
];

export function classifyAircraft(icao24, callsign) {
  const hex = parseInt(icao24, 16);
  if (!isNaN(hex)) {
    for (const r of ICAO_RANGES) {
      if (hex >= r.lo && hex <= r.hi) return { isMilitary: true, info: r };
    }
  }

  const cs = (callsign || '').trim().toUpperCase();
  for (const p of CS_PREFIXES) {
    if (cs.startsWith(p.prefix)) return { isMilitary: true, info: p };
  }

  return { isMilitary: false, info: null };
}
