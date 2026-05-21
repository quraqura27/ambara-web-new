import { TrackingProvider, TrackingResult, ShipmentStatus } from "./interface";

export class MockTrackingProvider extends TrackingProvider {
  async getTrackingInfo(trackingNumber: string): Promise<TrackingResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const statuses: ShipmentStatus[] = ['pending', 'in_transit', 'delivered', 'exception'];
    
    // Deterministic status based on tracking number for consistent mocking
    const charCodeSum = trackingNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const status = statuses[charCodeSum % statuses.length];

    const events = [
      {
        status: 'pending' as ShipmentStatus,
        description: 'Electronic information received',
        location: 'Jakarta, ID',
        timestamp: new Date(Date.now() - 86400000 * 3),
      },
      {
        status: 'in_transit' as ShipmentStatus,
        description: 'Picked up by courier',
        location: 'Jakarta, ID',
        timestamp: new Date(Date.now() - 86400000 * 2),
      }
    ];

    if (status === 'delivered') {
      events.push({
        status: 'delivered' as ShipmentStatus,
        description: 'Delivered to recipient',
        location: 'Singapore, SG',
        timestamp: new Date(Date.now() - 86400000),
      });
    } else if (status === 'exception') {
      events.push({
        status: 'exception' as ShipmentStatus,
        description: 'Address not found - Contacting recipient',
        location: 'Unknown',
        timestamp: new Date(Date.now() - 86400000),
      });
    }

    return {
      trackingNumber,
      status,
      carrier: 'Ambara Globaltrans',
      events: events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      lastSyncAt: new Date(),
    };
  }
}

export const trackingProvider = new MockTrackingProvider();
