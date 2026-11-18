import { useEffect } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import { BillingPage, CompliancePage, DocumentsPage, PaymentsPage, ReportViewPage, ReportsPage, SettingsPage } from "./pages/AdminPages.tsx";
import {
  CalendarPage,
  ClientOverviewPage,
  ClientsPage,
  PracticeApprovalsPage,
  PracticeBillingPage,
  PracticeCompliancePage,
  PracticeDashboardPage,
  PracticeReportsPage,
  PracticeSettingsPage,
  ProcessingPage,
  TeamPage,
} from "./pages/AccountantPages.tsx";
import { DashboardPage } from "./pages/Dashboard.tsx";
import { DesignSystemPage } from "./pages/DesignSystem.tsx";
import { EmployeeProfilePage, EmployeesPage, NewEmployeePage } from "./pages/Employees.tsx";
import { LeavePage } from "./pages/Leave.tsx";
import {
  EmployeeDocuments,
  EmployeeHome,
  EmployeeLeave,
  EmployeeMobileLayout,
  EmployeePayslip,
  EmployeePayslips,
  EmployeeProfile,
  EmployerApprovals,
  EmployerEmployeeDetail,
  EmployerEmployees,
  EmployerHome,
  EmployerMobileLayout,
  EmployerMore,
  EmployerPayroll,
  EmployerRun,
  MobileLeaveList,
  MobileMoneyList,
  MobilePayslips,
} from "./pages/Mobile.tsx";
import { PayrollListPage, PayrollRunPage } from "./pages/Payroll.tsx";
import { PayslipPage, PayslipsPage } from "./pages/Payslips.tsx";
import { SignIn } from "./pages/SignIn.tsx";
import { BenefitsPage, EarningsPage } from "./pages/SetupPages.tsx";
import { EmployerShell, PracticeShell } from "./shells.tsx";
import { useApp } from "./state.tsx";
import { ButtonLink, ErrorState } from "./ui.tsx";

function EmployerRoutes() {
  return (
    <>
      <Route index element={<DashboardPage />} />
      <Route path="employees" element={<EmployeesPage />} />
      <Route path="employees/new" element={<NewEmployeePage />} />
      <Route path="employees/:employeeId" element={<EmployeeProfilePage />} />
      <Route path="payroll" element={<PayrollListPage />} />
      <Route path="payroll/:runId" element={<PayrollRunPage />} />
      <Route path="payslips" element={<PayslipsPage />} />
      <Route path="payslips/:payslipId" element={<PayslipPage />} />
      <Route path="leave" element={<LeavePage />} />
      <Route path="earnings" element={<EarningsPage />} />
      <Route path="benefits" element={<BenefitsPage />} />
      <Route path="compliance" element={<CompliancePage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="reports/:reportId" element={<ReportViewPage />} />
      <Route path="payments" element={<PaymentsPage />} />
      <Route path="documents" element={<DocumentsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="billing" element={<BillingPage />} />
    </>
  );
}

function AccountantClientLayout() {
  const { clientId = "" } = useParams();
  const { state, dispatch } = useApp();
  useEffect(() => {
    if (clientId === "khanyisa" || clientId === "moloto") dispatch({ type: "set-org", orgId: clientId });
  }, [clientId, dispatch]);
  if (clientId !== "khanyisa" && clientId !== "moloto") return <Navigate to="/a/clients" replace />;
  if (!state.accountantAccess[clientId]) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-8">
        <ErrorState title="Access is not authorised" body="This employer has not authorised Harbour & Co to open the payroll file." />
        <ButtonLink to="/a/clients" variant="secondary">Back to clients</ButtonLink>
      </div>
    );
  }
  return <EmployerShell />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/design-system" element={<DesignSystemPage />} />
      <Route path="/e" element={<EmployerShell />}>
        {EmployerRoutes()}
      </Route>
      <Route path="/a" element={<PracticeShell />}>
        <Route index element={<PracticeDashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:clientId" element={<ClientOverviewPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="processing" element={<ProcessingPage />} />
        <Route path="approvals" element={<PracticeApprovalsPage />} />
        <Route path="compliance" element={<PracticeCompliancePage />} />
        <Route path="reports" element={<PracticeReportsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="settings" element={<PracticeSettingsPage />} />
        <Route path="billing" element={<PracticeBillingPage />} />
      </Route>
      <Route path="/a/client/:clientId" element={<AccountantClientLayout />}>
        {EmployerRoutes()}
      </Route>
      <Route path="/m" element={<EmployerMobileLayout />}>
        <Route index element={<EmployerHome />} />
        <Route path="employees" element={<EmployerEmployees />} />
        <Route path="employees/:employeeId" element={<EmployerEmployeeDetail />} />
        <Route path="payroll" element={<EmployerPayroll />} />
        <Route path="payroll/:runId" element={<EmployerRun />} />
        <Route path="approvals" element={<EmployerApprovals />} />
        <Route path="more" element={<EmployerMore />} />
        <Route path="payslips" element={<MobilePayslips />} />
        <Route path="leave" element={<MobileLeaveList />} />
        <Route path="compliance" element={<MobileMoneyList kind="compliance" />} />
        <Route path="payments" element={<MobileMoneyList kind="payments" />} />
        <Route path="documents" element={<MobileMoneyList kind="documents" />} />
        <Route path="reports" element={<MobileMoneyList kind="reports" />} />
        <Route path="settings" element={<MobileMoneyList kind="settings" />} />
        <Route path="billing" element={<MobileMoneyList kind="billing" />} />
      </Route>
      <Route path="/me" element={<EmployeeMobileLayout />}>
        <Route index element={<EmployeeHome />} />
        <Route path="payslips" element={<EmployeePayslips />} />
        <Route path="payslips/:payslipId" element={<EmployeePayslip />} />
        <Route path="leave" element={<EmployeeLeave />} />
        <Route path="documents" element={<EmployeeDocuments />} />
        <Route path="profile" element={<EmployeeProfile />} />
      </Route>
      <Route
        path="*"
        element={
          <div className="mx-auto max-w-lg space-y-4 p-8">
            <ErrorState title="Page not found" body="That screen is not part of MzansiPay." />
            <Link to="/" className="text-sm font-medium text-blue-700">Back to sign in</Link>
          </div>
        }
      />
    </Routes>
  );
}
