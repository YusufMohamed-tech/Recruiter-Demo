-- RLS for offers tables (00009_offers.sql created the tables but no policies)
ALTER TABLE offers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_versions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY offers_org ON offers
  USING (org_id = auth_org_id());

CREATE POLICY offers_org_insert ON offers FOR INSERT
  WITH CHECK (org_id = auth_org_id());

CREATE POLICY offers_org_update ON offers FOR UPDATE
  USING (org_id = auth_org_id());

CREATE POLICY offer_versions_org ON offer_versions
  USING (EXISTS (
    SELECT 1 FROM offers o WHERE o.id = offer_id AND o.org_id = auth_org_id()
  ));

CREATE POLICY offer_versions_insert ON offer_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM offers o WHERE o.id = offer_id AND o.org_id = auth_org_id()
  ));

CREATE POLICY offer_responses_org ON offer_responses
  USING (EXISTS (
    SELECT 1 FROM offers o WHERE o.id = offer_id AND o.org_id = auth_org_id()
  ));
