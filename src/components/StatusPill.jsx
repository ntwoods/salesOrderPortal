import { stateLabel } from "../utils/format";

export default function StatusPill({ state }) {
  const cls =
    state === "APPROVED_BY_CRM"
      ? "status-pill approved"
      : state === "PENDING_CRM_APPROVAL"
        ? "status-pill pending"
        : state === "RETURNED_BY_CRM"
          ? "status-pill returned"
          : "status-pill upload";

  return <span className={cls}>{stateLabel(state)}</span>;
}
