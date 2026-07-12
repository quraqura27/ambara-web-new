import { getOperationalDashboard } from "@/actions/dashboard";
import { OperationsDashboard } from "@/components/portal/operations-dashboard";

export default async function DashboardPage() {
  return <OperationsDashboard data={await getOperationalDashboard()} />;
}
