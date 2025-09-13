export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  spots: { order: number; spot: Spot }[];
}
