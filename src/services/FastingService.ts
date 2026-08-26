import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

// Fasting rules per the eparchy guidance. Admin-managed — nothing is hardcoded
// about WHEN fasts happen; only the vocabulary of rules lives in code.
export type FastingRule = 'STRICT' | 'WITH_OIL' | 'WINE_OIL' | 'FISH';

export interface FastingSpecialDay {
  date: Date;
  rule: FastingRule;
  note?: string; // нпр. „Благовештение"
}

export interface FastingPeriod {
  id?: string;
  name: string;
  startDate: Date; // inclusive
  endDate: Date; // inclusive
  defaultRule: FastingRule;
  weekendRule?: FastingRule; // optional Sat/Sun rule (typikons usually relax weekends)
  note?: string; // free text from the eparchy guidance
  specialDays: FastingSpecialDay[];
  isActive: boolean;
  createdBy?: string;
  updatedAt?: Date;
}

export interface FastingDayInfo {
  period: FastingPeriod;
  rule: FastingRule;
  isSpecialDay: boolean;
  specialDayNote?: string;
  dayNumber: number; // 1-based day within the period
  totalDays: number;
}

export const FASTING_RULE_CONFIG: Record<
  FastingRule,
  { label: string; shortLabel: string; icon: string; color: string; description: string }
> = {
  STRICT: {
    label: 'Строг пост (без масло)',
    shortLabel: 'Строг пост',
    icon: 'sprout',
    color: '#6B4E9B',
    description: 'без масло и вино',
  },
  WITH_OIL: {
    label: 'Пост со масло',
    shortLabel: 'Со масло',
    icon: 'water',
    color: '#7B8A3E',
    description: 'дозволено масло',
  },
  WINE_OIL: {
    label: 'Вино и масло',
    shortLabel: 'Вино и масло',
    icon: 'glass-wine',
    color: '#A3622E',
    description: 'дозволено вино и масло',
  },
  FISH: {
    label: 'Дозволена риба',
    shortLabel: 'Риба',
    icon: 'fish',
    color: '#1B3661',
    description: 'дозволена риба, вино и масло',
  },
};

// The four yearly fasts as admin presets — names and typical rules only;
// the admin always sets the actual dates.
export const FASTING_PRESETS: { name: string; defaultRule: FastingRule }[] = [
  { name: 'Велигденски пост', defaultRule: 'STRICT' },
  { name: 'Петровски пост', defaultRule: 'WITH_OIL' },
  { name: 'Богородичен пост', defaultRule: 'STRICT' },
  { name: 'Божиќен пост', defaultRule: 'WITH_OIL' },
];

const fastingCollection = collection(db, 'fastingPeriods');

const startOfDay = (d: Date): Date => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const getAllFastingPeriods = async (): Promise<FastingPeriod[]> => {
  try {
    const snapshot = await getDocs(fastingCollection);
    return snapshot.docs
      .map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          defaultRule: (data.defaultRule || 'STRICT') as FastingRule,
          weekendRule: (data.weekendRule as FastingRule) || undefined,
          note: data.note || undefined,
          specialDays: (data.specialDays || []).map((s: any) => ({
            date: s.date?.toDate() || new Date(),
            rule: (s.rule || 'FISH') as FastingRule,
            note: s.note || undefined,
          })),
          isActive: data.isActive ?? true,
          createdBy: data.createdBy || undefined,
          updatedAt: data.updatedAt?.toDate() || undefined,
        } as FastingPeriod;
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  } catch (error) {
    console.error('Error loading fasting periods:', error);
    return [];
  }
};

export const saveFastingPeriod = async (period: FastingPeriod): Promise<string> => {
  const docRef = period.id ? doc(fastingCollection, period.id) : doc(fastingCollection);

  await setDoc(docRef, {
    name: period.name,
    startDate: Timestamp.fromDate(startOfDay(period.startDate)),
    endDate: Timestamp.fromDate(startOfDay(period.endDate)),
    defaultRule: period.defaultRule,
    weekendRule: period.weekendRule || null,
    note: period.note || null,
    specialDays: period.specialDays.map(s => ({
      date: Timestamp.fromDate(startOfDay(s.date)),
      rule: s.rule,
      note: s.note || null,
    })),
    isActive: period.isActive,
    createdBy: period.createdBy || auth?.currentUser?.uid || null,
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
};

export const deleteFastingPeriod = async (id: string): Promise<void> => {
  await deleteDoc(doc(fastingCollection, id));
};

// Resolve the effective fasting info for one calendar day, or null when the
// day is not inside any active fasting period.
export const getFastingInfoForDate = (
  date: Date,
  periods: FastingPeriod[]
): FastingDayInfo | null => {
  const day = startOfDay(date);

  for (const period of periods) {
    if (!period.isActive) continue;
    const start = startOfDay(period.startDate);
    const end = startOfDay(period.endDate);
    if (day < start || day > end) continue;

    const special = period.specialDays.find(s => isSameDay(s.date, day));
    const msPerDay = 24 * 60 * 60 * 1000;
    const dayNumber = Math.round((day.getTime() - start.getTime()) / msPerDay) + 1;
    const totalDays = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;

    const dow = day.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const baseRule =
      isWeekend && period.weekendRule ? period.weekendRule : period.defaultRule;

    return {
      period,
      rule: special ? special.rule : baseRule,
      isSpecialDay: !!special,
      specialDayNote: special?.note,
      dayNumber,
      totalDays,
    };
  }

  return null;
};
