/**
 * Service for fetching saint images from denovi.mk
 * Images are located at: https://denovi.mk/synaxarion/[month]/[day]-[sequence].jpg
 */

const DENOVI_BASE_URL = 'https://denovi.mk';
const SYNAXARION_PATH = '/synaxarion';

// Mapping of month numbers (1-12) to Macedonian month names used in denovi.mk URLs
const MONTH_NAMES_MK: Record<number, string> = {
  1: 'januari',
  2: 'fevruari',
  3: 'mart',
  4: 'april',
  5: 'maj',
  6: 'juni',
  7: 'juli',
  8: 'avgust',
  9: 'septemvri',
  10: 'oktomvri',
  11: 'noemvri',
  12: 'dekemvri'
};

/**
 * Get the default image sequence for a given month
 * Images on denovi.mk use month-based sequences:
 * - January = 01X (010, 011, etc.)
 * - February = 02X (020, 021, etc.)
 * - December = 12X (120, 121, etc.)
 * @param month Month number (1-12)
 * @returns The default sequence string for that month
 */
export const getDefaultSequenceForMonth = (month: number): string => {
  return `${month.toString().padStart(2, '0')}0`;
};

/**
 * Constructs the image URL for a given date from denovi.mk
 * @param date The date for which to fetch the saint image
 * @param sequence Optional image sequence number (default: month-based, e.g., '010' for January, '120' for December)
 * @returns The full URL to the saint image
 */
export const getDenoviImageUrl = (date: Date, sequence?: string): string => {
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();

  const monthName = MONTH_NAMES_MK[month];
  const dayFormatted = day.toString().padStart(2, '0');

  // Use month-based default sequence if not provided
  const seq = sequence || getDefaultSequenceForMonth(month);

  return `${DENOVI_BASE_URL}${SYNAXARION_PATH}/${monthName}/${dayFormatted}-${seq}.jpg`;
};

/**
 * Get multiple possible image URLs for a date (in case the default doesn't exist)
 * Uses month-based sequences first (e.g., 010-019 for January, 120-129 for December)
 * @param date The date for which to fetch saint images
 * @returns Array of possible image URLs
 */
export const getPossibleDenoviImageUrls = (date: Date): string[] => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const monthPrefix = month.toString().padStart(2, '0');

  // Special feast days might have images in different sequences
  // For Cross-Veneration Sunday (March 15), try lower sequences first (the TOP image)
  if (month === 3 && day === 15) {
    // Try lower numbers first - these are usually the first/top images
    return ['000', '001', '002', '003', '030', '031', '032'].map(seq => getDenoviImageUrl(date, seq));
  }

  // Build month-specific sequences first (e.g., for December: 120, 121, 122...)
  const monthSequences = Array.from({ length: 10 }, (_, i) => `${monthPrefix}${i}`);

  // Fallback to generic sequences
  const fallbackSequences = ['000', '001', '002', '003'];

  return [...monthSequences, ...fallbackSequences].map(seq => getDenoviImageUrl(date, seq));
};

/**
 * Fetches the saint name from denovi.mk for a given date
 * Parses the HTML to find the first NEW calendar saint (white-colored #ffffff)
 *
 * The denovi.mk page structure:
 * - <ul id='saints_list'> contains all saints
 * - <li style='color: #ffffff;'> = NEW calendar saints (what we want)
 * - <li style='color: #afafaf;'> = OLD calendar saints
 * - Saint names are in <a class='saint_name'> or <span class='saint_name'>
 */
export const fetchSaintName = async (date: Date): Promise<string | null> => {
  try {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Construct the page URL in YYYYMMDD.html format (e.g., https://denovi.mk/20260412.html)
    const url = `${DENOVI_BASE_URL}/${year}${month}${day}.html`;

    const response = await fetch(url);
    const html = await response.text();

    // Find the saints_list section and look for white-colored (NEW calendar) saints
    // Pattern: <li style='color: #ffffff;'...><a...class='saint_name'>Saint Name (year)</a></li>
    // We want the first saint with white color (#ffffff) which is the NEW calendar saint

    // Match <li> elements with white color (#ffffff) containing saint names
    const whiteListItemRegex = /<li[^>]*style='color:\s*#ffffff;'[^>]*>.*?class='saint_name'[^>]*>([^<]+)<\/(?:a|span)>/gi;

    let match = whiteListItemRegex.exec(html);
    if (match && match[1]) {
      let saintName = match[1].trim();
      // Remove bullet point if present
      saintName = saintName.replace(/^[•&bull;&#8226;\s]+/, '').trim();
      // Remove year in parentheses at the end for cleaner display
      saintName = saintName.replace(/\s*\([^)]*\)\s*$/, '').trim();

      if (saintName && saintName.length > 2) {
        return saintName;
      }
    }

    // Alternative: Try to find saint name from <a> with class='saint_name' directly
    // Pattern: <a href='...' style='color: #ffffff;...' class='saint_name'>Saint Name</a>
    const altRegex = /<a[^>]*style='color:\s*#ffffff;[^']*'[^>]*class='saint_name'[^>]*>([^<]+)<\/a>/gi;
    match = altRegex.exec(html);
    if (match && match[1]) {
      let saintName = match[1].trim();
      saintName = saintName.replace(/\s*\([^)]*\)\s*$/, '').trim();
      if (saintName && saintName.length > 2) {
        return saintName;
      }
    }

    return null;
  } catch (error) {
    console.warn(`Error fetching saint name for ${date.toISOString()}:`, error);
    return null;
  }
};

/**
 * Checks if an image URL is accessible
 * @param url The image URL to check
 * @returns Promise that resolves to true if image is accessible
 */
export const checkImageExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Gets the first accessible image URL from a list of possible URLs
 * @param date The date for which to fetch the saint image
 * @returns Promise that resolves to the first accessible image URL or null
 */
export const getAccessibleDenoviImage = async (date: Date): Promise<string | null> => {
  const urls = getPossibleDenoviImageUrls(date);

  for (const url of urls) {
    const exists = await checkImageExists(url);
    if (exists) {
      return url;
    }
  }

  return null;
};

/**
 * Batch fetch images for multiple dates
 * @param dates Array of dates to fetch images for
 * @returns Promise that resolves to a map of date strings to image URLs
 */
export const batchFetchDenoviImages = async (dates: Date[]): Promise<Map<string, string>> => {
  const imageMap = new Map<string, string>();

  const promises = dates.map(async (date) => {
    const imageUrl = await getAccessibleDenoviImage(date);
    if (imageUrl) {
      const dateKey = date.toISOString().split('T')[0];
      imageMap.set(dateKey, imageUrl);
    }
  });

  await Promise.all(promises);
  return imageMap;
};
