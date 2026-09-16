import { requireScope } from "@/lib/auth/require";
import { can } from "@/lib/auth/can";
import { redirect } from "next/navigation";
import AskForm from "./AskForm";

export default async function AskPage() {
  const scope = await requireScope();
  if (!can(scope, "sales") && !can(scope, "service")) redirect("/denied?feature=sales");
  return (
    <>
      <h1>Ask</h1>
      <p className="lede">Answers come from rows the guard let through for your stores. The model never supplies a number.</p>
      <AskForm examples={["How many units did we deliver in the last 30 days?", "Total gross last 7 days across all stores", "What was our gross per unit last month?", "What is our close rate on internet leads?"]} />
    </>
  );
}
