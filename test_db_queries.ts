import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const client = createClient(url, key);

const USER_ID = '5572125a-fcdb-4cb1-8262-2a7c07ff7441';          // sukriti1908
const ORG_ID = '5ff59891-3c71-4d98-91b2-973b4e87d6f1';           // ABC Company

async function testQueries() {
  console.log('Testing db.ts queries for Employee...\n');

  try {
    console.log('1. getHolidays');
    const { data: hData, error: hErr } = await client
      .from('holidays')
      .select('id, name, date')
      .eq('organization_id', ORG_ID)
      .order('date', { ascending: true });
    
    if (hErr) console.error('  ERROR:', hErr);
    else console.log(`  SUCCESS: Found ${hData?.length} holidays`);

  } catch (e) { console.error('  CAUGHT EXCEPTION:', e); }

  try {
    console.log('\n2. getLeaveTypes');
    const { data: ltData, error: ltErr } = await client
      .from('leave_types')
      .select('id, name, default_days, is_active')
      .eq('organization_id', ORG_ID)
      .eq('is_active', true)
      .order('name');
    
    if (ltErr) console.error('  ERROR:', ltErr);
    else console.log(`  SUCCESS: Found ${ltData?.length} leave types`);

  } catch (e) { console.error('  CAUGHT EXCEPTION:', e); }

  try {
    console.log('\n3. getLeaveBalances');
    const { data: lbData, error: lbErr } = await client
      .from('employee_leave_balances')
      .select(`
        id,
        leave_type_id,
        total_days,
        used_days,
        remaining_days,
        leave_types ( name )
      `)
      .eq('organization_id', ORG_ID)
      .eq('user_id', USER_ID);
    
    if (lbErr) console.error('  ERROR:', lbErr);
    else console.log(`  SUCCESS: Found ${lbData?.length} balances`);

  } catch (e) { console.error('  CAUGHT EXCEPTION:', e); }

  console.log('\nDone.');
}

testQueries();
