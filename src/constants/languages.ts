export const LANGUAGES = {
  MK: 'mk',
  EN: 'en',
} as const;

export type Language = typeof LANGUAGES[keyof typeof LANGUAGES];

export const translations = {
  [LANGUAGES.MK]: {
    // App Navigation
    calendar: 'Календар',
    addEvent: 'Додај настан',
    settings: 'Поставки',
    admin: 'Админ',

    // Events
    eventTitle: 'Наслов на настанот',
    eventDescription: 'Опис на настанот',
    eventDate: 'Датум',
    eventTime: 'Време',
    eventLocation: 'Локација',
    saveEvent: 'Зачувај',
    deleteEvent: 'Избриши',
    editEvent: 'Измени',

    // Church Events
    sundayService: 'Недела - Божествена Литургија',
    stNaumDay: 'Св. Наум Охридски Чудотворец',
    christmas: 'Божик',
    easter: 'Велигден',
    epiphany: 'Водици',
    assumption: 'Успение на Пресвета Богородица',
    goodFriday: 'Велики Петок',
    palmSunday: 'Цветници',

    // Notifications
    notificationSettings: 'Поставки за известувања',
    eventReminders: 'Потсетници за настани',
    dailyDigest: 'Дневен преглед',
    weeklyNewsletter: 'Неделен билтен',
    
    // Admin Panel
    login: 'Најава',
    logout: 'Одјава',
    username: 'Корисничко име',
    password: 'Лозинка',
    dashboard: 'Контролна табла',
    manageEvents: 'Управување со настани',
    manageUsers: 'Управување со корисници',
    manageNotifications: 'Управување со известувања',

    // Messages
    loginSuccess: 'Успешна најава',
    loginError: 'Погрешно корисничко име или лозинка',
    eventSaved: 'Настанот е зачуван',
    eventDeleted: 'Настанот е избришан',
    settingsSaved: 'Поставките се зачувани',
  },
  [LANGUAGES.EN]: {
    // App Navigation
    calendar: 'Calendar',
    addEvent: 'Add Event',
    settings: 'Settings',
    admin: 'Admin',

    // Events
    eventTitle: 'Event Title',
    eventDescription: 'Event Description',
    eventDate: 'Date',
    eventTime: 'Time',
    eventLocation: 'Location',
    saveEvent: 'Save',
    deleteEvent: 'Delete',
    editEvent: 'Edit',

    // Church Events
    sundayService: 'Sunday Divine Liturgy',
    stNaumDay: 'St. Naum of Ohrid the Wonderworker',
    christmas: 'Christmas',
    easter: 'Easter',
    epiphany: 'Epiphany',
    assumption: 'Assumption of the Virgin Mary',
    goodFriday: 'Good Friday',
    palmSunday: 'Palm Sunday',

    // Notifications
    notificationSettings: 'Notification Settings',
    eventReminders: 'Event Reminders',
    dailyDigest: 'Daily Digest',
    weeklyNewsletter: 'Weekly Newsletter',
    
    // Admin Panel
    login: 'Login',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    dashboard: 'Dashboard',
    manageEvents: 'Manage Events',
    manageUsers: 'Manage Users',
    manageNotifications: 'Manage Notifications',

    // Messages
    loginSuccess: 'Login successful',
    loginError: 'Invalid username or password',
    eventSaved: 'Event saved',
    eventDeleted: 'Event deleted',
    settingsSaved: 'Settings saved',
  },
}; 