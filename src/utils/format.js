export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function stateLabel(state) {
  const map = {
    PENDING_UPLOAD: "Pending Upload",
    PENDING_CRM_APPROVAL: "Pending CRM Approval",
    APPROVED_BY_CRM: "Approved",
    RETURNED_BY_CRM: "Returned"
  };
  return map[state] || state || "-";
}

export function shortOrderId(orderId) {
  if (!orderId) return "";
  return `#${orderId}`;
}
