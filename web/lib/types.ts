export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export interface Report {
  id: string;
  reason: string;
  spot: {
    id: string;
    name: string;
  };

}

export interface Route {
  id: string;
  name: string;
  description?: string;
  spots: RouteSpot[];
}

export interface RouteSpot {
  routeId: string;
  spotId: string;
  order: number;
  spot: Spot;
}
