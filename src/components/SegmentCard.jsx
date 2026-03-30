import FileUploadButton from "./FileUploadButton";
import StatusPill from "./StatusPill";
import { formatDateTime } from "../utils/format";

export default function SegmentCard({ segment, busy, onUpload }) {
  return (
    <div className="segment-card">
      <div className="segment-header">
        <div>
          <h4>{segment.label}</h4>
          <p className="tiny">Index: {segment.segmentIndex}</p>
        </div>
        <StatusPill state={segment.state} />
      </div>

      <div className="segment-links">
        {segment.sourceUrl ? (
          <a href={segment.sourceUrl} target="_blank" rel="noreferrer" className="chip-link">
            Show Order
          </a>
        ) : (
          <span className="chip-link muted">Source unavailable</span>
        )}

        {(segment.salesOrderUrls || []).map((url, idx) => (
          <a key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer" className="chip-link accent">
            Sales Order {idx + 1}
          </a>
        ))}
      </div>

      <div className="segment-meta">
        <span>Uploaded: {formatDateTime(segment.uploadedAt)}</span>
        <span>Approved: {formatDateTime(segment.approvedAt)}</span>
      </div>

      {segment.returnRemark ? (
        <div className="return-box">
          <strong>Return Remark</strong>
          <p>{segment.returnRemark}</p>
          <small>{formatDateTime(segment.returnedAt)}</small>
        </div>
      ) : null}

      {segment.eligibleForAccountsUpload ? (
        <FileUploadButton onFilesSelected={onUpload} disabled={busy} busyLabel="Uploading..." />
      ) : (
        <p className="tiny">Upload locked for this segment in current state.</p>
      )}
    </div>
  );
}
