/**
 * ZarinPal v4 client (request + verify).
 * Mirrors the proven implementation in E:/maten/kafsh-tick:
 *   - amounts are sent in Rial
 *   - sandbox and production use different hosts
 *   - codes 100 and 101 both mean a verified payment
 */

const SANDBOX_MERCHANT = "1344b5d4-0048-11e8-94db-005056a205be";
const TIMEOUT_MS = 15000;

export function isSandbox(env) {
  const value = String((env && env.ZARINPAL_SANDBOX) || "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function resolveMerchantId(env) {
  const configured = String((env && env.ZARINPAL_MERCHANT_ID) || "").trim();
  if (configured) return configured;
  return isSandbox(env) ? SANDBOX_MERCHANT : "";
}

export function gatewayUrls(env) {
  if (isSandbox(env)) {
    return {
      api: "https://sandbox.zarinpal.com/pg/v4",
      startPay: "https://sandbox.zarinpal.com/pg/StartPay",
    };
  }
  return {
    api: "https://api.zarinpal.com/pg/v4",
    startPay: "https://www.zarinpal.com/pg/StartPay",
  };
}

/**
 * ZarinPal returns {"data": {...}} on success and
 * {"data": [], "errors": {...}} on failure, so the numeric code may live in
 * either place. Normalising here keeps the caller's branches honest.
 */
function pickCode(data, errors) {
  const fromData = data && typeof data.code === "number" ? data.code : null;
  if (fromData !== null) return fromData;
  const raw = errors && errors.code;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

async function postJson(url, payload, fetchImpl) {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }
  return { status: response.status, data };
}

/**
 * Create a payment and return the StartPay URL.
 * @returns {{ok: boolean, authority?: string, url?: string, code?: number|null, message?: string}}
 */
export async function requestPayment(env, input, fetchImpl = fetch) {
  const merchantId = resolveMerchantId(env);
  if (!merchantId) {
    return { ok: false, code: null, message: "merchant_id_missing" };
  }
  const { api, startPay } = gatewayUrls(env);
  const payload = {
    merchant_id: merchantId,
    amount: input.amountRial,
    callback_url: input.callbackUrl,
    description: input.description,
    metadata: {},
  };
  if (input.email) payload.metadata.email = input.email;
  if (input.mobile) payload.metadata.mobile = input.mobile;

  let result;
  try {
    result = await postJson(`${api}/payment/request.json`, payload, fetchImpl);
  } catch (error) {
    return { ok: false, code: null, message: "network_error" };
  }

  const data = result.data && result.data.data;
  const errors = result.data && result.data.errors;
  const code = pickCode(data, errors);
  if (code === 100 && data.authority) {
    return { ok: true, authority: data.authority, url: `${startPay}/${data.authority}`, code };
  }
  return {
    ok: false,
    code,
    message: (errors && (errors.message || errors.code)) || `http_${result.status}`,
  };
}

/**
 * Verify a payment by authority.
 * @returns {{ok: boolean, code?: number|null, refId?: string|null, message?: string}}
 */
export async function verifyPayment(env, input, fetchImpl = fetch) {
  const merchantId = resolveMerchantId(env);
  if (!merchantId) {
    return { ok: false, code: null, message: "merchant_id_missing" };
  }
  const { api } = gatewayUrls(env);
  const payload = {
    merchant_id: merchantId,
    amount: input.amountRial,
    authority: input.authority,
  };

  let result;
  try {
    result = await postJson(`${api}/payment/verify.json`, payload, fetchImpl);
  } catch (error) {
    return { ok: false, code: null, message: "network_error" };
  }

  const data = result.data && result.data.data;
  const errors = result.data && result.data.errors;
  const code = pickCode(data, errors);
  if ((code === 100 || code === 101) && data.ref_id) {
    return { ok: true, code, refId: String(data.ref_id) };
  }
  return {
    ok: false,
    code,
    message: (errors && (errors.message || errors.code)) || `http_${result.status}`,
  };
}
