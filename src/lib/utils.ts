import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, compact = false): string {
  if (compact) {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  }
  return new Intl.NumberFormat("es-CO").format(num);
}

export function formatCurrency(amount: number, currency = "COP"): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date, pattern = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: es });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

export function getDeltaColor(delta: number): string {
  if (delta > 0) return "text-green-400";
  if (delta < 0) return "text-red-400";
  return "text-gray-400";
}

export function getDeltaSign(delta: number): string {
  if (delta > 0) return "+";
  return "";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function generateMockMetrics(days = 30): Array<{
  date: string;
  impressions: number;
  clicks: number;
  engagements: number;
  qrScans: number;
  revenue: number;
}> {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: format(d, "dd MMM", { locale: es }),
      impressions: Math.floor(Math.random() * 50000) + 10000,
      clicks: Math.floor(Math.random() * 2000) + 200,
      engagements: Math.floor(Math.random() * 5000) + 1000,
      qrScans: Math.floor(Math.random() * 800) + 50,
      revenue: Math.floor(Math.random() * 5000000) + 500000,
    });
  }
  return data;
}

export function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    ACTIVE: { label: "Activo", color: "text-green-400", bg: "bg-green-400/10", dot: "bg-green-400" },
    DRAFT: { label: "Borrador", color: "text-gray-400", bg: "bg-gray-400/10", dot: "bg-gray-400" },
    PENDING_REVIEW: { label: "En revisión", color: "text-yellow-400", bg: "bg-yellow-400/10", dot: "bg-yellow-400" },
    PENDING_APPROVAL: { label: "Pendiente", color: "text-yellow-400", bg: "bg-yellow-400/10", dot: "bg-yellow-400" },
    APPROVED: { label: "Aprobado", color: "text-green-400", bg: "bg-green-400/10", dot: "bg-green-400" },
    REJECTED: { label: "Rechazado", color: "text-red-400", bg: "bg-red-400/10", dot: "bg-red-400" },
    PAUSED: { label: "Pausado", color: "text-orange-400", bg: "bg-orange-400/10", dot: "bg-orange-400" },
    COMPLETED: { label: "Completado", color: "text-blue-400", bg: "bg-blue-400/10", dot: "bg-blue-400" },
    CANCELLED: { label: "Cancelado", color: "text-red-400", bg: "bg-red-400/10", dot: "bg-red-400" },
    EXPIRED: { label: "Expirado", color: "text-gray-400", bg: "bg-gray-400/10", dot: "bg-gray-400" },
    ONLINE: { label: "En línea", color: "text-green-400", bg: "bg-green-400/10", dot: "bg-green-400" },
    OFFLINE: { label: "Sin conexión", color: "text-red-400", bg: "bg-red-400/10", dot: "bg-red-400" },
    MAINTENANCE: { label: "Mantenimiento", color: "text-orange-400", bg: "bg-orange-400/10", dot: "bg-orange-400" },
    RESERVED: { label: "Reservado", color: "text-blue-400", bg: "bg-blue-400/10", dot: "bg-blue-400" },
    INACTIVE: { label: "Inactivo", color: "text-gray-400", bg: "bg-gray-400/10", dot: "bg-gray-400" },
    SUSPENDED: { label: "Suspendido", color: "text-red-400", bg: "bg-red-400/10", dot: "bg-red-400" },
  };
  return configs[status] ?? { label: status, color: "text-gray-400", bg: "bg-gray-400/10", dot: "bg-gray-400" };
}

export function getFormatConfig(format: string) {
  const configs: Record<string, { label: string; icon: string }> = {
    IMAGE: { label: "Imagen", icon: "🖼️" },
    VIDEO: { label: "Video", icon: "🎬" },
    HTML5: { label: "HTML5", icon: "💻" },
    INTERACTIVE: { label: "Interactivo", icon: "👆" },
  };
  return configs[format] ?? { label: format, icon: "📄" };
}

export function getScreenTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LED_INDOOR: "LED Interior",
    LED_OUTDOOR: "LED Exterior",
    LCD: "LCD",
    PROJECTION: "Proyección",
    INTERACTIVE: "Interactivo",
  };
  return labels[type] ?? type;
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

export function calculateROAS(revenue: number, spend: number): number {
  if (spend === 0) return 0;
  return revenue / spend;
}
