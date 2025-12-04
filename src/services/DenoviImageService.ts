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
 * Constructs the image URL for a given date from denovi.mk
 * @param date The date for which to fetch the saint image
 * @param sequence Optional image sequence number (default: '020')
 * @returns The full URL to the saint image
 */
export const getDenoviImageUrl = (date: Date, sequence: string = '020'): string => {
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();

  const monthName = MONTH_NAMES_MK[month];
  const dayFormatted = day.toString().padStart(2, '0');

  return `${DENOVI_BASE_URL}${SYNAXARION_PATH}/${monthName}/${dayFormatted}-${sequence}.jpg`;
};

/**
 * Get multiple possible image URLs for a date (in case the default doesn't exist)
 * @param date The date for which to fetch saint images
 * @returns Array of possible image URLs
 */
export const getPossibleDenoviImageUrls = (date: Date): string[] => {
  const sequences = ['020', '010', '030', '001'];
  return sequences.map(seq => getDenoviImageUrl(date, seq));
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
