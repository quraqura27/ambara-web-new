export const quoteStatusValues = ["new", "reviewing", "quoted", "won", "lost", "closed"] as const;

export type QuoteStatus = (typeof quoteStatusValues)[number];
