export type ResourceLog = {
  id: string;
  resource_type: "water" | "electricity" | "fuel" | "waste" | string;
  amount: number;
  subtype: string | null;
};

export type Batch = {
  id: string;
  batch_id: string;
  product_type: string;
  units: number;
  start_date: string;
  raw_material: string | null;
  completed: boolean;
};

export type Totals = {
  water: number;
  electricity: number;
  fuel: number;
  waste: number;
  waterPerUnit: number;
  electricityPerUnit: number;
  fuelPerUnit: number;
  wastePerUnit: number;
  usedTanker: boolean;
  worstWasteDisposal: "composted" | "recycler" | "landfill" | "unknown" | "none";
};

export function aggregate(batch: Batch, logs: ResourceLog[]): Totals {
  const sum = (t: string) =>
    logs.filter((l) => l.resource_type === t).reduce((a, b) => a + Number(b.amount || 0), 0);
  const water = sum("water");
  const electricity = sum("electricity");
  const fuel = sum("fuel");
  const waste = sum("waste");
  const units = Math.max(1, batch.units || 1);
  const usedTanker = logs.some(
    (l) => l.resource_type === "water" && (l.subtype || "").toLowerCase() === "tanker",
  );
  const wasteDisposals = logs
    .filter((l) => l.resource_type === "waste")
    .map((l) => (l.subtype || "unknown").toLowerCase());
  const rank = { landfill: 3, unknown: 3, recycler: 2, composted: 1, none: 0 } as Record<string, number>;
  let worst: Totals["worstWasteDisposal"] = wasteDisposals.length ? "composted" : "none";
  for (const d of wasteDisposals) {
    const k = d === "landfill" || d === "unknown" ? d : d === "recycler" ? "recycler" : "composted";
    if ((rank[k] ?? 0) > (rank[worst] ?? 0)) worst = k as Totals["worstWasteDisposal"];
  }
  return {
    water,
    electricity,
    fuel,
    waste,
    waterPerUnit: water / units,
    electricityPerUnit: electricity / units,
    fuelPerUnit: fuel / units,
    wastePerUnit: waste / units,
    usedTanker,
    worstWasteDisposal: worst,
  };
}

export type Deduction = { label: string; value: number; detail: string };

export function calculateScore(batch: Batch, logs: ResourceLog[]) {
  const t = aggregate(batch, logs);
  const deductions: Deduction[] = [];

  // Water per unit > 50: -1 per 10L above, max 20
  let waterDed = 0;
  if (t.waterPerUnit > 50) {
    waterDed = Math.min(20, Math.floor((t.waterPerUnit - 50) / 10));
  }
  deductions.push({
    label: "Water intensity",
    value: waterDed,
    detail: `${t.waterPerUnit.toFixed(1)} L/unit (threshold 50)`,
  });

  // Electricity per unit > 2: -1 per 0.5 kWh above, max 20
  let elecDed = 0;
  if (t.electricityPerUnit > 2) {
    elecDed = Math.min(20, Math.floor((t.electricityPerUnit - 2) / 0.5));
  }
  deductions.push({
    label: "Electricity intensity",
    value: elecDed,
    detail: `${t.electricityPerUnit.toFixed(2)} kWh/unit (threshold 2)`,
  });

  // Fuel: any use = -10
  const fuelDed = t.fuel > 0 ? 10 : 0;
  deductions.push({
    label: "Fossil fuel",
    value: fuelDed,
    detail: t.fuel > 0 ? `${t.fuel.toFixed(1)} units used` : "Zero fuel",
  });

  // Waste disposal
  let wasteDed = 0;
  if (t.worstWasteDisposal === "landfill" || t.worstWasteDisposal === "unknown") wasteDed = 15;
  else if (t.worstWasteDisposal === "recycler") wasteDed = 5;
  deductions.push({
    label: "Waste disposal",
    value: wasteDed,
    detail:
      t.worstWasteDisposal === "none"
        ? "No waste logged"
        : `Worst path: ${t.worstWasteDisposal}`,
  });

  // Tanker water
  const tankerDed = t.usedTanker ? 10 : 0;
  deductions.push({
    label: "Tanker water",
    value: tankerDed,
    detail: t.usedTanker ? "Tanker source used" : "Municipal / borewell only",
  });

  const total = deductions.reduce((a, b) => a + b.value, 0);
  const score = Math.max(0, Math.min(100, 100 - total));
  return { score, deductions, totals: t };
}

export function observation(
  curr: { totals: Totals },
  prev: { totals: Totals } | null,
  productType: string,
): string {
  if (!prev) return `First ${productType} batch logged. Future batches will compare against this baseline.`;
  const diff = ((curr.totals.waterPerUnit - prev.totals.waterPerUnit) / Math.max(0.01, prev.totals.waterPerUnit)) * 100;
  if (Math.abs(diff) < 5) {
    return `Water consumption per unit is stable vs your last ${productType} batch (${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%).`;
  }
  if (diff > 0) {
    return `Water consumption per unit increased ${diff.toFixed(0)}% compared to your last ${productType} batch. Check if the dyeing or wash cycle changed.`;
  }
  return `Water consumption per unit decreased ${Math.abs(diff).toFixed(0)}% compared to your last ${productType} batch. Good — verify the saving is repeatable.`;
}

export const PRODUCT_TYPES = [
  "garment",
  "leather goods",
  "food processing",
  "ceramic",
  "paper",
  "other",
];