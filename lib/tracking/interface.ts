export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'exception';

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
