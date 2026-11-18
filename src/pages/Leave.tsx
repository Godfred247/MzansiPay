import { useState } from "react";
import { fullName, leaveTone } from "../domain.ts";
import { formatDate } from "../format.ts";
import { useApp, useOrg } from "../state.tsx";
import { useWorkspace } from "../workspace.ts";
import { Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, Field, PageHeader, Textarea } from "../ui.tsx";

export function LeavePage() {
  const { leave, employees, org } = useOrg();
  const { dispatch } = useApp();
  const { actor } = useWorkspace();
  const [decision, setDecision] = useState<{ id: string; type: "approved" | "declined" } | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = leave.filter((request) => status === "all" || request.status === status);
  const totals = employees.filter((employee) => employee.status === "active").reduce(
    (sum, employee) => ({ annual: sum.annual + employee.leave.annual, sick: sum.sick + employee.leave.sick, family: sum.family + employee.leave.family }),
    { annual: 0, sick: 0, family: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Leave" description="Annual, sick and family responsibility balances are the sample company's records." />
      {employees.length === 0 ? (
        <EmptyState title="No leave records" body="Leave balances appear after employees are added." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Annual days on record", totals.annual],
              ["Sick days on record", totals.sick],
              ["Family responsibility days", totals.family],
            ].map(([label, value]) => (
              <Card key={String(label)}>
                <p className="text-sm text-muted">{label}</p>
                <p className="num mt-1 text-2xl font-semibold">{value}</p>
              </Card>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "approved", "declined"].map((item) => (
              <Button key={item} size="sm" variant={status === item ? "primary" : "secondary"} onClick={() => setStatus(item)}>
                {item === "all" ? "All" : item[0].toUpperCase() + item.slice(1)}
              </Button>
            ))}
          </div>
          <DataTable
            rows={filtered}
            getId={(request) => request.id}
            resetKey={status}
            empty={<EmptyState title="Nothing in this view" body="Declined requests appear here after you decline one. Pending requests are the ones that need a decision." />}
            columns={[
              {
                key: "employee",
                header: "Employee",
                sortValue: (request) => request.employeeId,
                render: (request) => fullName(employees.find((employee) => employee.id === request.employeeId) ?? { firstName: "Former", lastName: "employee" }),
              },
              { key: "type", header: "Type", sortValue: (request) => request.type, render: (request) => request.type },
              { key: "dates", header: "Dates", sortValue: (request) => request.start, render: (request) => `${formatDate(request.start)} – ${formatDate(request.end)}` },
              { key: "days", header: "Days", align: "right", sortValue: (request) => request.days, render: (request) => request.days },
              { key: "status", header: "Status", render: (request) => <Badge tone={leaveTone(request.status)}>{request.status}</Badge> },
              {
                key: "action",
                header: "",
                render: (request) =>
                  request.status === "pending" ? (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => { setDecision({ id: request.id, type: "approved" }); setNote(""); setError(""); }}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => { setDecision({ id: request.id, type: "declined" }); setNote(""); setError(""); }}>
                        Decline
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">{request.decisionNote}</span>
                  ),
              },
            ]}
          />
        </>
      )}
      <ConfirmDialog
        open={decision !== null}
        title={decision?.type === "approved" ? "Approve this leave?" : "Decline this leave?"}
        confirmLabel={decision?.type === "approved" ? "Approve leave" : "Decline leave"}
        tone={decision?.type === "declined" ? "danger" : "primary"}
        onClose={() => setDecision(null)}
        onConfirm={() => {
          if (!decision) return;
          if (decision.type === "declined" && note.trim().length < 3) {
            setError("Enter a reason for declining.");
            return;
          }
          dispatch({
            type: "decide-leave",
            id: decision.id,
            decision: decision.type,
            note: note.trim() || "Approved.",
            actor,
          });
          setDecision(null);
        }}
        body={
          <div className="space-y-3">
            <p>The employee sees the outcome on the next refresh of their own record. This does not change a statutory leave rule.</p>
            <Field label={decision?.type === "declined" ? "Reason" : "Note"} htmlFor="leave-note" error={error}>
              <Textarea id="leave-note" invalid={Boolean(error)} value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
          </div>
        }
      />
    </div>
  );
}
