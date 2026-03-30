import OrderCard from "../components/OrderCard";
import EmptyState from "../components/EmptyState";

export default function DashboardPage({ orders, busyMap, onUploadFinal, onUploadAdditional }) {
  if (!orders.length) {
    return (
      <EmptyState
        title="No Pending Segments"
        description="No final or additional segments are currently pending upload for your scope."
      />
    );
  }

  return (
    <section className="dashboard-grid">
      {orders.map((order) => (
        <OrderCard
          key={order.orderId}
          order={order}
          busyKeyMap={busyMap}
          onUploadFinal={onUploadFinal}
          onUploadAdditional={onUploadAdditional}
        />
      ))}
    </section>
  );
}
