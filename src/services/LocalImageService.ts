/**
 * Service for mapping church events to local saint images
 * Images are stored in assets/images/saints/
 */

// Image mapping: key is "DD-Month" format, value is require() for the image
// This maps calendar dates to their corresponding saint images

// Only keep verified correct images for 2026
export const SAINT_IMAGES: Record<string, any> = {
  // January
  '19-Jan': require('../../assets/images/saints/19-Jan.jpg'), // Богојавление - Jan 19, 2026 ✓

  // February
  '15-Feb': require('../../assets/images/saints/15-Feb.jpg'), // Сретение Господово - Feb 15, 2026 ✓
  '22-Feb': require('../../assets/images/saints/22-Feb.jpg'), // Прочка - Feb 22, 2026 ✓

  // April
  '12-April': require('../../assets/images/saints/12-April.jpg'), // Велигден - Apr 12, 2026 ✓
  '13-April': require('../../assets/images/saints/13-April.jpg'), // Day after Easter - Apr 13, 2026 ✓

  // May
  '06-May': require('../../assets/images/saints/06-May.jpg'), // Св. Георгиј - May 6, 2026 ✓
  '24-May': require('../../assets/images/saints/24-May.jpg'), // Св. Кирил и Методиј - May 24, 2026 ✓

  // July
  '12-July': require('../../assets/images/saints/12-July.jpg'), // Петровден - Jul 12, 2026 ✓

  // August
  '18-Aug': require('../../assets/images/saints/18-Aug.jpg'), // Преображение - Aug 18, 2026 ✓
  '28-Aug': require('../../assets/images/saints/28-Aug.jpg'), // Богородица - Aug 28, 2026 ✓

  // September
  '21-Sep': require('../../assets/images/saints/21-Sep.jpg'), // Мала Богородица - Sep 21, 2026 ✓
  '27-Sep': require('../../assets/images/saints/27-Sep.jpg'), // Крстовден - Sep 27, 2026 ✓

  // October
  '27-Oct': require('../../assets/images/saints/27-Oct.jpg'), // Петковден - Oct 27, 2026 ✓

  // November
  '08-Nov': require('../../assets/images/saints/08-Nov.jpg'), // Митровден - Nov 8, 2026 ✓
  '21-Nov': require('../../assets/images/saints/21-Nov.jpg'), // Арангеловден - Nov 21, 2026 ✓

  // December
  '04-Dec': require('../../assets/images/saints/04-Dec.jpg'), // Пречиста - Dec 4, 2026 ✓
  '19-Dec': require('../../assets/images/saints/19-Dec.jpg'), // Св. Николај - Dec 19, 2026 ✓
};

// Special feast day images (from denovi.mk/img/)
export const FEAST_IMAGES: Record<string, any> = {
  'rozdestvo': require('../../assets/images/saints/rozdestvo.png'), // Рождество/Божик
  'bogorodica': require('../../assets/images/saints/bogorodica.png'), // Богородица
  'voskresenie': require('../../assets/images/saints/voskresenie.png'), // Велигден
  'vovedenie': require('../../assets/images/saints/vovedenie.png'), // Пречиста/Воведение
  'sretenie': require('../../assets/images/saints/sretenie.png'), // Сретение
  'cvetnici': require('../../assets/images/saints/cvetnici.png'), // Цветници
  'apostoli': require('../../assets/images/saints/apostoli.png'), // Апостоли
};

// Month name mapping
const MONTH_NAMES: Record<number, string> = {
  0: 'Jan',
  1: 'Feb',
  2: 'March',
  3: 'April',
  4: 'May',
  5: 'June',
  6: 'July',
  7: 'Aug',
  8: 'Sep',
  9: 'Oct',
  10: 'Nov',
  11: 'Dec',
};

/**
 * Gets the local image for a given date
 * @param date The date to get the image for
 * @returns The require() result for the image, or null if not found
 */
export const getLocalImageForDate = (date: Date): any | null => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  const key = `${day}-${month}`;

  return SAINT_IMAGES[key] || null;
};

/**
 * Gets a feast day image by name
 * @param feastName The name of the feast (e.g., 'rozdestvo', 'voskresenie')
 * @returns The require() result for the image, or null if not found
 */
export const getFeastImage = (feastName: string): any | null => {
  return FEAST_IMAGES[feastName.toLowerCase()] || null;
};

/**
 * Gets the appropriate image for a church event
 * First tries to match by event name to special feast images,
 * then falls back to date-based images
 * @param eventName The name of the event
 * @param date The date of the event
 * @returns The require() result for the image, or null if not found
 */
export const getImageForEvent = (eventName: string, date: Date): any | null => {
  const nameLower = eventName.toLowerCase();

  // Check for special feast days by name
  if (nameLower.includes('божик') || nameLower.includes('рождество')) {
    return FEAST_IMAGES['rozdestvo'];
  }
  if (nameLower.includes('велигден') || nameLower.includes('воскресение')) {
    return FEAST_IMAGES['voskresenie'];
  }
  if (nameLower.includes('пречиста') || nameLower.includes('воведение')) {
    return FEAST_IMAGES['vovedenie'];
  }
  if (nameLower.includes('сретение')) {
    return FEAST_IMAGES['sretenie'];
  }
  if (nameLower.includes('цветници')) {
    return FEAST_IMAGES['cvetnici'];
  }
  if (nameLower.includes('успение') || nameLower.includes('богородица')) {
    return FEAST_IMAGES['bogorodica'];
  }
  if (nameLower.includes('петар и павле') || nameLower.includes('апостол')) {
    return FEAST_IMAGES['apostoli'];
  }

  // Fall back to date-based image
  return getLocalImageForDate(date);
};
