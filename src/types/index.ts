export type UserRole = "ADMIN" | "EXECUTIVE" | "COMPANY" | "CREATOR" | "CLIENT";
export type AccountType = "ORGANIZATION" | "PERSON" | "INTERNAL";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type CampaignStatus = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
export type AdStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "PAUSED" | "EXPIRED";
export type ScreenStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE" | "RESERVED";
export type ScreenType = "LED_INDOOR" | "LED_OUTDOOR" | "LCD" | "PROJECTION" | "INTERACTIVE";
export type AdFormat = "IMAGE" | "VIDEO" | "HTML5" | "INTERACTIVE";

/* Multi-tenant types — single-owner model.
 *
 * BelaBlaze no longer has members, invitations or per-org roles. The
 * `OrgRole`, `OrganizationMember` and `Invitation` types that used to
 * live here have been removed. The Prisma schema still carries the
 * tables/enums via @default for legacy data; nothing in the app
 * reads them. */
export type WorkspaceType = "PRODUCTION" | "STAGING" | "TEST";
export type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";
export type ScheduleStatus = "SCHEDULED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CONFLICT";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
  ownerId: string;
  brandColor?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAssetDTO {
  id: string;
  organizationId: string;
  uploadedById: string;
  type: MediaType;
  name: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  url: string;
  thumbnailUrl?: string | null;
  tags: string[];
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  position?: string;
  companyId?: string;
  company?: Client;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  industry?: string;
  website?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  isActive: boolean;
  creditLimit: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
  _count?: { campaigns: number; users: number };
}

export interface Screen {
  id: string;
  name: string;
  code: string;
  type: ScreenType;
  status: ScreenStatus;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  width: number;
  height: number;
  resolutionWidth: number;
  resolutionHeight: number;
  dailyTraffic: number;
  pricePerSecond: number;
  isActive: boolean;
  orientation: string;
  thumbnail?: string;
  lastPingAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  clientId: string;
  userId: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  targetCities: string[];
  impressionsGoal?: number;
  impressions: number;
  conversions: number;
  engagements: number;
  client?: Client;
  ads?: Ad[];
  createdAt: string;
  updatedAt: string;
}

export interface Ad {
  id: string;
  organizationId?: string | null;
  title: string;
  description?: string;
  status: AdStatus;
  format: AdFormat;
  campaignId: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  ctaUrl?: string;
  ctaText?: string;
  qrUrl?: string;
  qrEnabled: boolean;
  rejectionNote?: string;
  impressions: number;
  clicks: number;
  qrScans: number;
  engagements: number;
  ctr: number;
  startDate?: string;
  endDate?: string;
  campaign?: Campaign;
  createdAt: string;
  updatedAt: string;
}

export interface Metric {
  id: string;
  adId: string;
  screenId?: string;
  impressions: number;
  clicks: number;
  qrScans: number;
  engagements: number;
  dwellTime: number;
  date: string;
  hour?: number;
}

export interface Log {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  createdAt: string;
  user?: User;
}

export interface DashboardMetrics {
  totalImpressions: number;
  impressionsDelta: number;
  activeCampaigns: number;
  campaignsDelta: number;
  totalRevenue: number;
  revenueDelta: number;
  avgEngagement: number;
  engagementDelta: number;
  screensOnline: number;
  screensTotal: number;
  pendingApprovals: number;
  qrScans: number;
  qrScansDelta: number;
}

export interface ChartDataPoint {
  date: string;
  impressions: number;
  clicks: number;
  engagements: number;
  qrScans: number;
  revenue: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  city?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
