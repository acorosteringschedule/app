// Indonesian national holidays (built-in). Admin can add custom ones via Settings.
export const ID_HOLIDAYS = {
  "2025-01-01": "Tahun Baru Masehi",
  "2025-01-27": "Isra Mikraj Nabi Muhammad",
  "2025-01-29": "Tahun Baru Imlek 2576",
  "2025-03-29": "Hari Suci Nyepi 1947",
  "2025-03-31": "Hari Raya Idul Fitri 1446 H",
  "2025-04-01": "Hari Raya Idul Fitri 1446 H",
  "2025-04-18": "Wafat Isa Almasih",
  "2025-04-20": "Hari Paskah",
  "2025-05-01": "Hari Buruh Internasional",
  "2025-05-12": "Hari Raya Waisak",
  "2025-05-29": "Kenaikan Isa Almasih",
  "2025-06-01": "Hari Lahir Pancasila",
  "2025-06-06": "Hari Raya Idul Adha",
  "2025-06-27": "Tahun Baru Islam 1447 H",
  "2025-08-17": "Hari Kemerdekaan RI",
  "2025-09-05": "Maulid Nabi Muhammad",
  "2025-12-25": "Hari Raya Natal",

  "2026-01-01": "Tahun Baru Masehi",
  "2026-01-17": "Isra Mikraj Nabi Muhammad",
  "2026-02-17": "Tahun Baru Imlek 2577",
  "2026-03-19": "Hari Suci Nyepi 1948",
  "2026-03-21": "Hari Raya Idul Fitri 1447 H",
  "2026-03-22": "Hari Raya Idul Fitri 1447 H",
  "2026-04-03": "Wafat Isa Almasih",
  "2026-04-05": "Hari Paskah",
  "2026-05-01": "Hari Buruh Internasional",
  "2026-05-14": "Kenaikan Isa Almasih",
  "2026-05-27": "Hari Raya Idul Adha",
  "2026-05-31": "Hari Raya Waisak",
  "2026-06-01": "Hari Lahir Pancasila",
  "2026-06-16": "Tahun Baru Islam 1448 H",
  "2026-08-17": "Hari Kemerdekaan RI",
  "2026-08-25": "Maulid Nabi Muhammad",
  "2026-12-25": "Hari Raya Natal",

  "2027-01-01": "Tahun Baru Masehi",
  "2027-01-07": "Isra Mikraj Nabi Muhammad",
  "2027-02-06": "Tahun Baru Imlek 2578",
  "2027-03-08": "Hari Suci Nyepi 1949",
  "2027-03-10": "Hari Raya Idul Fitri 1448 H",
  "2027-03-11": "Hari Raya Idul Fitri 1448 H",
  "2027-03-26": "Wafat Isa Almasih",
  "2027-05-01": "Hari Buruh Internasional",
  "2027-05-06": "Kenaikan Isa Almasih",
  "2027-05-16": "Hari Raya Idul Adha",
  "2027-05-20": "Hari Raya Waisak",
  "2027-06-01": "Hari Lahir Pancasila",
  "2027-06-06": "Tahun Baru Islam 1449 H",
  "2027-08-15": "Maulid Nabi Muhammad",
  "2027-08-17": "Hari Kemerdekaan RI",
  "2027-12-25": "Hari Raya Natal",
};

// Runtime-injected custom holidays from admin settings (list of {date, name})
let CUSTOM_HOLIDAYS = {};

export function setCustomHolidays(list) {
  const map = {};
  for (const h of list || []) {
    if (h?.date && h?.name) map[h.date] = h.name;
  }
  CUSTOM_HOLIDAYS = map;
}

export function getHolidayName(dateStr) {
  return CUSTOM_HOLIDAYS[dateStr] || ID_HOLIDAYS[dateStr] || null;
}

/** Returns { type: 'weekend' | 'holiday' | 'sunday' | null, label?: string, custom?: boolean } */
export function getDayMark(dateStr) {
  const d = new Date(dateStr);
  const dow = d.getDay();
  const customName = CUSTOM_HOLIDAYS[dateStr];
  if (customName) return { type: "holiday", label: customName, custom: true };
  const nationalName = ID_HOLIDAYS[dateStr];
  if (nationalName) return { type: "holiday", label: nationalName, custom: false };
  if (dow === 0) return { type: "sunday", label: "Minggu" };
  if (dow === 6) return { type: "weekend", label: "Sabtu" };
  return { type: null };
}

export function isNonWorkingDay(dateStr) {
  return getDayMark(dateStr).type !== null;
}
