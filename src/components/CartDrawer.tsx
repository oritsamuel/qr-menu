"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./CartDrawer.module.css";
import { useCart } from "@/context/CartContext";
import {
  calculateLineItems,
  generateTransactionId,
  fetchPaymentOptions,
  authorizePayment,
  checkTransactionResolution,
  saveVoucher,
  fetchVoucherHistory,
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
  onOrderComplete?: (phone: string) => void;
}

// Steps: cart → checkout (form + payment options) → otp | ussd_wait | card_wait → done
type Step = "cart" | "checkout" | "paying" | "otp" | "ussd_wait" | "card_wait" | "done";

const PHONE_REGEX = /^0[79]\d{8}$/;

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen, onClose, table, companyCode, branchCode, branchName, companyName, industryType = 1992, onOrderComplete,
}) => {
  const { cart, updateQuantity, totalPrice, clearCart, specialRequest } = useCart();

  // ── Calculation ────────────────────────────────────────────────────────────
  const [calcResult, setCalcResult]   = useState<LineItemResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [dirty, setDirty]             = useState(false);
  const lastCalcKey                   = useRef("");
  const cartKey = cart.map((i) => `${i.id}:${i.quantity}`).join(",");

  // ── Checkout form ──────────────────────────────────────────────────────────
  const [step, setStep]                     = useState<Step>("cart");
  const [name, setName]                     = useState("");
  const [phone, setPhone]                   = useState("");
  const [formError, setFormError]           = useState<string | null>(null);

  // Payment options — loaded automatically when phone is valid
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);

  // Transaction + auth
  const [transactionId, setTransactionId]   = useState<string | null>(null);
  const [authorizing, setAuthorizing]       = useState(false);
  const [authError, setAuthError]           = useState<string | null>(null);
  const [authResult, setAuthResult]         = useState<{
    type: string; isAsyncMode: string; transactionReference: string | null; redirectUrl?: string;
  } | null>(null);

  // OTP
  const [otp, setOtp]           = useState("");
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Card polling
  const [polling, setPolling]       = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [pollError, setPollError]   = useState<string | null>(null);
  const pollTimerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveAbortRef                = useRef<AbortController | null>(null);

  // ── Calculation effects ────────────────────────────────────────────────────
  const runCalculation = () => {
    if (!companyCode || !branchCode || cart.length === 0) return;
    setCalculating(true); setCalcResult(null); setDirty(false);
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

  // Reset everything on close
  useEffect(() => {
    if (!isOpen) {
      setDirty(false); setCalcResult(null); setStep("cart");
      setName(""); setPhone(""); setFormError(null);
      setPaymentOptions([]); setLoadingOptions(false); setSelectedOption(null);
      setDetailsCollapsed(false);
      setTransactionId(null); setAuthorizing(false); setAuthError(null); setAuthResult(null);
      setOtp(""); setSaving(false); setSaveError(null);
      setPolling(false); setPollError(null);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      lastCalcKey.current = "";
    }
  }, [isOpen]);

  // ── Auto-fetch payment options when phone is valid ─────────────────────────
  useEffect(() => {
    if (step !== "checkout") return;
    if (!PHONE_REGEX.test(phone.trim())) {
      setPaymentOptions([]);
      setSelectedOption(null);
      return;
    }
    setLoadingOptions(true);
    setSelectedOption(null);
    fetchPaymentOptions(phone.trim(), companyCode!, branchCode!)
      .then((opts) => { setPaymentOptions(opts); setDetailsCollapsed(true); })
      .catch(() => setPaymentOptions([]))
      .finally(() => setLoadingOptions(false));
  }, [phone, step]);

  const grandTotal   = calcResult?.grandTotal ?? null;
  const extraCharges = calcResult?.extraCharge ?? {};
  const amount       = grandTotal ?? totalPrice;

  // ── Pay button: generate transaction + authorize ───────────────────────────
  const handlePay = async () => {
    if (!name.trim())                        { setFormError("Please enter your name."); return; }
    if (!PHONE_REGEX.test(phone.trim()))     { setFormError("Enter a valid Ethiopian phone number."); return; }
    if (!selectedOption)                     { setFormError("Please select a payment method."); return; }
    if (!companyCode || !branchCode)         return;

    setFormError(null);
    setAuthorizing(true);
    setAuthError(null);

    try {
      // Generate transaction ID first, then authorize with the real ID
      const txId = await generateTransactionId(phone.trim());
      setTransactionId(txId);

      const authRes = await authorizePayment({
        userMobileNumber: phone.trim(),
        operationMode: selectedOption.operationMode,
        supplierConsigneeId: companyCode,
        supplierConsigneeUnit: Number(branchCode),
        paymentProcessorConsigneeId: selectedOption.paymentProcessorConsigneeId,
        paymentProcessorConsigneeUnit: selectedOption.paymentProcessorConsigneeUnit,
        transactionId: txId,
        amount,
        additionalParameters: { referenceNumber: "Optional" },
      });

      if (!authRes.isSuccessful) {
        throw new Error(authRes.errorMessages?.join(", ") ?? "Authorization failed");
      }

      const info = {
        type: authRes.additionalParameters?.type ?? "otp",
        isAsyncMode: authRes.additionalParameters?.isAsyncMode ?? "false",
        transactionReference: authRes.transactionReference,
        redirectUrl: authRes.additionalParameters?.RedirectUrl ?? authRes.additionalParameters?.redirectUrl,
      };
      setAuthResult(info);

      const payType = info.type.toLowerCase();

      if (payType === "card") {
        // Card — open payment gateway in new tab, then start polling
        if (info.redirectUrl) {
          window.open(info.redirectUrl, "_blank", "noopener,noreferrer");
          setStep("card_wait");
          startPolling(txId, info);
        } else {
          throw new Error("Card payment redirect URL not found.");
        }
      } else if (payType === "ussdpush" || info.isAsyncMode === "true") {
        // USSD Push — save voucher immediately and show waiting screen
        setStep("ussd_wait");
        await handleSaveVoucher("", txId, info);
      } else {
        // OTP — show OTP input
        setStep("otp");
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setAuthorizing(false);
    }
  };

  // ── Card polling ──────────────────────────────────────────────────────────
  const startPolling = (
    txId: string,
    info: { type: string; isAsyncMode: string; transactionReference: string | null }
  ) => {
    if (!selectedOption || !companyCode || !branchCode) return;
    setPolling(true);
    setPollError(null);

    const poll = async () => {
      try {
        const result = await checkTransactionResolution({
          userMobileNumber: phone.trim(),
          operationMode: selectedOption.operationMode,
          supplierConsigneeId: companyCode,
          supplierConsigneeUnit: Number(branchCode),
          paymentProcessorConsigneeId: selectedOption.paymentProcessorConsigneeId,
          paymentProcessorConsigneeUnit: selectedOption.paymentProcessorConsigneeUnit,
          transactionId: txId,
          amount: calcResult?.grandTotal ?? amount,
          additionalParameters: { referenceNumber: "Optional" },
        });

        if (result.isSuccessful) {
          setPolling(false);
          // Save voucher with the resolved transaction reference
          await handleSaveVoucher("", txId, {
            ...info,
            transactionReference: result.transactionReference,
          });
        } else {
          // Not resolved yet — poll again in 3 seconds
          pollTimerRef.current = setTimeout(poll, 3000);
        }
      } catch {
        // Network error — retry in 5 seconds
        pollTimerRef.current = setTimeout(poll, 5000);
      }
    };

    // Start first poll after 3 seconds (give user time to complete payment)
    pollTimerRef.current = setTimeout(poll, 3000);
  };

  // ── Save voucher ───────────────────────────────────────────────────────────
  const handleSaveVoucher = async (
    pin: string,
    txId?: string,
    info?: { type: string; isAsyncMode: string; transactionReference: string | null }
  ) => {
    if (!companyCode || !branchCode || !selectedOption) return;
    const resolvedTxId   = txId ?? transactionId;
    const resolvedInfo   = info ?? authResult;
    if (!resolvedTxId || !resolvedInfo) return;

    setSaving(true); setSaveError(null);

    const abortController = new AbortController();
    saveAbortRef.current = abortController;

    try {      const result = await saveVoucher({
        code: phone.trim(),
        notifyInvitee: false,
        inviteeName: null,
        inviteePhone: null,
        buyerTin: null,
        buyerCompanyName: null,
        companyCode,
        branchCode: Number(branchCode),
        industryType,
        lineItems: cart.map((i) => {
          const calcItem = calcResult?.lineItems.find((l) => l.article === Number(i.id));
          return {
            name: i.name,
            article: Number(i.id),
            unitAmount: calcItem?.unitAmount ?? i.price,
            quantity: i.quantity,
            parent: null,
            uom: 0,
            note: "",
          };
        }),
        paymentMethod: selectedOption.paymentProcessorUnitName,
        transactionReference: resolvedInfo.transactionReference ?? "",
        paymentInfo: {
          type: resolvedInfo.type,
          isAsyncMode: resolvedInfo.isAsyncMode,
          paymentType: null,
          paymentTransactionRequest: {
            userMobileNumber: phone.trim(),
            operationMode: selectedOption.operationMode,
            supplierConsigneeId: companyCode,
            supplierConsigneeUnit: Number(branchCode),
            paymentProcessorConsigneeId: selectedOption.paymentProcessorConsigneeId,
            paymentProcessorConsigneeUnit: selectedOption.paymentProcessorConsigneeUnit,
            transactionId: resolvedTxId,
            amount: calcResult?.grandTotal ?? amount,
            additionalParameters: { referenceNumber: "Optional" },
            pin: pin || "",
          },
        },
        latitude: 0,
        longitude: 0,
        platform: "Web",
        deviceId: "",
        promoDetail: null,
        onSuccess: {
          firstName: name.trim(),
          company: companyName || "",
          branch: branchName || "",
          nightCount: null,
          seats: null,
          movieName: null,
          movieDimension: null,
          hallName: null,
          time: null,
          date: null,
          picture: null,
          scheduleDateTime: null,
        },
        servingMethod: {
          address: null,
          scheduleDateTime: null,
          servingMethodType: "IN_HOUSE_DINING",
          specificAddressName: null,
          specialRequest: specialRequest || null,
          selectedTableName: table || null,
        },
        deliveryOrderRequest: null,
        ActivityLog: {
          platform: "Web",
          latitude: 0,
          longitude: 0,
          appVersion: "2.1.7+145",
          code: phone.trim(),
          langLocale: "en",
        },
      });

      if (!result.isSuccessful) throw new Error(result.errorMessages?.join(", ") ?? "Failed to save order");
      // The server generates a new voucherCode — fetch history to get the actual code
      try {
        await new Promise((r) => setTimeout(r, 1000)); // wait 1s for server to commit
        const history = await fetchVoucherHistory(phone.trim(), 1);
        if (history.length > 0) setTransactionId(history[0].voucherCode);
      } catch {
        // Keep the generated transactionId if history fetch fails
      }
      onOrderComplete?.(phone.trim());
      setStep("done");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const stepTitle: Record<Step, string> = {
    cart: "Your Cart", checkout: "Checkout",
    paying: "Checkout", otp: "Enter OTP",
    ussd_wait: "Confirm on Phone", card_wait: "Complete Payment",
    done: "Order Placed",
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

        {/* ── CART ── */}
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
                  <div key={label} className={styles.chargeRow}><span>{label}</span><span>ETB {Number(val).toFixed(2)}</span></div>
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
                    onClick={() => { setFormError(null); setStep("checkout"); }}>
                    {calculating ? "Calculating..." : "Checkout"}
                  </button>
                )}
                <button className={styles.clearBtn} onClick={clearCart}>Clear Cart</button>
              </div>
            )}
          </>
        )}

        {/* ── CHECKOUT: name + phone + payment options (all on one screen) ── */}
        {step === "checkout" && (
          <div className={styles.formBody}>
            <p className={styles.formHint}>Enter your details and choose a payment method.</p>

            {/* Fields — always shown, chevron below phone collapses when options are loaded */}
            {!detailsCollapsed ? (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name</label>
                  <input className={styles.input} type="text" placeholder="e.g. Abebe Kebede"
                    value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Phone Number</label>
                  <input className={styles.input} type="tel" placeholder="e.g. 0912345678"
                    value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                {paymentOptions.length > 0 && (
                  <button className={styles.collapseBtn} onClick={() => setDetailsCollapsed(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                )}
              </>
            ) : (
              <div className={styles.collapsedSummary}>
                <div className={styles.collapsedInfo}>
                  <span className={styles.collapsedName}>{name}</span>
                  <span className={styles.collapsedPhone}>{phone}</span>
                </div>
                <button className={styles.collapseBtn} onClick={() => setDetailsCollapsed(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            )}

            {/* Payment options appear automatically once phone is valid */}
            {loadingOptions && (
              <div className={styles.totalLoading} style={{ justifyContent: "center", padding: "8px 0" }}>
                <div className={styles.totalSpinner} />
                <span className={styles.totalCalculating}>Loading payment options...</span>
              </div>
            )}

            {paymentOptions.length > 0 && (
              <>
                <p className={styles.label}>Payment Options</p>
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
              </>
            )}

            {formError && <p className={styles.formError}>{formError}</p>}
            {authError && <p className={styles.formError}>{authError}</p>}

            <div className={styles.formActions}>
              <button className={styles.checkoutBtn}
                disabled={!selectedOption || authorizing || loadingOptions}
                onClick={handlePay}>
                {authorizing
                  ? <span className={styles.totalLoading}><span className={styles.totalSpinner} style={{ borderTopColor: "white" }} />Processing...</span>
                  : `Pay ETB ${amount.toFixed(2)}`}
              </button>
              <button className={styles.clearBtn} onClick={() => setStep("cart")} disabled={authorizing}>Back to Cart</button>
            </div>
          </div>
        )}

        {/* ── OTP ── */}
        {step === "otp" && (
          <div className={styles.formBody}>
            <p className={styles.formHint}>
              An OTP has been sent to <strong>{phone}</strong> via {selectedOption?.paymentProcessorUnitName}. Enter it below to confirm.
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
              <button className={styles.clearBtn} onClick={() => setStep("checkout")} disabled={saving}>Back</button>
            </div>
          </div>
        )}

        {/* ── USSD waiting ── */}
        {step === "ussd_wait" && (
          <div className={styles.doneBody}>
            {saving ? (
              <>
                <div className={styles.totalSpinner} style={{ width: 48, height: 48, borderWidth: 4 }} />
                <h3 className={styles.doneTitle}>Check your phone</h3>
                <p className={styles.doneText}>
                  A USSD push has been sent to <strong>{phone}</strong>.<br />
                  Approve the payment on your phone to complete the order.
                </p>
              </>
            ) : saveError ? (
              <>
                <div className={styles.doneIcon} style={{ background: "#fdecea", color: "#c62828" }}>✕</div>
                <h3 className={styles.doneTitle}>Payment Failed</h3>
                <p className={styles.formError}>{saveError}</p>
                <button className={styles.checkoutBtn} onClick={() => setStep("checkout")}>Try Again</button>
              </>
            ) : null}
          </div>
        )}

        {/* ── CARD waiting ── */}
        {step === "card_wait" && (
          <div className={styles.doneBody}>
            {saving ? (
              <>
                <div className={styles.totalSpinner} style={{ width: 48, height: 48, borderWidth: 4 }} />
                <h3 className={styles.doneTitle}>Saving your order...</h3>
                <p className={styles.doneText}>Please wait.</p>
              </>
            ) : saveError ? (
              <>
                <div className={styles.doneIcon} style={{ background: "#fdecea", color: "#c62828" }}>✕</div>
                <h3 className={styles.doneTitle}>Payment Failed</h3>
                <p className={styles.formError}>{saveError}</p>
                <button className={styles.checkoutBtn} onClick={() => setStep("checkout")}>Try Again</button>
              </>
            ) : (
              <>
                <div className={styles.totalSpinner} style={{ width: 48, height: 48, borderWidth: 4 }} />
                <h3 className={styles.doneTitle}>Complete payment</h3>
                <p className={styles.doneText}>
                  A payment page has opened in a new tab.<br />
                  Complete your card payment there.this screen will update automatically.
                </p>
                {pollError && <p className={styles.formError}>{pollError}</p>}
                <button className={styles.clearBtn} onClick={() => {
                  if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
                  setStep("checkout");
                }}>Cancel</button>
              </>
            )}
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div className={styles.doneBody}>
            <div className={styles.doneIcon}>✓</div>
            <h3 className={styles.doneTitle}>Order Placed!</h3>
            <p className={styles.doneText}>Your order has been placed for <strong>{table}</strong>.</p>
            <div className={styles.txBox}>
              <p className={styles.txLabel}>Ecom Ref</p>
              <p className={styles.txId}>{transactionId}</p>
            </div>

            {/* Order detail */}
            <div className={styles.orderDetail}>
              <p className={styles.orderDetailTitle}>Order Summary</p>
              {cart.map((item) => (
                <div key={item.id} className={styles.orderDetailRow}>
                  <span className={styles.orderDetailName}>{item.name}</span>
                  <span className={styles.orderDetailQtyPrice}>
                    ×{item.quantity} &nbsp; ETB {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              {calcResult && Object.entries(calcResult.extraCharge).map(([label, val]) => (
                <div key={label} className={styles.orderDetailCharge}>
                  <span>{label}</span>
                  <span>ETB {Number(val).toFixed(2)}</span>
                </div>
              ))}
              <div className={styles.orderDetailTotal}>
                <span>Total</span>
                <span>ETB {(calcResult?.grandTotal ?? totalPrice).toFixed(2)}</span>
              </div>
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
