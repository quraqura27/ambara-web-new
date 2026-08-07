import { redirect } from "next/navigation";

export default function LegacyNewOpportunityRoute() {
  redirect("/crm/opportunities/new");
}
