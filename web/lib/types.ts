export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export interface RouteSpot {
  order: number;
  spot: Spot;
}

export interface Route {
  id: string;
  name: string;
  description?: string | null;
  spots: RouteSpot[];
}

export interface Report {
  id: string;
  reason: string;
  spot: {
    id: string;
    name: string;
  };

}
