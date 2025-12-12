/**
 * Service for mapping church events to local saint images
 * Images are stored in assets/images/saints/
 */

// Image mapping: key is "DD-Month" format, value is require() for the image
// This maps calendar dates to their corresponding saint images

export const SAINT_IMAGES: Record<string, any> = {
  // January
  '05-Jan': require('../../assets/images/saints/05-Jan.jpg'), // Свети Наум Охридски
  '12-Jan': require('../../assets/images/saints/12-Jan.jpg'),
  '19-Jan': require('../../assets/images/saints/19-Jan.jpg'), // Богојавление
  '26-Jan': require('../../assets/images/saints/26-Jan.jpg'),

  // February
  '02-Feb': require('../../assets/images/saints/02-Feb.jpg'),
  '09-Feb': require('../../assets/images/saints/09-Feb.jpg'),
  '15-Feb': require('../../assets/images/saints/15-Feb.jpg'), // Сретение Господово
  '16-Feb': require('../../assets/images/saints/16-Feb.jpg'),
  '22-Feb': require('../../assets/images/saints/22-Feb.jpg'), // Прочка
  '23-Feb': require('../../assets/images/saints/23-Feb.jpg'),

  // March
  '02-March': require('../../assets/images/saints/02-March.jpg'),
  '09-March': require('../../assets/images/saints/09-March.jpg'),
  '16-March': require('../../assets/images/saints/16-March.jpg'),
  '23-March': require('../../assets/images/saints/23-March.jpg'),

  // April
  '06-April': require('../../assets/images/saints/06-April.jpg'),
  '12-April': require('../../assets/images/saints/12-April.jpg'), // Велигден
  '13-April': require('../../assets/images/saints/13-April.jpg'),
  '17-April': require('../../assets/images/saints/17-April.jpg'),
  '18-April': require('../../assets/images/saints/18-April.jpg'),
  '19-April': require('../../assets/images/saints/19-April.jpg'),
  '20-April': require('../../assets/images/saints/20-April.jpg'),
  '27-April': require('../../assets/images/saints/27-April.jpg'),

  // May
  '04-May': require('../../assets/images/saints/04-May.jpg'),
  '06-May': require('../../assets/images/saints/06-May.jpg'), // Св. Георгиј
  '11-May': require('../../assets/images/saints/11-may.jpg'),
  '18-May': require('../../assets/images/saints/18-May.jpg'),
  '24-May': require('../../assets/images/saints/24-May.jpg'), // Св. Кирил и Методиј
  '25-May': require('../../assets/images/saints/25-May.jpg'),
  '28-May': require('../../assets/images/saints/28-May.jpg'),

  // June
  '01-June': require('../../assets/images/saints/01-June.jpg'),
  '07-June': require('../../assets/images/saints/07-June.jpg'),
  '08-June': require('../../assets/images/saints/08-June.jpg'),
  '15-June': require('../../assets/images/saints/15-June.jpg'),
  '22-June': require('../../assets/images/saints/22-June.jpg'),
  '29-June': require('../../assets/images/saints/29-June.jpg'),

  // July
  '07-July': require('../../assets/images/saints/07-July.jpg'),
  '12-July': require('../../assets/images/saints/12-July.jpg'), // Петровден
  '13-July': require('../../assets/images/saints/13-July.jpg'),
  '20-July': require('../../assets/images/saints/20-July.jpg'),
  '27-July': require('../../assets/images/saints/27-July.jpg'),

  // August
  '03-Aug': require('../../assets/images/saints/03-Aug.jpg'),
  '10-Aug': require('../../assets/images/saints/10-Aug.jpg'),
  '17-Aug': require('../../assets/images/saints/17-Aug.jpg'),
  '18-Aug': require('../../assets/images/saints/18-Aug.jpg'), // Преображение
  '24-Aug': require('../../assets/images/saints/24-Aug.jpg'),
  '27-Aug': require('../../assets/images/saints/27-Aug.jpg'), // Богородица
  '28-Aug': require('../../assets/images/saints/28-Aug.jpg'),
  '31-Aug': require('../../assets/images/saints/31-Aug.jpg'),

  // September
  '07-Sep': require('../../assets/images/saints/07-Sep.jpg'),
  '11-Sep': require('../../assets/images/saints/11-Sep.jpg'), // Отсекување на главата
  '14-Sep': require('../../assets/images/saints/14-Sep.jpg'),
  '21-Sep': require('../../assets/images/saints/21-Sep.jpg'), // Мала Богородица
  '27-Sep': require('../../assets/images/saints/27-Sep.jpg'), // Крстовден
  '28-Sep': require('../../assets/images/saints/28-Sep.jpg'),

  // October
  '05-Oct': require('../../assets/images/saints/05-Oct.jpg'),
  '12-Oct': require('../../assets/images/saints/12-Oct.jpg'),
  '19-Oct': require('../../assets/images/saints/19-Oct.jpg'),
  '26-Oct': require('../../assets/images/saints/26-Oct.jpg'), // Петковден
  '27-Oct': require('../../assets/images/saints/27-Oct.jpg'),

  // November
  '01-Nov': require('../../assets/images/saints/01-Nov.jpg'),
  '02-Nov': require('../../assets/images/saints/02-Nov.jpg'),
  '08-Nov': require('../../assets/images/saints/08-Nov.jpg'), // Митровден
  '09-Nov': require('../../assets/images/saints/09-Nov.jpg'),
  '16-Nov': require('../../assets/images/saints/16-Nov.jpg'),
  '20-Nov': require('../../assets/images/saints/20-Nov.jpg'),
  '21-Nov': require('../../assets/images/saints/21-Nov.jpg'), // Арангеловден
  '23-Nov': require('../../assets/images/saints/23-Nov.jpg'),
  '30-Nov': require('../../assets/images/saints/30-Nov.jpg'),

  // December
  '03-Dec': require('../../assets/images/saints/03-Dec.jpg'),
  '04-Dec': require('../../assets/images/saints/04-Dec.jpg'), // Пречиста
  '07-Dec': require('../../assets/images/saints/07-Dec.jpg'),
  '14-Dec': require('../../assets/images/saints/14-Dec.jpg'),
  '18-Dec': require('../../assets/images/saints/18-Dec.jpg'),
  '19-Dec': require('../../assets/images/saints/19-Dec.jpg'), // Св. Николај
  '21-Dec': require('../../assets/images/saints/21-Dec.jpg'),
  '28-Dec': require('../../assets/images/saints/28-Dec.jpg'),
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
