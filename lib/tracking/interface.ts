export type ShipmentStatus =
  | "pending"
  | "received"
  | "departed_origin"
  | "in_transit"
  | "customs"
  | "arrived_destination"
  | "delivered"
  | "exception"
  | "cancelled"
  | "RECEIVED"
  | "DEPARTED"
  | "CUSTOMS"
  | "DELIVERED";

export interface TrackingEvent {
  status: ShipmentStatus;
  description: string;
  location?: string;
  timestamp: Date;
}

export interface TrackingResult {
  trackingNumber: string;
  status: ShipmentStatus;
  carrier: string;
  events: TrackingEvent[];
  lastSyncAt: Date;
}

export abstract class TrackingProvider {
  abstract getTrackingInfo(trackingNumber: string): Promise<TrackingResult>;
}
