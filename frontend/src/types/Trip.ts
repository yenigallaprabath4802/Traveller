export interface Trip {
  _id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  travelers?: number;
  status?: 'planned' | 'active' | 'completed' | 'cancelled';
  title?: string;
  totalExpenses?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedTrip {
  _id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  duration: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  savedAt: string;
  totalCost: number;
  itinerary: Array<{
    day: number;
    theme: string;
    activities: any[];
  }>;
  title?: string;
}