export interface Slot {
  id: number;
  date: string;
  display_date: string;
  time: string;
}

export interface Physician {
  id: number;
  name: string;
  specialty: string;
  description: string;   // matches seed.py and DB column name
  rating: number;
  location: string;
  availabilityLabel: string;
  slots: Slot[];
}