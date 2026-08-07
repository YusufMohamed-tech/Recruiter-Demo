-- Approval Workflows, Requests, Steps

CREATE TABLE approval_workflows (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  resource_type   text NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_by      uuid NOT NULL REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE approval_workflow_steps (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     uuid NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order      int NOT NULL,
  step_name       text NOT NULL,
  approver_type   text NOT NULL DEFAULT 'user',
  approver_id     uuid REFERENCES users(id),
  approver_role_id uuid REFERENCES roles(id),
  approval_mode   text NOT NULL DEFAULT 'any_one',
  sla_hours       int NOT NULL DEFAULT 48,
  UNIQUE(workflow_id, step_order)
);

CREATE TABLE approval_requests (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id     uuid REFERENCES approval_workflows(id),
  resource_type   text NOT NULL,
  resource_id     uuid NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  requester_id    uuid NOT NULL REFERENCES users(id),
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  notes           text
);

CREATE TABLE approval_steps (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_request_id   uuid NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_order            int NOT NULL,
  step_name             text NOT NULL,
  approver_id           uuid REFERENCES users(id),
  sla_hours             int NOT NULL DEFAULT 48,
  status                text NOT NULL DEFAULT 'pending',
  decision              text,
  comments              text,
  decided_at            timestamptz,
  reminder_sent_at      timestamptz,
  delegated_to          uuid REFERENCES users(id)
);

CREATE INDEX idx_approval_requests_resource ON approval_requests(resource_type, resource_id);
CREATE INDEX idx_approval_requests_org ON approval_requests(org_id);
CREATE INDEX idx_approval_steps_request ON approval_steps(approval_request_id);
