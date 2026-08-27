import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { ChurchEvent } from './ChurchCalendarService';

// Normalized reminder timings used across NotificationService,
// AutoNotificationService and SocialMediaService.
export type ReminderTiming = 'WEEK' | 'THREE_DAYS' | 'DAY' | 'SAME_DAY' | 'HOUR';

export interface ReminderText {
  title: string;
  body: string;
}

const formatDate = (date: Date): string => format(date, 'd MMMM', { locale: mk });

// Event names like „Неделна Литургија" already name the service; feast names
// like „Успение на Пресвета Богородица" need the service spelled out.
const mentionsLiturgy = (name: string): boolean => /литурги/i.test(name);
const mentionsEveningService = (name: string): boolean => /вечерна/i.test(name);

const churchOpenText = (event: ChurchEvent, timing: ReminderTiming): ReminderText => {
  const hours = event.description ? ` (${event.description})` : '';
  let body: string;

  switch (timing) {
    case 'WEEK':
    case 'THREE_DAYS':
      body = `На ${formatDate(event.date)} црквата ќе биде отворена, без присуство на свештеник.${hours}`;
      break;
    case 'DAY':
      body = `Утре црквата е отворена, но свештеникот не е присутен.${hours}`;
      break;
    case 'SAME_DAY':
    case 'HOUR':
      body = `Денес црквата е отворена, свештеникот не е присутен.${hours}`;
      break;
  }

  return { title: event.name, body };
};

const liturgyText = (event: ChurchEvent, timing: ReminderTiming): ReminderText => {
  const named = mentionsLiturgy(event.name);
  let body: string;

  switch (timing) {
    case 'WEEK':
      body = named
        ? `${event.name} - следната недела (${formatDate(event.date)}) во ${event.time} часот.`
        : `Следната недела (${formatDate(event.date)}) е ${event.name} - литургијата започнува во ${event.time} часот.`;
      break;
    case 'THREE_DAYS':
      body = named
        ? `За 3 дена - ${event.name} во ${event.time} часот.`
        : `За 3 дена е ${event.name} - литургијата започнува во ${event.time} часот.`;
      break;
    case 'DAY':
      body = named
        ? `Утре - ${event.name} во ${event.time} часот.`
        : `Утре е ${event.name} - литургијата започнува во ${event.time} часот.`;
      break;
    case 'SAME_DAY':
      body = named
        ? `Денес - ${event.name} во ${event.time} часот.`
        : `Денес е ${event.name} - литургијата започнува во ${event.time} часот.`;
      break;
    case 'HOUR':
      body = named
        ? `${event.name} започнува за еден час.`
        : `Литургијата започнува за еден час.`;
      break;
  }

  return { title: event.name, body };
};

const eveningServiceText = (event: ChurchEvent, timing: ReminderTiming): ReminderText => {
  const named = mentionsEveningService(event.name);
  let body: string;

  switch (timing) {
    case 'WEEK':
      body = named
        ? `${event.name} - следната недела (${formatDate(event.date)}) во ${event.time} часот.`
        : `Вечерна богослужба за ${event.name} - следната недела (${formatDate(event.date)}) во ${event.time} часот.`;
      break;
    case 'THREE_DAYS':
      body = named
        ? `За 3 дена - ${event.name} во ${event.time} часот.`
        : `За 3 дена - вечерна богослужба за ${event.name}, во ${event.time} часот.`;
      break;
    case 'DAY':
      body = named
        ? `Утре - ${event.name} во ${event.time} часот.`
        : `Утре вечерната богослужба за ${event.name} започнува во ${event.time} часот.`;
      break;
    case 'SAME_DAY':
      body = named
        ? `Денес - ${event.name} во ${event.time} часот.`
        : `Денес вечерната богослужба за ${event.name} започнува во ${event.time} часот.`;
      break;
    case 'HOUR':
      body = `Вечерната богослужба започнува за еден час.`;
      break;
  }

  return { title: event.name, body };
};

const picnicText = (event: ChurchEvent, timing: ReminderTiming): ReminderText => {
  let body: string;

  switch (timing) {
    case 'WEEK':
      body = `${event.name} - следната недела (${formatDate(event.date)}) во ${event.time} часот.`;
      break;
    case 'THREE_DAYS':
      body = `За 3 дена - ${event.name} во ${event.time} часот.`;
      break;
    case 'DAY':
      body = `Утре - ${event.name} во ${event.time} часот.`;
      break;
    case 'SAME_DAY':
      body = `Денес - ${event.name} во ${event.time} часот.`;
      break;
    case 'HOUR':
      body = `${event.name} започнува за еден час.`;
      break;
  }

  if (event.description) {
    body += `\nЛокација: ${event.description}`;
  }

  return { title: event.name, body };
};

export const getReminderText = (event: ChurchEvent, timing: ReminderTiming): ReminderText => {
  switch (event.serviceType) {
    case 'CHURCH_OPEN':
      return churchOpenText(event, timing);
    case 'EVENING_SERVICE':
      return eveningServiceText(event, timing);
    case 'PICNIC':
      return picnicText(event, timing);
    case 'LITURGY':
    default:
      return liturgyText(event, timing);
  }
};
