import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Main: undefined;
  Admin: undefined;
};

export type MainTabParamList = {
  Calendar: undefined;
  'Add Event': undefined;
  Settings: undefined;
};

export type AdminStackParamList = {
  AdminLogin: undefined;
  AdminDashboard: undefined;
  ManageCalendar: undefined;
  ManageLocations: {
    eventId?: string;
  };
  SpecialEvents: undefined;
  AddEvent: undefined;
  EditEvent: {
    eventId: string;
  };
  EventDetails: {
    eventId: string;
  };
  LocationPicker: {
    onSelect: (location: Location) => void;
  };
};

export type Location = {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  directions?: string;
  parkingInfo?: string;
  facilities?: string[];
};

export type SpecialEvent = {
  id: string;
  type: 'PICNIC' | 'GATHERING' | 'CELEBRATION';
  name: string;
  date: Date;
  location: Location;
  description: string;
  maxAttendees?: number;
  requirements?: string[];
  contactPerson?: {
    name: string;
    phone: string;
    email: string;
  };
  registrationDeadline?: Date;
  price?: {
    amount: number;
    currency: string;
    includes: string[];
  };
}; 