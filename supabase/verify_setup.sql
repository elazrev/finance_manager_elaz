-- ============================================
-- סקריפט בדיקה - ודא שהכל נוצר בהצלחה
-- ============================================

-- בדוק שהטבלאות נוצרו
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'clients', 'items', 'invoices', 'quotes')
ORDER BY table_name;

-- בדוק שה-Functions נוצרו
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('generate_invoice_number', 'calculate_invoice_total', 'update_updated_at_column')
ORDER BY routine_name;

-- בדוק ש-RLS מופעל על כל הטבלאות
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'clients', 'items', 'invoices', 'quotes')
ORDER BY tablename;

-- בדוק שה-Policies נוצרו
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- בדוק שה-Triggers נוצרו
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;
