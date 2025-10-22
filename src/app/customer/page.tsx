import { Suspense } from "react";
import ExistingCustomers from "./ExistingCustomers";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading customers...</div>}>
      <ExistingCustomers />
    </Suspense>
  );
}
