-- Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('cv-uploads',      'cv-uploads',      false, 10485760,  '{"application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}'),
  ('documents',       'documents',       false, 20971520,  '{"application/pdf","image/png","image/jpeg"}'),
  ('offer-documents', 'offer-documents', false, 10485760,  '{"application/pdf"}'),
  ('evidence-files',  'evidence-files',  false, 20971520,  NULL),
  ('org-logos',       'org-logos',       true,  5242880,   '{"image/png","image/jpeg","image/webp","image/avif"}')
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "cv_uploads_auth" ON storage.objects
  FOR ALL USING (bucket_id = 'cv-uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "documents_auth" ON storage.objects
  FOR ALL USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "offer_documents_auth" ON storage.objects
  FOR ALL USING (bucket_id = 'offer-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "evidence_auth" ON storage.objects
  FOR ALL USING (bucket_id = 'evidence-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "org_logos_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'org-logos');
