-- Demo Seed Data
-- Run AFTER migrations 00001–00016 and after creating users via Supabase Admin API

-- Organization
INSERT INTO organizations (id, legal_name_ar, legal_name_en, cr_number, headquarters_city) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'مجموعة شطرنج للخدمات',
   'Chessboard Group Services',
   '1010000001',
   'Riyadh');

-- Departments
INSERT INTO departments (id, org_id, name_ar, name_en, code) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'تقنية المعلومات', 'Information Technology', 'IT'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'المبيعات', 'Sales', 'SALES'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'الموارد البشرية', 'Human Resources', 'HR'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'المشتريات', 'Procurement', 'PROC'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'التسويق', 'Marketing', 'MKTG');

-- Establishments
INSERT INTO establishments (org_id, name_ar, name_en, activity_code, city, nitaqat_band, saudization_pct) VALUES
  ('00000000-0000-0000-0000-000000000001', 'المقر الرئيسي — الرياض', 'HQ - Riyadh',     '7810', 'Riyadh',  'platinum', 42.5),
  ('00000000-0000-0000-0000-000000000001', 'فرع جدة',              'Jeddah Branch',    '7810', 'Jeddah',  'green',    35.0),
  ('00000000-0000-0000-0000-000000000001', 'فرع الدمام',            'Dammam Branch',    '7810', 'Dammam',  'green',    38.0);

-- System Roles
INSERT INTO roles (id, org_id, name, description, is_system) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'platform_admin',      'Full platform access', true),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'hr_manager',          'HR management access', true),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'recruiter',           'Recruiting access', true),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'compliance_officer',  'Compliance access', true),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'hiring_manager',      'Hiring manager access', true),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'government_relations','Gov relations access', true);

-- Role Permissions
INSERT INTO role_permissions (role_id, permission) VALUES
  -- Platform Admin: everything
  ('20000000-0000-0000-0000-000000000001', 'user.manage'),
  ('20000000-0000-0000-0000-000000000001', 'role.manage'),
  ('20000000-0000-0000-0000-000000000001', 'org.manage'),
  ('20000000-0000-0000-0000-000000000001', 'requisition.manage'),
  ('20000000-0000-0000-0000-000000000001', 'job.manage'),
  ('20000000-0000-0000-0000-000000000001', 'candidate.manage'),
  ('20000000-0000-0000-0000-000000000001', 'candidate.view_sensitive'),
  ('20000000-0000-0000-0000-000000000001', 'application.manage'),
  ('20000000-0000-0000-0000-000000000001', 'offer.manage'),
  ('20000000-0000-0000-0000-000000000001', 'compliance.manage'),
  ('20000000-0000-0000-0000-000000000001', 'readiness.manage'),
  ('20000000-0000-0000-0000-000000000001', 'analytics.view'),
  ('20000000-0000-0000-0000-000000000001', 'audit.view'),
  -- HR Manager
  ('20000000-0000-0000-0000-000000000002', 'requisition.manage'),
  ('20000000-0000-0000-0000-000000000002', 'job.manage'),
  ('20000000-0000-0000-0000-000000000002', 'candidate.manage'),
  ('20000000-0000-0000-0000-000000000002', 'application.manage'),
  ('20000000-0000-0000-0000-000000000002', 'offer.manage'),
  ('20000000-0000-0000-0000-000000000002', 'readiness.manage'),
  ('20000000-0000-0000-0000-000000000002', 'analytics.view'),
  -- Recruiter
  ('20000000-0000-0000-0000-000000000003', 'job.manage'),
  ('20000000-0000-0000-0000-000000000003', 'candidate.manage'),
  ('20000000-0000-0000-0000-000000000003', 'application.manage'),
  -- Compliance Officer
  ('20000000-0000-0000-0000-000000000004', 'compliance.manage'),
  ('20000000-0000-0000-0000-000000000004', 'analytics.view'),
  -- Hiring Manager
  ('20000000-0000-0000-0000-000000000005', 'application.manage'),
  ('20000000-0000-0000-0000-000000000005', 'requisition.manage'),
  -- Gov Relations
  ('20000000-0000-0000-0000-000000000006', 'readiness.manage');

-- Make created_by nullable for seeding (no auth users exist yet)
ALTER TABLE compliance_rules ALTER COLUMN created_by DROP NOT NULL;

-- Saudi Compliance Rules
INSERT INTO compliance_rules (org_id, code, name_ar, name_en, rule_type, applies_to, condition_json, result_if_fail, effective_from, review_due_at)
SELECT
  '00000000-0000-0000-0000-000000000001',
  code, name_ar, name_en, rule_type,
  applies_to::text[],
  condition_json::jsonb,
  result_if_fail,
  effective_from::date,
  review_due_at::date
FROM (VALUES
  ('KSA-001', 'نطاقات — الحد الأدنى للسعودة', 'Nitaqat — Minimum Saudization', 'nitaqat', '{requisition}',
   '{"field":"saudization_pct","operator":"gte","value":40}', 'BLOCKED', '2024-01-01', '2025-12-31'),
  ('KSA-002', 'تحقق من صلاحية الإقامة', 'Valid Iqama Required for Non-Saudi', 'document', '{candidate}',
   '{"if":{"nationality":"non_saudi"},"then":{"iqama_valid":true}}', 'BLOCKED', '2024-01-01', '2025-12-31'),
  ('KSA-003', 'حد أقصى لفارق الراتب مع عقد قوى', 'Max Salary Discrepancy vs Qiwa Contract', 'contract', '{offer}',
   '{"field":"salary_discrepancy_pct","operator":"lte","value":5}', 'WARNING', '2024-01-01', '2025-12-31'),
  ('KSA-004', 'تسجيل في التأمينات الاجتماعية (GOSI)', 'GOSI Registration Required', 'government', '{readiness}',
   '{"field":"gosi_registered","operator":"eq","value":true}', 'BLOCKED', '2024-01-01', '2025-12-31'),
  ('KSA-005', 'وثيقة تأشيرة سارية للوافدين', 'Valid Work Visa for Overseas Hires', 'document', '{readiness}',
   '{"if":{"branch_type":"overseas"},"then":{"visa_valid":true}}', 'BLOCKED', '2024-01-01', '2025-12-31'),
  ('KSA-006', 'عقد عمل موثق عبر قوى', 'Qiwa Labour Contract Authentication', 'contract', '{readiness,offer}',
   '{"field":"qiwa_contract_authenticated","operator":"eq","value":true}', 'BLOCKED', '2024-01-01', '2026-12-31'),
  ('KSA-007', 'وثيقة تأمين طبي سارية', 'Valid Medical Insurance Coverage', 'document', '{readiness}',
   '{"field":"medical_insurance_valid","operator":"eq","value":true}', 'BLOCKED', '2024-01-01', '2026-12-31'),
  ('KSA-008', 'حد أقصى للراتب الإجمالي النسبي للسعوديين', 'Saudi Wage Protection Compliance', 'payroll', '{readiness}',
   '{"field":"wps_compliant","operator":"eq","value":true}', 'BLOCKED', '2024-07-01', '2026-12-31'),
  ('KSA-009', 'شهادة مزاولة المهنة (المهن المرخصة)', 'Professional License for Regulated Roles', 'document', '{candidate}',
   '{"if":{"role_requires_license":true},"then":{"professional_license_valid":true}}', 'BLOCKED', '2024-01-01', '2026-12-31'),
  ('KSA-010', 'حد أقصى للعمالة الوافدة لكل منشأة', 'Max Expat Ratio per Establishment', 'nitaqat', '{requisition}',
   '{"field":"expat_ratio_pct","operator":"lte","value":60}', 'WARNING', '2024-01-01', '2026-06-30'),
  ('KSA-011', 'شرط إشعار مسبق لإنهاء العقد', 'Minimum Notice Period on Termination', 'contract', '{readiness}',
   '{"field":"notice_period_days","operator":"gte","value":30}', 'WARNING', '2024-01-01', '2026-12-31'),
  ('KSA-012', 'توثيق الجهة المُعلِّمة لعمالة المنازل', 'Domestic Worker Agency Accreditation', 'document', '{candidate}',
   '{"if":{"worker_category":"domestic"},"then":{"agency_accredited":true}}', 'BLOCKED', '2024-01-01', '2026-12-31'),
  ('KSA-013', 'اشتراط الفحص الطبي للوافدين', 'Medical Clearance for Expatriate Hires', 'document', '{candidate}',
   '{"and":[{"field":"nationality","operator":"neq","value":"SA"},{"field":"medical_clearance_valid","operator":"eq","value":true}]}',
   'BLOCKED', '2024-01-01', '2026-12-31'),
  ('KSA-014', 'تحديد سقف الأجر الأساسي مقابل البدلات', 'Basic Salary Minimum 75% of Total Package', 'payroll', '{offer}',
   '{"field":"basic_salary_ratio","operator":"gte","value":0.75}', 'WARNING', '2024-07-01', '2026-12-31'),
  ('KSA-015', 'التحقق من عدم وجود حظر سفر للمرشح', 'Candidate Travel Ban Check', 'government', '{candidate}',
   '{"field":"travel_ban_clear","operator":"eq","value":true}', 'BLOCKED', '2024-01-01', '2026-12-31')
) AS t(code, name_ar, name_en, rule_type, applies_to, condition_json, result_if_fail, effective_from, review_due_at);

-- Sourcing Channels
INSERT INTO sourcing_channels (org_id, name, type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'LinkedIn',       'social'),
  ('00000000-0000-0000-0000-000000000001', 'Bayt.com',       'job_board'),
  ('00000000-0000-0000-0000-000000000001', 'Careers Page',   'direct'),
  ('00000000-0000-0000-0000-000000000001', 'Employee Referral', 'referral'),
  ('00000000-0000-0000-0000-000000000001', 'Recruitment Agency', 'agency');

-- Rejection Reasons
INSERT INTO rejection_reasons (org_id, reason_en, reason_ar) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Insufficient experience',     'خبرة غير كافية'),
  ('00000000-0000-0000-0000-000000000001', 'Qualification mismatch',      'عدم تطابق المؤهلات'),
  ('00000000-0000-0000-0000-000000000001', 'Position filled internally',  'تم شغل الوظيفة داخلياً'),
  ('00000000-0000-0000-0000-000000000001', 'Salary expectation mismatch', 'عدم توافق توقعات الراتب'),
  ('00000000-0000-0000-0000-000000000001', 'Failed assessment',           'رسب في الاختبار');
