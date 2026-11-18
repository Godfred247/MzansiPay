import { useLocation } from "react-router-dom";

export const PRACTICE = {
  name: "Harbour & Co",
  actor: "Ruan Meyer",
  role: "Payroll practitioner",
  email: "ruan.meyer@harbourco.example",
};

export const EMPLOYER_USER = {
  name: "Amara Dube",
  role: "Payroll administrator",
  email: "amara.dube@khanyisa-retail.example",
};

export const EMPLOYEE_USER = {
  name: "Thandiwe Nkosi",
  role: "Store manager",
  email: "thandiwe.nkosi@khanyisa-retail.example",
  employeeId: "thandiwe",
};

export function useWorkspace() {
  const { pathname } = useLocation();
  const accountant = pathname.startsWith("/a/client/");
  const clientId = accountant ? pathname.split("/")[3] : undefined;
  return {
    base: accountant ? `/a/client/${clientId}` : "/e",
    mode: accountant ? ("accountant" as const) : ("employer" as const),
    clientId,
    actor: accountant ? PRACTICE.actor : EMPLOYER_USER.name,
    role: accountant ? `${PRACTICE.role} · ${PRACTICE.name}` : EMPLOYER_USER.role,
    email: accountant ? PRACTICE.email : EMPLOYER_USER.email,
  };
}
