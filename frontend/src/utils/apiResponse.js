export function unwrapApiData(responseBody) {
  if (responseBody == null) return responseBody;
  if (Array.isArray(responseBody)) return responseBody;
  if (typeof responseBody !== 'object') return responseBody;

  const innerPayload = responseBody.data;
  if (innerPayload !== undefined) {
    if (Array.isArray(innerPayload)) return innerPayload;
    if (innerPayload && typeof innerPayload === 'object' && Array.isArray(innerPayload.data)) {
      return innerPayload.data;
    }
    return innerPayload;
  }

  return responseBody;
}

export function unwrapApiList(responseBody) {
  const payload = unwrapApiData(responseBody);
  return Array.isArray(payload) ? payload : [];
}
