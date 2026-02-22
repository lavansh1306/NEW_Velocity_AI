#!/bin/bash
# Quick test script to verify Leave Management setup

echo "🔍 Checking Leave Management Setup..."
echo ""

# Check if migration file exists
if [ -f "supabase-migrations/create_leave_management_tables.sql" ]; then
    echo "✅ Migration file exists"
else
    echo "❌ Migration file missing"
fi

# Check if index.tsx was updated
if grep -q "handleApplyLeave called with" "src/components/leave-management/index.tsx"; then
    echo "✅ handleApplyLeave has been updated with logging"
else
    echo "❌ handleApplyLeave not updated properly"
fi

# Check for fetch enhancement
if grep -q "Fetching leaves for org" "src/components/leave-management/index.tsx"; then
    echo "✅ fetchSupabaseLeaves has been enhanced"
else
    echo "❌ fetchSupabaseLeaves not enhanced"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Run the migration in Supabase SQL Editor"
echo "2. npm run dev"
echo "3. Test submitting a leave request from Employee View"
echo "4. Check browser console for [LeaveManagement] logs"
echo "5. Verify in Supabase: SELECT * FROM leave_requests;"
echo ""
echo "📖 Full documentation: LEAVE_MANAGEMENT_FIX.md"
