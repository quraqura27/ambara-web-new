function stringValue(value) {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function numberValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const text = String(value ?? '').replace(/,/g, '').trim();
  if (!text) {
    return null;
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPublicShipment(shipment) {
  const source = shipment || {};

  return {
    tracking_number: stringValue(source.tracking_number),
    internal_tracking_no: stringValue(source.internal_tracking_no),
    legacy_tracking_number: stringValue(source.legacy_tracking_number),
    title: stringValue(source.title),
    status: stringValue(source.status),
    origin: stringValue(source.origin),
    destination: stringValue(source.destination),
    service_type: stringValue(source.service_type),
    goods_description: stringValue(source.goods_description),
    origin_iata: stringValue(source.origin_iata),
    destination_iata: stringValue(source.destination_iata),
    total_pcs: numberValue(source.total_pcs),
    weight_kg: numberValue(source.weight_kg),
    chargeable_weight: numberValue(source.chargeable_weight),
    cargo_type: stringValue(source.cargo_type),
    commodity: stringValue(source.commodity),
    created_at: stringValue(source.created_at),
    updated_at: stringValue(source.updated_at),
  };
}

function toPublicEvent(event) {
  const source = event || {};

  return {
    status: stringValue(source.status),
    label: stringValue(source.label),
    description: stringValue(source.description),
    location: stringValue(source.location),
    event_time: stringValue(source.event_time || source.timestamp),
  };
}

function toPublicTrackingResponse(shipment, events) {
  return {
    shipment: toPublicShipment(shipment),
    events: Array.isArray(events) ? events.map(toPublicEvent) : [],
  };
}

module.exports = {
  toPublicEvent,
  toPublicShipment,
  toPublicTrackingResponse,
};
