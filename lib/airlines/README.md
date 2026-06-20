# Airline reference snapshot

`iata-member-airlines.json` is generated from IATA's public airline-member
directory. It is a dated operational convenience list, not the complete
subscription Airline Coding Database.

Refresh it with:

```sh
npm run airlines:refresh
```

Review the generated diff, confirm the record count remains plausible, run the
airline and shipment tests, and commit the snapshot together with its source
date. Portal requests never scrape or call IATA.
