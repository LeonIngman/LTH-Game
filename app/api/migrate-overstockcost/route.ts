import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Check if overstockCost column exists
    const columnExists = await sql`
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'GameDailyData' 
      AND column_name = 'overstockCost'
    `;

    if (columnExists.length === 0) {
      // Add overstockCost column
      await sql`
        ALTER TABLE "GameDailyData" ADD COLUMN "overstockCost" NUMERIC(10,2) NOT NULL DEFAULT 0
      `;

      // Add overstockCostDetails column
      await sql`
        ALTER TABLE "GameDailyData" ADD COLUMN "overstockCostDetails" TEXT DEFAULT '{}'
      `;

      // Added overstockCost and overstockCostDetails columns
    }

    // Check if overstockPenalty column exists and migrate data
    const oldColumnExists = await sql`
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'GameDailyData' 
      AND column_name = 'overstockPenalty'
    `;

    if (oldColumnExists.length > 0) {
      // Copy data from overstockPenalty to overstockCost
      await sql`
        UPDATE "GameDailyData" 
        SET "overstockCost" = COALESCE("overstockPenalty", 0)
        WHERE "overstockPenalty" IS NOT NULL
      `;

      // Copy data from overstockPenaltyDetails to overstockCostDetails
      const oldDetailsExists = await sql`
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'GameDailyData' 
        AND column_name = 'overstockPenaltyDetails'
      `;

      if (oldDetailsExists.length > 0) {
        await sql`
          UPDATE "GameDailyData" 
          SET "overstockCostDetails" = COALESCE("overstockPenaltyDetails", '{}')
          WHERE "overstockPenaltyDetails" IS NOT NULL
        `;

        // Drop old columns
        await sql`ALTER TABLE "GameDailyData" DROP COLUMN "overstockPenaltyDetails"`;
      }

      await sql`ALTER TABLE "GameDailyData" DROP COLUMN "overstockPenalty"`;
      // Migrated data from overstockPenalty to overstockCost
    }

    // Verify existing rows have default value of 0
    await sql`
      UPDATE "GameDailyData" 
      SET "overstockCost" = 0 
      WHERE "overstockCost" IS NULL
    `;

    // Get verification data
    const stats = await sql`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN "overstockCost" = 0 THEN 1 ELSE 0 END) as records_with_zero_overstock,
        SUM(CASE WHEN "overstockCost" > 0 THEN 1 ELSE 0 END) as records_with_overstock,
        AVG("overstockCost") as avg_overstock_cost
      FROM "GameDailyData"
    `;

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      stats: stats[0],
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: "Migration failed"
      },
      { status: 500 }
    );
  }
}
