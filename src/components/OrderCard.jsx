import SegmentCard from "./SegmentCard";
import { shortOrderId } from "../utils/format";

export default function OrderCard({ order, onUploadFinal, onUploadAdditional, busyKeyMap }) {
  return (
    <article className="order-card">
      <header className="order-head">
        <div>
          <h3>{order.dealerName || "-"}</h3>
          <p className="tiny">{shortOrderId(order.orderId)}</p>
        </div>
        <div className="meta-grid">
          <span>
            <strong>Location:</strong> {order.location || "-"}
          </span>
          <span>
            <strong>CRM:</strong> {order.crm || "-"}
          </span>
          <span>
            <strong>Owner:</strong> {order.concernedOwner || "-"}
          </span>
          <span>
            <strong>Color:</strong> {order.color || "-"}
          </span>
        </div>
      </header>

      <div className="segments-wrap">
        {order.segments.map((segment) => {
          const busyKey =
            segment.segmentType === "FINAL"
              ? `${order.orderId}:FINAL:0`
              : `${order.orderId}:ADDITIONAL:${segment.sourceUrl}`;
          const onUpload = (files) =>
            segment.segmentType === "FINAL"
              ? onUploadFinal(order.orderId, files)
              : onUploadAdditional(order.orderId, segment.sourceUrl, files);

          return (
            <SegmentCard
              key={busyKey}
              segment={segment}
              busy={Boolean(busyKeyMap[busyKey])}
              onUpload={onUpload}
            />
          );
        })}
      </div>
    </article>
  );
}
