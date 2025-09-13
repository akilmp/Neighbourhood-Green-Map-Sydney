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
