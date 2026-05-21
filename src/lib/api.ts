// ─── Raw API types ────────────────────────────────────────────────────────────

export interface ApiProduct {
  code: number;
  name: string;
  category: string;
  price: number;
  currency: string;
  description: string;
  pictures: string[];
  isAvailable: boolean;
  previousValue: number | null;
  stockBalance: number | null;
  wishlist: string;
  color: string;
  size: string;
  brand: string;
  weight: number | null;
  model: string;
  manufacturer: string;
  countryOrigin: string;
}

export interface ApiCategory {
  code: number;
  name: string;
  category: string; // parent name
  children: (ApiCategory | ApiProduct)[];
}

export interface ApiProductsResponse {
  isSuccessful: boolean;
  data: ApiCategory[]; // top-level Super-Parents
  errorMessages: string[] | null;
}

export interface ApiCompany {
  companyCode: string;
  orgOUD: string;
  companyName: string;
  branchName: string;
  industryType: number;
  // there are more fields but these are what we need
}

export interface ApiCompaniesResponse {
  isSuccessful: boolean;
  data: ApiCompany[];
  errorMessages: string[] | null;
}

export interface ApiBranch {
  code: number;
  name: string;
  logo: string | null;
  latitude: number | null;
  longitude: number | null;
  phone1: string | null;
  specificAddress: string | null;
}

export interface ApiCompanyByTin {
  code: number;
  tradeName: string;
  brandName: string;
  tin: string;
  logo: string;
  branches: ApiBranch[];
}

export interface ApiCompanyByTinResponse {
  isSuccessful: boolean;
  data: ApiCompanyByTin;
  errorMessages: string[] | null;
}

export interface CompanyInfo {
  companyCode: number;
  companyName: string;
  brandName: string;
  logo: string;
  tin: string;
  branch: ApiBranch | null;
}

// ─── App types (mirrors menuData.ts) ─────────────────────────────────────────

import { MenuItem, Category, MenuData } from "@/data/menuData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively collect leaf products from the nested category tree */
function collectProducts(
  nodes: (ApiCategory | ApiProduct)[],
  superParentName: string,
  superParentCode: number,
  parentName: string,
  parentCode: number
): MenuItem[] {
  const items: MenuItem[] = [];

  for (const node of nodes) {
    if ("children" in node) {
      items.push(
        ...collectProducts(
          node.children,
          superParentName,
          superParentCode,
          node.name,
          node.code
        )
      );
    } else {
      const product = node as ApiProduct;
      if (!product.isAvailable) continue;
      items.push({
        id: String(product.code),
        name: product.name,
        description: product.description ?? "",
        price: product.price,
        currency: product.currency || "Birr",
        image: product.pictures?.[0] ?? "",
        category: superParentName.toLowerCase().replace(/\s+/g, "-"),
        categoryCode: superParentCode,
        section: parentName,
        sectionCode: parentCode,
      });
    }
  }

  return items;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchMenuData(
  companyCode: string,
  orgOUD: string
): Promise<MenuData> {
  // Call our Next.js proxy route — credentials are added server-side in route.ts
  const url = `/api/menu/${companyCode}/${orgOUD}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error: ${res.status}`);
  }

  const json: ApiProductsResponse = await res.json();
  if (!json.isSuccessful) {
    throw new Error(json.errorMessages?.join(", ") ?? "Unknown API error");
  }

  const allItems: MenuItem[] = [];

  for (const superParent of json.data) {
    allItems.push(
      ...collectProducts(superParent.children, superParent.name, superParent.code, superParent.name, superParent.code)
    );
  }

  // Build categories from super-parents
  const categories: Category[] = [
    { id: "all", name: "All", count: allItems.length },
    ...json.data.map((sp) => {
      const catId = sp.name.toLowerCase().replace(/\s+/g, "-");
      return {
        id: catId,
        name: sp.name,
        count: allItems.filter((i) => i.category === catId).length,
      };
    }),
  ];

  return {
    companyName: "",   // filled by caller
    branchName: "",
    categories,
    items: allItems,
  };
}

export interface ApiTable {
  name: string;
  capacity: number;
}

export interface ApiTablesResponse {
  isSuccessful: boolean;
  data: { tables: ApiTable[] };
  errorMessages: string[] | null;
}

export interface LineItemRequest {
  code: number;                  // companyCode
  promoCodeRequest: null;
  servingMethodType: string;     // "IN_HOUSE_DINING" | "DELIVERY" | "PICKUP"
  lineItems: {
    article: number;
    name: string;
    unitAmount: number;
    quantity: number;
    parent: null;
    uom: number;
    note: string;
  }[];
}

export interface LineItemResult {
  lineItems: {
    article: number;
    name: string;
    unitAmount: number;
    quantity: number;
    taxableAmount: number;
    note: string | null;
    parentId: number | null;
    lineItemId: number;
  }[];
  extraCharge: Record<string, number>;
  grandTotal: number;
}

export interface LineItemResponse {
  isSuccessful: boolean;
  data: LineItemResult;
  errorMessages: string[] | null;
}

export async function calculateLineItems(
  companyCode: number,
  branchCode: number,
  items: { id: string; name: string; price: number; quantity: number }[]
): Promise<LineItemResult> {
  const body: LineItemRequest = {
    code: companyCode,
    promoCodeRequest: null,
    servingMethodType: "IN_HOUSE_DINING",
    lineItems: items.map((item) => ({
      article: Number(item.id),
      name: item.name,
      unitAmount: item.price,
      quantity: item.quantity,
      parent: null,
      uom: 0,
      note: "",
    })),
  };

  const res = await fetch("/api/lineitem/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Calculate API error: ${res.status}`);
  }

  const json: LineItemResponse = await res.json();
  if (!json.isSuccessful) {
    throw new Error(json.errorMessages?.join(", ") ?? "Calculation failed");
  }

  return json.data;
}

export interface PaymentOption {
  code: string;
  accountNo: string;
  operationMode: number;
  balanceAmount: number | null;
  paymentProcessorName: string;
  paymentProcessorUnitName: string;
  paymentProcessorConsigneeId: number;
  paymentProcessorConsigneeUnit: number;
  paymentProcessorSpecialization: number;
  paymentProcessorImage: string;
  paymentProcessorUnitImage: string;
}

export interface AuthorizationRequest {
  userMobileNumber: string;
  operationMode: number;
  supplierConsigneeId: number;   // companyCode
  supplierConsigneeUnit: number; // branchCode
  paymentProcessorConsigneeId: number;
  paymentProcessorConsigneeUnit: number;
  transactionId: string;
  amount: number;
  additionalParameters: { referenceNumber: string };
}

export interface AuthorizationResult {
  isSuccessful: boolean;
  errorMessages: string[] | null;
  additionalParameters: {
    type: string;
    isAsyncMode: string;
    RedirectUrl?: string;
    redirectUrl?: string;
  } | null;
  transactionReference: string | null;
}

export async function authorizePayment(
  req: AuthorizationRequest
): Promise<AuthorizationResult> {
  const res = await fetch("/api/payment/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Authorization API error: ${res.status}`);
  }

  return res.json();
}

export interface VoucherSaveRequest {
  code: string;
  notifyInvitee: boolean;
  inviteeName: null;
  inviteePhone: null;
  buyerTin: null;
  buyerCompanyName: null;
  companyCode: number;
  branchCode: number;
  industryType: number;
  lineItems: {
    name: string;
    article: number;
    unitAmount: number;
    quantity: number;
    parent: null;
    uom: number;
    note: string;
  }[];
  paymentMethod: string;
  transactionReference: string;
  paymentInfo: {
    type: string;
    isAsyncMode: string;
    paymentType: null;
    paymentTransactionRequest: {
      userMobileNumber: string;
      operationMode: number;
      supplierConsigneeId: number;
      supplierConsigneeUnit: number;
      paymentProcessorConsigneeId: number;
      paymentProcessorConsigneeUnit: number;
      transactionId: string;
      amount: number;
      additionalParameters: { referenceNumber: string };
      pin: string;
    };
  };
  latitude: number;
  longitude: number;
  platform: string;
  deviceId: string;
  promoDetail: null;
  onSuccess: {
    firstName: string;
    company: string;
    branch: string;
    nightCount: null;
    seats: null;
    movieName: null;
    movieDimension: null;
    hallName: null;
    time: null;
    date: null;
    picture: null;
    scheduleDateTime: null;
  };
  servingMethod: {
    address: null;
    scheduleDateTime: null;
    servingMethodType: string;
    specificAddressName: null;
    specialRequest: string | null;
    selectedTableName: string | null;
  };
  deliveryOrderRequest: null;
  ActivityLog: {
    platform: string;
    latitude: number;
    longitude: number;
    appVersion: string;
    code: string;
    langLocale: string;
  };
}

export interface LineItem {
  name: string;
  article: number;
  unitAmount: number;
  quantity: number;
  uom: number;
  note: string;
}

export interface PaymentInfo {
  type: string; // "ussdpush" | "otp" | "ussd" | "card"
  isAsyncMode: string; // "true" | "false"
  paymentTransactionRequest: PaymentTransactionRequest;
}

export interface PaymentTransactionRequest {
  paymentType: any | null;
  userMobileNumber: string;
  operationMode: number;
  supplierConsigneeId: number;
  supplierConsigneeUnit: number;
  paymentProcessorConsigneeId: number;
  paymentProcessorConsigneeUnit: number;
  amount: number;
  transactionId: string;
  additionalParameters: {
    referenceNumber: string;
  };
  pin: string;
}

export interface ServingMethod {
  branchCode: number;
  branchName: string;
  deliveryMethod: any | null;
  address: any | null;
  scheduleDateTime: any | null;
  servingMethodType: string; // e.g. "IN_HOUSE_DINING"
  specificAddressName: any | null;
  selectedTableName: string;
}

export interface ActivityLog {
  code: string;
  target: string;
  platform: string;
  latitude: number;
  longitude: number;
  appVersion: string;
}

export interface OnSuccess {
  firstName: string;
  company: string;
  branch: string;
  nightCount: number | null;
  seats: number | null;
  movieName: string | null;
  movieDimension: string | null;
  hallName: string | null;
  time: string;
  date: string; // ISO Date String
  picture: string | null;
  scheduleDateTime: string | null;
}

export async function saveVoucher(req: VoucherSaveRequest): Promise<{ isSuccessful: boolean; errorMessages: string[] | null; transactionReference: string | null; voucherCode?: string }> {


  // console.log("--- VOUCHER OBJECT SHAPE ---");
  // console.log(JSON.stringify(req, null, 2));
  // console.log("----------------------------");


  const res = await fetch("/api/voucher/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Voucher save error: ${res.status}`);
  }

  return res.json();

  // return {
  //   isSuccessful: false,
  //   errorMessages: null,
  //   transactionReference: "MOCK-TX-REF-12345"
  // };
}

export async function fetchPaymentOptions(
  phoneNumber: string,
  companyCode: number,
  branchCode: number | string
): Promise<PaymentOption[]> {
  const params = new URLSearchParams({
    code: phoneNumber,
    companyCode: String(companyCode),
    branchCode: String(branchCode),
  });

  const res = await fetch(`/api/payment/options?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Payment options API error: ${res.status}`);
  }

  const json = await res.json();
  if (!json.isSuccessful) {
    throw new Error(json.errorMessages?.join(", ") ?? "Failed to fetch payment options");
  }

  return json.data as PaymentOption[];
}

export interface TransactionResolutionResult {
  isSuccessful: boolean;
  errorMessages: string[] | null;
  additionalParameters: Record<string, string> | null;
  transactionReference: string | null;
}

export async function checkTransactionResolution(
  req: AuthorizationRequest & { pin?: string }
): Promise<TransactionResolutionResult> {
  const res = await fetch("/api/payment/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Check resolution error: ${res.status}`);
  }

  return res.json();
}

export async function generateTransactionId(
  phoneNumber: string
): Promise<string> {
  const res = await fetch(
    `/api/payment/transaction?code=${encodeURIComponent(phoneNumber)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Transaction API error: ${res.status}`);
  }

  const json = await res.json();
  if (!json.isSuccessful) {
    throw new Error(json.errorMessages?.join(", ") ?? "Failed to generate transaction");
  }

  return json.data as string;
}

export async function fetchTables(
  companyCode: string,
  branchCode: string
): Promise<ApiTable[]> {
  const res = await fetch(`/api/tables/${companyCode}/${branchCode}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Tables API error: ${res.status}`);
  }
  const json: ApiTablesResponse = await res.json();
  if (!json.isSuccessful) {
    throw new Error(json.errorMessages?.join(", ") ?? "Unknown API error");
  }
  return json.data?.tables ?? [];
}

export async function fetchCompanyByTin(
  tin: string,
  branchCode: string
): Promise<CompanyInfo> {
  // 1. Fetch the raw payload (which contains the array of all companies)
  const res = await fetch(`/api/company/${tin}`, { cache: "no-store" });
  
  const json: any = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error ?? `API connection error: ${res.status}`);
  }

  // 2. Ensure the upstream data array exists
  const companyList = json.data;
  if (!Array.isArray(companyList)) {
    throw new Error("Invalid data format: Expected a list of companies.");
  }

  // 3. Locate the specific company by its TIN
  const company = companyList.find((c: any) => c.tin === tin);
  if (!company) {
    throw new Error(`Company with TIN ${tin} not found.`);
  }

  // 4. Locate the target branch within that specific company
  const branch = 
    company.branches?.find((b: any) => String(b.code) === branchCode) ?? 
    company.branches?.[0] ?? 
    null;

  // 5. Construct and return the mapped CompanyInfo object
  return {
    companyCode: company.code,
    companyName: company.tradeName,
    brandName: company.brandName,
    logo: company.logo,
    tin: company.tin,
    branch,
  };
}

export interface ItemModifier {
  id: number;
  pointer: number;       // matches item's article code
  reference: number;     // group key for normal modifiers
  description: string | null;
  category: number;      // 2068 = payable, 2066 = normal/free
  article: number | null;
  name: string | null;
  uom: number | null;
  defaultTax: number | null;
  defaultValue: number | null; // price
}

export const MODIFIER_POINTER_ARTICLE  = 752; // modifier applies to a specific item
export const MODIFIER_POINTER_CATEGORY = 701; // modifier applies to a category/super-category

export async function fetchModifiers(
  companyCode: string,
  branchCode: string
): Promise<ItemModifier[]> {
  const res = await fetch(`/api/modifiers/${companyCode}/${branchCode}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Modifiers API error: ${res.status}`);
  }
  const json = await res.json();
  if (!json.isSuccessful) {
    throw new Error(json.errorMessages?.join(", ") ?? "Failed to fetch modifiers");
  }
  return json.data as ItemModifier[];
}

export interface VoucherDetail {
  lineItems: { article: number; name: string; unitAmount: number; quantity: number; taxableAmount: number; note: string; }[];
  extraCharge: Record<string, number>;
  grandTotal: number;
  extraInformation: Record<string, string>;
  extraData: { voucherId: number; tin: string; isBilled: boolean; restaurant: string; "status:": string; };
  issuedDate: string;
  branchCode: number;
  promoDetail: null;
  phoneNumber: string;
  companyName: string;
  voucherCode: string;
}

export async function fetchVoucherDetail(
  voucherCode: string,
  companyCode: number,
  industryType = 1992
): Promise<VoucherDetail> {
  const params = new URLSearchParams({
    voucherCode,
    companyCode: String(companyCode),
    industryType: String(industryType),
  });
  const res = await fetch(`/api/voucher/detail?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Detail API error: ${res.status}`);
  }
  const json = await res.json();
  if (!json.isSuccessful) throw new Error(json.errorMessages?.join(", ") ?? "Failed to fetch detail");
  return json.data as VoucherDetail;
}

export interface VoucherHistory {
  companyCode: number;
  companyName: string;
  branchCode: number;
  branchName: string;
  industryType: number;
  voucherCode: string;
  issuedDate: string;
  grandTotal: number;
  logo: string;
  tin: string;
}

export async function fetchVoucherHistory(
  phoneNumber: string,
  page = 1
): Promise<VoucherHistory[]> {
  const res = await fetch(
    `/api/voucher/history?code=${encodeURIComponent(phoneNumber)}&page=${page}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `History API error: ${res.status}`);
  }
  const json = await res.json();
  if (!json.isSuccessful) {
    throw new Error(json.errorMessages?.join(", ") ?? "Failed to fetch history");
  }
  return json.data as VoucherHistory[];
}

// fetchCompanyInfo removed — use fetchCompanyByTin instead
