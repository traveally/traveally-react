/**
 * Public Traveally API Client Types & Interfaces
 */

export interface TraveallyApiConfig {
  baseUrl?: string;
  domain?: string;
  organizationId?: string;
  authToken?: string | null;
  onTokenExpired?: () => void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

// ── Package & Catalog Types ─────────────────────────────────
export interface TravelPackage {
  id: string;
  package_name: string;
  package_subtitle?: string;
  slug: string;
  price: number;
  duration?: string;
  destination: string;
  description?: string;
  group_size?: string;
  tags?: string[];
  images?: string[];
  main_image?: string;
  banner_image?: string;
  gallery?: Array<string | { url: string; caption?: string }>;
  rating?: number;
  reviews_count?: number;
  duration_days?: number;
  tour_type?: string;
  status?: string;
  is_featured?: boolean;
  category?: string;
  currency?: string;
  hotel_stars?: number;
  latitude?: number | null;
  longitude?: number | null;
  itinerary?: Array<{ day: number; title: string; description: string; [key: string]: any }>;
  included?: string[];
  not_included?: string[];
  things_to_carry?: string[];
  cancellation_policy?: string;
  know_before_you_go?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  table_data?: any[];
  pricing_table?: any[];
  translations?: any[];
  pricing?: any[];
  [key: string]: any;
}

export interface TravelCollection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type?: string;
  package_ids: string[];
  is_active: boolean;
  packages?: TravelPackage[];
}

export interface TravelActivity {
  id: string;
  name: string;
  slug: string;
  description?: string;
  images?: string[];
  price?: number;
  duration?: string;
  location?: string;
  [key: string]: any;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  author_name?: string;
  published_at?: string;
  tags?: string[];
  reading_time_minutes?: number;
  [key: string]: any;
}

export interface CustomerReview {
  id: string;
  package_id?: string;
  package_name?: string;
  customer_name: string;
  rating: number;
  review_text: string;
  photos?: string[];
  verified_booking?: boolean;
  created_at: string;
}

// ── Customer Authentication & Profile Types ─────────────────
export interface CustomerUser {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  country?: string;
  city?: string;
  created_at?: string;
}

export interface AuthSessionResponse {
  success: boolean;
  message?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: CustomerUser;
  customer?: CustomerUser;
}

export interface BookingRecord {
  id: string;
  booking_reference: string;
  package_id: string;
  package_name: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  travel_date: string;
  pax_count: number;
  total_amount: number;
  paid_amount: number;
  created_at: string;
  [key: string]: any;
}

// ── Forms & Lead Capture ────────────────────────────────────
export interface FormSubmissionPayload {
  form_type?: string; // "lead" | "contact" | "inquiry" | "custom"
  name: string;
  email?: string;
  phone?: string;
  destination?: string;
  dates?: string;
  pax?: number;
  budget?: string;
  notes?: string;
  source?: string;
  custom_fields?: Record<string, any>;
  [key: string]: any;
}

// ── Payment Checkout ────────────────────────────────────────
export interface PaymentOrderParams {
  package_id: string;
  amount: number;
  currency?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes?: Record<string, any>;
}

export interface PaymentVerifyParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
