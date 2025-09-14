export interface SpotPhoto {
  id: string;
  url: string;
}

export interface SpotTag {
  id: string;
  name: string;
}

export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  facilities?: Record<string, boolean>;
  photos?: SpotPhoto[];
  tags?: SpotTag[];
  voteScore?: number;
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
