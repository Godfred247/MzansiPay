import { useEffect } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import { BillingPage, DocumentsPage, PaymentsPage, ReportViewPage, ReportsPage, SettingsPage } from "./pages/AdminPages.tsx";
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
import { ArchivedEmployeesPage, EmployeeProfilePage, EmployeesPage, NewEmployeePage, TerminateEmployeePage } from "./pages/Employees.tsx";
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
import {
  ApprovalDetailPage,
  ApprovalQueuePage,
  DocumentPreviewPage,
  LeaveCalendarPage,
  LeaveTypesPage,
  PayrollCalendarPage,
  PayrollComparePage,
  PayrollCreatePage,
  PayrollExceptionsPage,
  PayrollFinalPage,
  PayrollGroupCreatePage,
  PayrollGroupsPage,
  PayrollHistoryPage,
  PayrollPendingPage,
  PayrollRejectedPage,
  PayrollSubmitPage,
  StructureCreatePage,
  StructureDetailPage,
  StructuresPage,
} from "./pages/EmployerOps.tsx";
import { PayrollListPage, PayrollRunPage } from "./pages/Payroll.tsx";
import {
  CalculationPage,
  CalculationsPage,
  CertificatePage,
  CertificatesPage,
  ComplianceCalendarPage,
  CompliancePage,
  Emp201Page,
  Emp501Page,
  ResolveFindingPage,
  StatutorySummaryPage,
  TaxRulePage,
  TaxRulesPage,
  ValidationPage,
} from "./pages/Statutory.tsx";
import { PayslipPage, PayslipsPage } from "./pages/Payslips.tsx";
import { AccountTypePage, ForgotPasswordPage, MfaPage, ResetPasswordPage, SignUpPage, VerifyPage } from "./onboarding/auth.tsx";
import {
  AccountantCheckoutPage,
  AccountantContactPage,
  AccountantPlanPage,
  AccountantProfilePage,
  AccountantRegistrationPage,
  AccountantTeamPage,
  AccountantWelcomePage,
} from "./onboarding/accountant.tsx";
import {
  AcceptInvitationPage,
  EmployeeAccountPage,
  EmployeeConfirmPage,
  EmployeeMfaPage,
  EmployeePasswordPage,
  EmployeeProfilePage as InvitationProfilePage,
  EmployeeVerifyPage,
  EmployeeWelcomePage,
  InvitationEmailPage,
} from "./onboarding/employee.tsx";
import {
  EmployerAddressPage,
  EmployerCheckoutPage,
  EmployerCompanyPage,
  EmployerConfirmedPage,
  EmployerFrequenciesPage,
  EmployerOrganisationPage,
  EmployerPeriodPage,
  EmployerPlanPage,
  EmployerRegistrationPage,
  EmployerStatutoryPage,
  EmployerWelcomePage,
} from "./onboarding/employer.tsx";
import { AccountantLandingPage, LandingPage } from "./onboarding/public.tsx";
import {
  SetupHubPage,
  WizardAdminsPage,
  WizardBranchesPage,
  WizardCompanyPage,
  WizardEarningsPage,
  WizardFrequencyPage,
  WizardLeavePage,
  WizardPayDatesPage,
  WizardReviewPage,
  WizardTaxPage,
  WizardYearPage,
} from "./onboarding/wizard.tsx";
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
      <Route path="employees/archived" element={<ArchivedEmployeesPage />} />
      <Route path="employees/new" element={<NewEmployeePage />} />
      <Route path="employees/:employeeId/terminate" element={<TerminateEmployeePage />} />
      <Route path="employees/:employeeId" element={<EmployeeProfilePage />} />
      <Route path="structures" element={<StructuresPage />} />
      <Route path="structures/new" element={<StructureCreatePage />} />
      <Route path="structures/:structureId" element={<StructureDetailPage />} />
      <Route path="payroll" element={<PayrollListPage />} />
      <Route path="payroll/groups" element={<PayrollGroupsPage />} />
      <Route path="payroll/groups/new" element={<PayrollGroupCreatePage />} />
      <Route path="payroll/calendar" element={<PayrollCalendarPage />} />
      <Route path="payroll/new" element={<PayrollCreatePage />} />
      <Route path="payroll/history" element={<PayrollHistoryPage />} />
      <Route path="payroll/pending" element={<PayrollPendingPage />} />
      <Route path="payroll/rejected" element={<PayrollRejectedPage />} />
      <Route path="payroll/final" element={<PayrollFinalPage />} />
      <Route path="payroll/:runId/employee/:employeeId" element={<CalculationPage />} />
      <Route path="payroll/:runId/validate" element={<ValidationPage />} />
      <Route path="payroll/:runId/exceptions" element={<PayrollExceptionsPage />} />
      <Route path="payroll/:runId/compare" element={<PayrollComparePage />} />
      <Route path="payroll/:runId/submit" element={<PayrollSubmitPage />} />
      <Route path="payroll/:runId" element={<PayrollRunPage />} />
      <Route path="approvals" element={<ApprovalQueuePage />} />
      <Route path="approvals/:runId" element={<ApprovalDetailPage />} />
      <Route path="payslips" element={<PayslipsPage />} />
      <Route path="payslips/:payslipId" element={<PayslipPage />} />
      <Route path="leave" element={<LeavePage />} />
      <Route path="leave/calendar" element={<LeaveCalendarPage />} />
      <Route path="leave/types" element={<LeaveTypesPage />} />
      <Route path="earnings" element={<EarningsPage />} />
      <Route path="benefits" element={<BenefitsPage />} />
      <Route path="compliance" element={<CompliancePage />} />
      <Route path="compliance/calendar" element={<ComplianceCalendarPage />} />
      <Route path="compliance/paye" element={<StatutorySummaryPage kind="paye" />} />
      <Route path="compliance/uif" element={<StatutorySummaryPage kind="uif" />} />
      <Route path="compliance/sdl" element={<StatutorySummaryPage kind="sdl" />} />
      <Route path="compliance/eti" element={<StatutorySummaryPage kind="eti" />} />
      <Route path="compliance/emp201" element={<Emp201Page />} />
      <Route path="compliance/emp501" element={<Emp501Page />} />
      <Route path="compliance/certificates" element={<CertificatesPage />} />
      <Route path="compliance/certificates/:employeeId" element={<CertificatePage />} />
      <Route path="compliance/rules" element={<TaxRulesPage />} />
      <Route path="compliance/rules/:yearId" element={<TaxRulePage />} />
      <Route path="validation" element={<ValidationPage />} />
      <Route path="validation/:findingId" element={<ResolveFindingPage />} />
      <Route path="calculations" element={<CalculationsPage />} />
      <Route path="calculations/:employeeId" element={<CalculationPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="reports/:reportId" element={<ReportViewPage />} />
      <Route path="payments" element={<PaymentsPage />} />
      <Route path="documents" element={<DocumentsPage />} />
      <Route path="documents/:docId" element={<DocumentPreviewPage />} />
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
      <Route path="/" element={<LandingPage />} />
      <Route path="/accountants" element={<AccountantLandingPage />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/signup" element={<SignUpPage kind="employer" />} />
      <Route path="/accountants/signup" element={<SignUpPage kind="accountant" />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />
      <Route path="/reset" element={<ResetPasswordPage />} />
      <Route path="/mfa" element={<MfaPage />} />
      <Route path="/start/account-type" element={<AccountTypePage />} />
      <Route path="/start/employer/organisation" element={<EmployerOrganisationPage />} />
      <Route path="/start/employer/company" element={<EmployerCompanyPage />} />
      <Route path="/start/employer/registration" element={<EmployerRegistrationPage />} />
      <Route path="/start/employer/statutory" element={<EmployerStatutoryPage />} />
      <Route path="/start/employer/address" element={<EmployerAddressPage />} />
      <Route path="/start/employer/frequencies" element={<EmployerFrequenciesPage />} />
      <Route path="/start/employer/period" element={<EmployerPeriodPage />} />
      <Route path="/start/employer/plan" element={<EmployerPlanPage />} />
      <Route path="/start/employer/checkout" element={<EmployerCheckoutPage />} />
      <Route path="/start/employer/confirmed" element={<EmployerConfirmedPage />} />
      <Route path="/start/employer/welcome" element={<EmployerWelcomePage />} />
      <Route path="/start/accountant/practice" element={<AccountantProfilePage />} />
      <Route path="/start/accountant/registration" element={<AccountantRegistrationPage />} />
      <Route path="/start/accountant/contact" element={<AccountantContactPage />} />
      <Route path="/start/accountant/team" element={<AccountantTeamPage />} />
      <Route path="/start/accountant/plan" element={<AccountantPlanPage />} />
      <Route path="/start/accountant/checkout" element={<AccountantCheckoutPage />} />
      <Route path="/start/accountant/welcome" element={<AccountantWelcomePage />} />
      <Route path="/invite" element={<InvitationEmailPage />} />
      <Route path="/invite/accept" element={<AcceptInvitationPage />} />
      <Route path="/invite/account" element={<EmployeeAccountPage />} />
      <Route path="/invite/verify" element={<EmployeeVerifyPage />} />
      <Route path="/invite/password" element={<EmployeePasswordPage />} />
      <Route path="/invite/mfa" element={<EmployeeMfaPage />} />
      <Route path="/invite/profile" element={<InvitationProfilePage />} />
      <Route path="/invite/confirm" element={<EmployeeConfirmPage />} />
      <Route path="/invite/welcome" element={<EmployeeWelcomePage />} />
      <Route path="/setup" element={<SetupHubPage />} />
      <Route path="/setup/company" element={<WizardCompanyPage />} />
      <Route path="/setup/tax" element={<WizardTaxPage />} />
      <Route path="/setup/branches" element={<WizardBranchesPage />} />
      <Route path="/setup/frequency" element={<WizardFrequencyPage />} />
      <Route path="/setup/pay-dates" element={<WizardPayDatesPage />} />
      <Route path="/setup/year" element={<WizardYearPage />} />
      <Route path="/setup/leave" element={<WizardLeavePage />} />
      <Route path="/setup/earnings" element={<WizardEarningsPage />} />
      <Route path="/setup/admins" element={<WizardAdminsPage />} />
      <Route path="/setup/review" element={<WizardReviewPage />} />
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
