export type ShipmentStatus =
  | "pending"
  | "received"
  | "departed_origin"
  | "in_transit"
  | "customs"
  | "arrived_destination"
  | "out_for_delivery"
  | "delivered"
  | "delivery_issue"
  | "return_in_progress"
  | "on_hold"
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
