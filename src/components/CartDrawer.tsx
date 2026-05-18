"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./CartDrawer.module.css";
import { useCart } from "@/context/CartContext";
import {
  calculateLineItems,
  generateTransactionId,
  fetchPaymentOptions,
  authorizePayment,
  saveVoucher,
  LineItemResult,
  PaymentOption,
} from "@/lib/api";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  table?: string;
  companyCode?: number;
  branchCode?: string;
  branchName?: string;
  companyName?: string;
  industryType?: number;
}

type Step = "cart" | "form" | "processing" | "payment" | "otp" | "ussd_wait" | "done";

const OPERATION_OTP = 5;
const OPERATION_USSD_PUSH = 10;

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen, onClose, table, companyCode, branchCode, branchName, companyName, industryType = 1992,
}) => {
  const { cart, updateQuantity, totalPrice, clearCart } = useCart();

  // Calculation
  const [calcResult, setCalcResult] = useState<LineItemResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [dirty, setDirty] = useState(false);
  const lastCalcKey = useRef<string>("");
  const cartKey = cart.map((i) => `${i.id}:${i.quantity}`).join(",");

  // Flow
  const [step, setStep] = useState<Step>("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authResult, setAuthResult] = useState<{ type: string; isAsyncMode: string; transactionReference: string | null } | null>(null);

  // OTP step
  const [otp, setOtp] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Calculation ────────────────────────────────────────────────────────────

  const runCalculation = () => {
    if (!companyCode || !branchCode || cart.length === 0) return;
    setCalculating(true);
    setCalcResult(null);
    setDirty(false);
    lastCalcKey.current = cartKey;
    calculateLineItems(companyCode, Number(branchCode),
      cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }))
    ).then(setCalcResult).catch(() => setCalcResult(null)).finally(() => setCalculating(false));
  };

  useEffect(() => {
    if (!isOpen) return;
    if (cart.length === 0) { setCalcResult(null); return; }
    if (lastCalcKey.current === "") runCalculation();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || lastCalcKey.current === "") return;
    if (cartKey !== lastCalcKey.current) { setDirty(true); setCalcResult(null); }
  }, [cartKey]);

  useEffect(() => {
    if (!isOpen) {
      setDirty(false); setCalcResult(null); setStep("cart");
      setName(""); setPhone(""); setFormError(null);
      setTransactionId(null); setPaymentOptions([]); setSelectedOption(null);
      setAuthorizing(false); setAuthError(null); setAuthResult(null);
      setOtp(""); setSaving(false); setSaveError(null);
      lastCalcKey.current = "";
    }
  }, [isOpen]);

  const grandTotal = calcResult?.grandTotal ?? null;
  const extraCharges = calcResult?.extraCharge ?? {};
  const amount = grandTotal ?? totalPrice;

  // ── Form submit ────────────────────────────────────────────────────────────

  const handleFormSubmit = async () => {
    if (!name.trim()) { setFormError("Please enter your name."); return; }
    if (!/^0[79]\d{8}$/.test(phone.trim())) {
      setFormError("Enter a valid Ethiopian phone number (e.g. 0912345678).");
      return;
    }
    setFormError(null);
    setStep("processing");
    try {
      const [txId, options] = await Promise.all([
        generateTransactionId(phone.trim()),
        fetchPaymentOptions(phone.trim(), companyCode!, branchCode!),
      ]);
      setTransactionId(txId);
      setPaymentOptions(options);
      setStep("payment");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("form");
    }
  };

  // ── Authorize payment ──────────────────────────────────────────────────────

  const handlePay = async () => {
    if (!selectedOption || !transactionId || !companyCode || !branchCode) return;
    setAuthorizing(true);
    setAuthError(null);
    try {
      const result = await authorizePayment({
        userMobileNumber: phone.trim(),
        operationMode: selectedOption.operationMode,
        supplierConsigneeId: companyCode,
        supplierConsigneeUnit: Number(branchCode),
        paymentProcessorConsigneeId: selectedOption.paymentProcessorConsigneeId,
        paymentProcessorConsigneeUnit: selectedOption.paymentProcessorConsigneeUnit,
        transactionId: transactionId,
        amount,
        additionalParameters: { referenceNumber: "" },
      });

      if (!result.isSuccessful) {
        throw new Error(result.errorMessages?.join(", ") ?? "Authorization failed");
      }

      const info = {
        type: result.additionalParameters?.type ?? "otp",
        isAsyncMode: result.additionalParameters?.isAsyncMode ?? "false",
        transactionReference: result.transactionReference,
      };
      setAuthResult(info);

      if (selectedOption.operationMode === OPERATION_OTP) {
        setStep("otp");
      } else if (selectedOption.operationMode === OPERATION_USSD_PUSH) {
        setStep("ussd_wait");
        // USSD is async — save voucher immediately, payment confirmed on device
        await handleSaveVoucher("", info);
      } else {
        // Card / gateway — save and go to done
        await handleSaveVoucher("", info);
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setAuthorizing(false);
    }
  };

  // ── Save voucher ───────────────────────────────────────────────────────────

  const handleSaveVoucher = async (
    pin: string,
    info?: { type: string; isAsyncMode: string; transactionReference: string | null }
  ) => {
    if (!companyCode || !branchCode || !transactionId || !selectedOption) return;
    const resolvedInfo = info ?? authResult;
    if (!resolvedInfo) return;

    setSaving(true);
    setSaveError(null);

    try {
      const authReq = {
        paymentType: null, // Added to match payload object explicitly
        userMobileNumber: phone.trim(),
        operationMode: selectedOption.operationMode,
        supplierConsigneeId: companyCode,
        supplierConsigneeUnit: Number(branchCode),
        paymentProcessorConsigneeId: selectedOption.paymentProcessorConsigneeId,
        paymentProcessorConsigneeUnit: selectedOption.paymentProcessorConsigneeUnit,
        amount: calcResult?.grandTotal ?? amount, // use server-computed total
        transactionId: transactionId,
        additionalParameters: { referenceNumber: "Optional" }, // Aligned text representation
        pin: pin || "", // Ensures a standard string value fallback instead of optional spreading
      };

      const result = await saveVoucher({
        code: phone.trim(),
        companyCode,
        branchCode: Number(branchCode),
        industryType,
        lineItems: cart.map((i) => {
          // Use the unitAmount from the server's calculation response to avoid price mismatch
          const calcItem = calcResult?.lineItems.find((l) => l.article === Number(i.id));
          return {
            name: i.name,
            article: Number(i.id),
            unitAmount: calcItem?.unitAmount ?? i.price,
            quantity: i.quantity,
            uom: 0,
            note: "", // Replaced specialFlag: null
          };
        }),
        paymentMethod: selectedOption.paymentProcessorUnitName,
        transactionReference: resolvedInfo.transactionReference ?? transactionId, // Removed promoConsigneeUnit right above
        paymentInfo: {
          type: resolvedInfo.type,
          isAsyncMode: resolvedInfo.isAsyncMode,
          paymentTransactionRequest: authReq,
        },
        latitude: 0.0,
        longitude: 0.0,
        platform: "web", // Lowercase "web" to perfectly match your target payload example

        // Injected new schema layout blocks below
        promoDetail: null,
        servingMethod: {
          branchCode: Number(branchCode),
          branchName: branchName || "Unknown Branch",
          deliveryMethod: null,
          address: null,
          scheduleDateTime: null,
          servingMethodType: "IN_HOUSE_DINING",
          specificAddressName: null,
          selectedTableName: table || "Unknown Table",
        },
        ActivityLog: {
          code: phone.trim(),
          target: "",
          platform: "Web",
          latitude: 0.0,
          longitude: 0.0,
          appVersion: "2.0.9+89",
        },
        onSuccess: {
          firstName: "Markos", // Replace with user context state if available
          company: companyName || "",
          branch: branchName || "Unknown Branch",
          nightCount: null,
          seats: null,
          movieName: null,
          movieDimension: null,
          hallName: null,
          time: new Date().toLocaleTimeString("en-US", { hour12: false }), // Dynamic 24h string matching structure
          date: new Date().toISOString(), // Standard dynamic format matching ISO string schema target
          picture: null,
          scheduleDateTime: null,
        },
      });

      if (!result.isSuccessful) {
        throw new Error(result.errorMessages?.join(", ") ?? "Failed to save order");
      }

      setStep("done");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const stepTitle: Record<Step, string> = {
    cart: "Your Cart", form: "Your Details", processing: "Your Details",
    payment: "Select Payment", otp: "Enter OTP",
    ussd_wait: "Confirm on Phone", done: "Order Placed",
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{stepTitle[step]}</h2>
            {table && <p className={styles.tableLabel}>Table: {table}</p>}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* ── cart ── */}
        {step === "cart" && (
          <>
            <div className={styles.items}>
              {cart.length === 0 ? <p className={styles.empty}>Your cart is empty</p> : (
                cart.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemName}>{item.name}</h4>
                      <p className={styles.itemPrice}>ETB {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className={styles.itemControls}>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className={styles.footer}>
                {calcResult && Object.entries(extraCharges).map(([label, val]) => (
                  <div key={label} className={styles.chargeRow}>
                    <span>{label}</span><span>ETB {Number(val).toFixed(2)}</span>
                  </div>
                ))}
                <div className={styles.totalRow}>
                  <span>Total</span>
                  {calculating ? (
                    <div className={styles.totalLoading}><div className={styles.totalSpinner} /><span className={styles.totalCalculating}>Calculating...</span></div>
                  ) : dirty ? <span className={styles.totalCalculating}>—</span> : (
                    <span className={styles.totalPrice}>ETB {grandTotal !== null ? grandTotal.toFixed(2) : totalPrice.toFixed(2)}</span>
                  )}
                </div>
                {dirty ? (
                  <button className={styles.updateBtn} onClick={runCalculation}>Update Cart</button>
                ) : (
                  <button className={styles.checkoutBtn} disabled={calculating}
                    onClick={() => { setFormError(null); setStep("form"); }}>
                    {calculating ? "Calculating..." : "Checkout"}
                  </button>
                )}
                <button className={styles.clearBtn} onClick={clearCart}>Clear Cart</button>
              </div>
            )}
          </>
        )}

        {/* ── form / processing ── */}
        {(step === "form" || step === "processing") && (
          <div className={styles.formBody}>
            <p className={styles.formHint}>We need your details to process the order for <strong>{table}</strong>.</p>
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input className={styles.input} type="text" placeholder="e.g. Abebe Kebede"
                value="Ma" onChange={(e) => setName(e.target.value)} disabled={step === "processing"} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone Number</label>
              <input className={styles.input} type="tel" placeholder="e.g. 0912345678"
                value="0912141914" onChange={(e) => setPhone(e.target.value)} disabled={step === "processing"} />
            </div>
            {formError && <p className={styles.formError}>{formError}</p>}
            <div className={styles.formActions}>
              <button className={styles.checkoutBtn} onClick={handleFormSubmit} disabled={step === "processing"}>
                {step === "processing" ? <span className={styles.totalLoading}><span className={styles.totalSpinner} style={{ borderTopColor: "white" }} />Processing...</span> : "Continue to Payment"}
              </button>
              <button className={styles.clearBtn} onClick={() => setStep("cart")} disabled={step === "processing"}>Back to Cart</button>
            </div>
          </div>
        )}

        {/* ── payment selection ── */}
        {step === "payment" && (
          <div className={styles.formBody}>
            <p className={styles.formHint}>Choose how you'd like to pay.</p>
            <div className={styles.paymentList}>
              {paymentOptions.map((opt, idx) => (
                <button key={idx}
                  className={`${styles.paymentOption} ${selectedOption === opt ? styles.paymentSelected : ""}`}
                  onClick={() => setSelectedOption(opt)}>
                  <img src={opt.paymentProcessorUnitImage} alt={opt.paymentProcessorUnitName} className={styles.paymentLogo} />
                  <div className={styles.paymentInfo}>
                    <span className={styles.paymentName}>{opt.paymentProcessorUnitName}</span>
                    <span className={styles.paymentProcessor}>{opt.paymentProcessorName}</span>
                    {opt.accountNo !== opt.code && <span className={styles.paymentAccount}>{opt.accountNo}</span>}
                  </div>
                  <div className={`${styles.paymentRadio} ${selectedOption === opt ? styles.paymentRadioSelected : ""}`} />
                </button>
              ))}
            </div>
            {authError && <p className={styles.formError}>{authError}</p>}
            <div className={styles.formActions}>
              <button className={styles.checkoutBtn} disabled={!selectedOption || authorizing} onClick={handlePay}>
                {authorizing
                  ? <span className={styles.totalLoading}><span className={styles.totalSpinner} style={{ borderTopColor: "white" }} />Authorizing...</span>
                  : `Pay ETB ${amount.toFixed(2)}`}
              </button>
              <button className={styles.clearBtn} onClick={() => setStep("form")} disabled={authorizing}>Back</button>
            </div>
          </div>
        )}

        {/* ── OTP entry ── */}
        {step === "otp" && (
          <div className={styles.formBody}>
            <p className={styles.formHint}>
              An OTP has been sent to <strong>{phone}</strong> via {selectedOption?.paymentProcessorUnitName}. Enter it below to confirm your payment.
            </p>
            <div className={styles.field}>
              <label className={styles.label}>OTP Code</label>
              <input className={`${styles.input} ${styles.otpInput}`} type="number"
                placeholder="Enter OTP" value={otp}
                onChange={(e) => setOtp(e.target.value)} disabled={saving} />
            </div>
            {saveError && <p className={styles.formError}>{saveError}</p>}
            <div className={styles.formActions}>
              <button className={styles.checkoutBtn} disabled={!otp.trim() || saving}
                onClick={() => handleSaveVoucher(otp.trim())}>
                {saving
                  ? <span className={styles.totalLoading}><span className={styles.totalSpinner} style={{ borderTopColor: "white" }} />Confirming...</span>
                  : "Confirm Payment"}
              </button>
              <button className={styles.clearBtn} onClick={() => setStep("payment")} disabled={saving}>Back</button>
            </div>
          </div>
        )}

        {/* ── USSD waiting ── */}
        {step === "ussd_wait" && (
          <div className={styles.doneBody}>
            {saving ? (
              <>
                <div className={styles.totalSpinner} style={{ width: 48, height: 48, borderWidth: 4 }} />
                <h3 className={styles.doneTitle}>Waiting for confirmation...</h3>
                <p className={styles.doneText}>Please confirm the payment on your phone when prompted.</p>
              </>
            ) : saveError ? (
              <>
                <div className={styles.doneIcon} style={{ background: "#fdecea", color: "#c62828" }}>✕</div>
                <h3 className={styles.doneTitle}>Payment Failed</h3>
                <p className={styles.formError}>{saveError}</p>
                <button className={styles.checkoutBtn} onClick={() => setStep("payment")}>Try Again</button>
              </>
            ) : null}
          </div>
        )}

        {/* ── done ── */}
        {step === "done" && (
          <div className={styles.doneBody}>
            <div className={styles.doneIcon}>✓</div>
            <h3 className={styles.doneTitle}>Order Placed!</h3>
            <p className={styles.doneText}>Your order has been placed for <strong>{table}</strong>.</p>
            <div className={styles.txBox}>
              <p className={styles.txLabel}>Transaction ID</p>
              <p className={styles.txId}>{transactionId}</p>
            </div>
            {selectedOption && (
              <div className={styles.paymentSummary}>
                <img src={selectedOption.paymentProcessorUnitImage} alt={selectedOption.paymentProcessorUnitName} className={styles.paymentLogoSm} />
                <span>{selectedOption.paymentProcessorUnitName}</span>
              </div>
            )}
            <button className={styles.checkoutBtn} onClick={() => { clearCart(); onClose(); }}>Done</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CartDrawer;
