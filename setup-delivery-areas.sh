#!/bin/bash
# Delivery Areas Database Setup Script
# Run this to fully set up delivery areas persistence

echo "
╔════════════════════════════════════════════════════════════╗
║  🚀 Delivery Areas Database Setup                          ║
║                                                            ║
║  This will migrate delivery areas from in-memory to DB     ║
╚════════════════════════════════════════════════════════════╝
"

echo "📋 Step 1: Running migration script..."
npm run migrate:delivery-areas

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration successful!"
    echo ""
    echo "📋 Step 2: What you can do now:"
    echo ""
    echo "   1️⃣  Admin UI (No restart needed):"
    echo "       → Go to http://localhost:3173/admin/delivery-areas"
    echo "       → Add/delete/save areas"
    echo "       → Changes persist forever ✅"
    echo ""
    echo "   2️⃣  API Endpoints (Admin only):"
    echo "       → GET /api/admin/delivery-areas - Get all active areas"
    echo "       → POST /api/admin/delivery-areas - Add area"
    echo "       → PUT /api/admin/delivery-areas - Update all areas"
    echo "       → DELETE /api/admin/delivery-areas/:id - Delete area"
    echo "       → PATCH /api/admin/delivery-areas/:id/toggle - Enable/disable"
    echo ""
    echo "   3️⃣  Database (Direct queries):"
    echo "       → SELECT * FROM delivery_areas;"
    echo ""
    echo "📖 Full documentation: see DELIVERY_AREAS_DB_GUIDE.md"
    echo ""
    echo "✨ Setup complete! 🎉"
else
    echo "❌ Migration failed. Check errors above."
    exit 1
fi
