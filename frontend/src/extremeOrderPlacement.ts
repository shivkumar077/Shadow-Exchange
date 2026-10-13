export const EXTREME_CAT_DIALOGUES = [
  "Order successfully dispatched to the void. I watched the bits leave the socket. Don't look at me if it fills at the top.",
  "I pressed the submit paw for you. Your limit order is now resting in the book. Awaiting liquidity.",
  "Slip-sliding into the queue. May the market makers tremble and your execution be swift.",
  "Your order has entered the dark pool. I gave the matching engine a very threatening glare.",
  "Logged and loaded. Whether it fills today or gathers digital dust is between you and the exchange.",
  "Order registered in the book. Remember: paper gains are fleeting, but kibble is eternal.",
];

export function getExtremeOrderDialogue(orderId: number, dialogueIndex?: number): string {
  const idx = (dialogueIndex ?? orderId) % EXTREME_CAT_DIALOGUES.length;
  return EXTREME_CAT_DIALOGUES[Math.abs(idx)];
}

export function formatExtremeStatusLabel(status: string): { label: string; isPending: boolean } {
  const isPending = status !== "FILLED";
  return {
    label: isPending ? "PENDING IN ORDER BOOK" : "FILLED",
    isPending,
  };
}
