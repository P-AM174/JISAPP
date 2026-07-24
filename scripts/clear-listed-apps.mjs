import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function main() {
  const prisma = new PrismaClient();

  try {
    const { data: apps, error: listError } = await supabase
      .from("apps")
      .select("id, title, status, is_listed");

    if (listError) {
      throw new Error(`Failed to list apps: ${listError.message}`);
    }

    const appRows = apps ?? [];
    const appIds = appRows.map((a) => a.id);
    console.log(`Found ${appRows.length} app(s) in Supabase apps table`);
    for (const app of appRows) {
      console.log(`  - ${app.id} | ${app.title} | status=${app.status} | listed=${app.is_listed}`);
    }

    if (appIds.length > 0) {
      const { error: stampError } = await supabase
        .from("app_user_data")
        .delete()
        .in("app_id", appIds);
      if (stampError) {
        console.warn("app_user_data cleanup warning:", stampError.message);
      } else {
        console.log(`Removed app_user_data for ${appIds.length} app(s)`);
      }
    }

    const { error: deleteAppsError, count: deletedAppsCount } = await supabase
      .from("apps")
      .delete({ count: "exact" })
      .not("id", "is", null);

    if (deleteAppsError) {
      throw new Error(`Failed to delete apps: ${deleteAppsError.message}`);
    }
    console.log(`Deleted ${deletedAppsCount ?? appRows.length} row(s) from apps`);

    const { error: projectError, count: deletedProjectsCount } = await supabase
      .from("user_projects")
      .delete({ count: "exact" })
      .not("app_id", "is", null);

    if (projectError) {
      console.warn("user_projects cleanup warning:", projectError.message);
    } else {
      console.log(`Deleted ${deletedProjectsCount ?? 0} published user_project(s)`);
    }

    const prismaProducts = await prisma.product.findMany({
      where: { isDemo: false },
      select: { id: true, title: true, status: true },
    });
    console.log(`Found ${prismaProducts.length} non-demo Prisma product(s)`);
    for (const product of prismaProducts) {
      console.log(`  - ${product.id} | ${product.title} | status=${product.status}`);
    }

    if (prismaProducts.length > 0) {
      const result = await prisma.product.deleteMany({ where: { isDemo: false } });
      console.log(`Deleted ${result.count} Prisma product(s)`);
    }

    console.log("Done. Refresh the homepage to verify the catalog is empty.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
