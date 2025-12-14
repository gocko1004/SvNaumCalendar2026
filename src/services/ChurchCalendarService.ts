import { format, parse, isEqual } from 'date-fns';
import { mk } from 'date-fns/locale';
import { getDenoviImageUrl, getAccessibleDenoviImage, fetchSaintName } from './DenoviImageService';

export type ServiceType =
  | 'LITURGY'
  | 'EVENING_SERVICE'
  | 'CHURCH_OPEN'
  | 'PICNIC';

export interface ChurchEvent {
  id?: string; // Firestore document ID (optional for hardcoded events)
  date: Date;
  name: string;
  serviceType: ServiceType;
  time: string;
  description?: string;
  imageUrl?: string; // Optional image URL from denovi.mk
  saintName?: string; // Saint name from denovi.mk
}

// Church events for 2026
export const CHURCH_EVENTS_2026: ChurchEvent[] = [
  // January
  {
    date: new Date(2026, 1-1, 4),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Вмц. Анастасија Узорешителница'
  },
  {
    date: new Date(2026, 1-1, 5),
    name: 'Свети Наум охридски',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00'
  },
  {
    date: new Date(2026, 1-1, 7),
    name: 'Рождество Христово БОЖИК',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 1-1, 7),
    name: 'Рождество Христово БОЖИК',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 1-1, 11),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Јосиф Обручник, цар Давид и Јаков'
  },
  {
    date: new Date(2026, 1-1, 18),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Свмч. Теопемпт и мч. Теона'
  },
  {
    date: new Date(2026, 1-1, 19),
    name: 'Голем Богојавлениски Водосвет, Богојавление',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 1-1, 25),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Мч. Татјана и другите со неа пострадани'
  },
  // February
  {
    date: new Date(2026, 2-1, 1),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Преп. Макариј Велики'
  },
  {
    date: new Date(2026, 2-1, 8),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Преп. Ксенофонт и семејството'
  },
  {
    date: new Date(2026, 2-1, 14),
    name: 'ЗАДУШНИЦА',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 2-1, 15),
    name: 'Сретение Господово',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 2-1, 22),
    name: 'Прочка',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  // March
  {
    date: new Date(2026, 3-1, 1),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Мч. Памфил, Валент, Павле и др.'
  },
  {
    date: new Date(2026, 3-1, 8),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Свмч. Поликарп, еп. Смирнски'
  },
  {
    date: new Date(2026, 3-1, 15),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Поклонение на Часниот Крст'
  },
  {
    date: new Date(2026, 3-1, 22),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Преп. Јован Лествичник'
  },
  {
    date: new Date(2026, 3-1, 29),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Ап. Аристовул, еп. Британски'
  },
  // April
  {
    date: new Date(2026, 4-1, 4),
    name: 'Лазарева Сабота',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 4-1, 5),
    name: 'ЦВЕТНИЦИ',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 4-1, 9),
    name: 'Велики Четврток',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 4-1, 10),
    name: 'Велики Петок',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 4-1, 12),
    name: 'Воскресение на Господ Исус Христос, Велигден',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 4-1, 13),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Свмч. Ипатиј, еп. Гангрски'
  },
  {
    date: new Date(2026, 4-1, 19),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Св. Методиј, архиеп. Моравски'
  },
  {
    date: new Date(2026, 4-1, 26),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Свмч. Артемон'
  },
  // May
  {
    date: new Date(2026, 5-1, 3),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Преп. Теодор Трихин'
  },
  {
    date: new Date(2026, 5-1, 5),
    name: 'Св. вмч. Георгиј Победоносец',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 5-1, 6),
    name: 'Св. вмч. Георгиј Победоносец',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00'
  },
  {
    date: new Date(2026, 5-1, 10),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Ап. Симеон, еп. Јерусалимски'
  },
  {
    date: new Date(2026, 5-1, 17),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Мч. Пелагија, дева Тарсиска'
  },
  {
    date: new Date(2026, 5-1, 20),
    name: 'Вознесение на Господ Исус Христос Спасовден',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 5-1, 21),
    name: 'Вознесение на Господ Исус Христос Спасовден',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00'
  },
  {
    date: new Date(2026, 5-1, 24),
    name: 'Св. Кирил и Методиј',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 5-1, 30),
    name: 'ЗАДУШНИЦА',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 5-1, 31),
    name: 'Слегување на Св. Дух врз апостолите – Педесетница',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  // June
  {
    date: new Date(2026, 6-1, 2),
    name: 'Св. рамноап. цас Константин и Едена',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 6-1, 7),
    name: 'Петрови Поклади',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 6-1, 14),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Мч. Јустин Филозоф'
  },
  {
    date: new Date(2026, 6-1, 21),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Вмч. Теодор Стратилат'
  },
  {
    date: new Date(2026, 6-1, 28),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Мч. Вит, Модест и Крискентија'
  },
  // July
  {
    date: new Date(2026, 7-1, 2),
    name: 'Св. Наум Охридски',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 7-1, 3),
    name: 'Св. Наум Охридски',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00'
  },
  {
    date: new Date(2026, 7-1, 5),
    name: 'Неделна Литургија – Пикник',
    serviceType: 'PICNIC',
    time: '09:00'
  },
  {
    date: new Date(2026, 7-1, 12),
    name: 'Св. ап-ли Петар и Павле, Петровден',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 7-1, 19),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Преп. Сисој Велики'
  },
  {
    date: new Date(2026, 7-1, 26),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Собор на Св. Архангел Гавриил'
  },
  // August
  {
    date: new Date(2026, 8-1, 2),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Св. прор. Илија'
  },
  {
    date: new Date(2026, 8-1, 9),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Св. Климент Охридски'
  },
  {
    date: new Date(2026, 8-1, 16),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Преп. Исаакиј, Далмат и Фавст'
  },
  {
    date: new Date(2026, 8-1, 18),
    name: 'Преображение на Господ Исус Христос',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 8-1, 23),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Мч. архиѓакон Лаврентиј'
  },
  {
    date: new Date(2026, 8-1, 27),
    name: 'Успение на Пресвета Богородица',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 8-1, 28),
    name: 'Богородица',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00'
  },
  {
    date: new Date(2026, 8-1, 30),
    name: 'Неделна Литургија – Пикник',
    serviceType: 'PICNIC',
    time: '09:00'
  },
  // September
  {
    date: new Date(2026, 9-1, 6),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Свмч. Евтихиј'
  },
  {
    date: new Date(2026, 9-1, 10),
    name: 'Отсекување на главата на Св. Јован Крстител',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 9-1, 13),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Положување на појасот на Пресв. Богородица'
  },
  {
    date: new Date(2026, 9-1, 20),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Мч. Созонт'
  },
  {
    date: new Date(2026, 9-1, 21),
    name: 'Мала Богородица',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00'
  },
  {
    date: new Date(2026, 9-1, 27),
    name: 'Воздвижение на Чесниот Крст, Крстовден',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  // October
  {
    date: new Date(2026, 10-1, 4),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Ап. Кодрат'
  },
  {
    date: new Date(2026, 10-1, 11),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Преп. Харитон Исповедник'
  },
  {
    date: new Date(2026, 10-1, 18),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Мч. Харитина'
  },
  {
    date: new Date(2026, 10-1, 25),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Св. отци од VII Вселенски Собор'
  },
  {
    date: new Date(2026, 10-1, 26),
    name: 'Св. Петка, Петковден',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 10-1, 27),
    name: 'Св. Петка, Петковден',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00'
  },
  // November
  {
    date: new Date(2026, 11-1, 1),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Прор. Јоил'
  },
  {
    date: new Date(2026, 11-1, 7),
    name: 'ЗАДУШНИЦА',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 11-1, 8),
    name: 'Св. вмч. Димитриј – Митровден',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 11-1, 15),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Мч. Акиндин, Пигасиј и др.'
  },
  {
    date: new Date(2026, 11-1, 21),
    name: 'Собор на св. Архангел Михаил',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 11-1, 22),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Преп. Матрона Цариградска'
  },
  {
    date: new Date(2026, 11-1, 29),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Ап. и еванг. Матеј'
  },
  // December
  {
    date: new Date(2026, 12-1, 3),
    name: 'Воведение на Пресвета Богородица – Пречиста',
    serviceType: 'EVENING_SERVICE',
    time: '19:00'
  },
  {
    date: new Date(2026, 12-1, 4),
    name: 'Воведение на Пресвета Богородица – Пречиста',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00'
  },
  {
    date: new Date(2026, 12-1, 6),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Св. Амфилохиј, еп. Икониски'
  },
  {
    date: new Date(2026, 12-1, 13),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Ап. Андреј Првоповикан'
  },
  {
    date: new Date(2026, 12-1, 19),
    name: 'Св. Николај',
    serviceType: 'LITURGY',
    time: '09:00'
  },
  {
    date: new Date(2026, 12-1, 20),
    name: 'Неделна Литургија',
    serviceType: 'LITURGY',
    time: '09:00',
    saintName: 'Св. Амвросиј, еп. Медиолански'
  },
  {
    date: new Date(2026, 12-1, 27),
    name: 'Црквата е отворена',
    serviceType: 'CHURCH_OPEN',
    time: '09:00',
    description: '09:00 - 13:00',
    saintName: 'Мч. Тирс, Левкиј и Калиник'
  }
];

// Use CHURCH_EVENTS_2026 as the main calendar
export const CHURCH_EVENTS = CHURCH_EVENTS_2026;

export const getEventsForDate = (date: Date): ChurchEvent[] => {
  return CHURCH_EVENTS.filter(event =>
    isEqual(
      new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate()),
      new Date(date.getFullYear(), date.getMonth(), date.getDate())
    )
  );
};

export const getUpcomingEvents = (fromDate: Date, days: number = 7): ChurchEvent[] => {
  const endDate = new Date(fromDate);
  endDate.setDate(endDate.getDate() + days);

  return CHURCH_EVENTS.filter(event =>
    event.date >= fromDate && event.date <= endDate
  ).sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const formatEventDate = (date: Date): string => {
  return format(date, 'dd.MM.yyyy');
};

export const formatEventTime = (time: string): string => {
  return time;
};

export const getServiceTypeLabel = (type: ServiceType): string => {
  switch (type) {
    case 'LITURGY':
      return 'Литургија';
    case 'EVENING_SERVICE':
      return 'Вечерна Богослужба';
    case 'CHURCH_OPEN':
      return 'Црквата е отворена / Без свештеник';
    case 'PICNIC':
      return 'Пикник';
    default:
      return '';
  }
};

/**
 * Enriches a church event with an image URL from denovi.mk
 * @param event The church event to enrich
 * @returns The event with an imageUrl property added
 */
export const enrichEventWithImage = (event: ChurchEvent): ChurchEvent => {
  return {
    ...event,
    imageUrl: getDenoviImageUrl(event.date)
  };
};

/**
 * Enriches multiple church events with image URLs from denovi.mk
 * @param events Array of church events to enrich
 * @returns Array of events with imageUrl properties added
 */
export const enrichEventsWithImages = (events: ChurchEvent[]): ChurchEvent[] => {
  return events.map(enrichEventWithImage);
};

/**
 * Enriches a church event with both image and saint name from denovi.mk
 * @param event The church event to enrich
 * @returns Promise resolving to the event with imageUrl and saintName properties added
 */
// ALL dates use standard synaxarion URLs - no special cases
export const SPECIAL_FEAST_URLS: Record<string, string> = {};

export const enrichEventWithData = async (event: ChurchEvent): Promise<ChurchEvent> => {
  // 1. Check for special feast URLs first
  const dateKey = `${event.date.getFullYear()}-${String(event.date.getMonth() + 1).padStart(2, '0')}-${String(event.date.getDate()).padStart(2, '0')}`;
  let imageUrl = event.imageUrl || SPECIAL_FEAST_URLS[dateKey];

  // 2. If not special feast, use regular synaxarion URL with month-based sequence
  if (!imageUrl) {
    imageUrl = getDenoviImageUrl(event.date); // Uses month-based default sequence
  }

  // 3. Fetch Saint Name if missing
  let saintName = event.saintName;
  if (!saintName) {
    saintName = await fetchSaintName(event.date) || undefined;
  }

  return {
    ...event,
    imageUrl,
    saintName
  };
};
