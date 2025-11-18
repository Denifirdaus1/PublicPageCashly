import Dashboard from "@/components/dashboard";
import { getSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  target_total_cents: number;
  avatar_url: string | null;
};

type MemberRow = {
  id: string;
  display_name: string;
  target_amount_cents: number | null;
  avatar_url: string | null;
};

type EntryRow = {
  id: string;
  member_id: string;
  transaction_date: string;
  amount_cents: number;
  type: "deposit" | "withdraw";
  note: string | null;
};

type MemberStat = {
  id: string;
  name: string;
  avatarUrl?: string;
  targetCents: number;
  savedCents: number;
  progressPct: number;
};

type EntryView = {
  id: string;
  memberId: string;
  memberName: string;
  amountCents: number;
  type: EntryRow["type"];
  note?: string | null;
  date: string;
};

type DashboardData = {
  group: {
    id: string;
    name: string;
    targetCents: number;
    savedCents: number;
    progressPct: number;
    memberCount: number;
    description?: string | null;
    avatarUrl?: string | null;
  };
  members: MemberStat[];
  entries: EntryView[];
};

async function loadDashboardData(): Promise<DashboardData | null> {
  const supabase = getSupabaseClient();
  const preferredGroupName = "Liburan";

  const groupByName = await supabase
    .from("saving_groups")
    .select("id,name,description,target_total_cents,avatar_url")
    .eq("name", preferredGroupName)
    .limit(1)
    .maybeSingle();

  let group: GroupRow | null = groupByName.data;

  if (!group) {
    const fallbackGroup = await supabase
      .from("saving_groups")
      .select("id,name,description,target_total_cents,avatar_url")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    group = fallbackGroup.data ?? null;
  }

  if (!group) return null;

  const [membersResponse, entriesResponse] = await Promise.all([
    supabase
      .from("saving_group_members")
      .select("id,display_name,target_amount_cents,avatar_url")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("saving_group_entries")
      .select("id,member_id,transaction_date,amount_cents,type,note")
      .eq("group_id", group.id)
      .order("transaction_date", { ascending: false }),
  ]);

  const members: MemberRow[] = membersResponse.data ?? [];
  const entries: EntryRow[] = entriesResponse.data ?? [];

  const contributionByMember = new Map<string, number>();
  const totalSavedCents = entries.reduce((acc, entry) => {
    const signedAmount =
      entry.type === "withdraw" ? -entry.amount_cents : entry.amount_cents;
    contributionByMember.set(
      entry.member_id,
      (contributionByMember.get(entry.member_id) ?? 0) + signedAmount,
    );
    return acc + signedAmount;
  }, 0);

  const membersStats: MemberStat[] = members.map((member) => {
    const savedCents = contributionByMember.get(member.id) ?? 0;
    const targetCents = member.target_amount_cents ?? 0;
    const progressPct =
      targetCents > 0 ? Math.min(100, (savedCents / targetCents) * 100) : 0;

    return {
      id: member.id,
      name: member.display_name,
      avatarUrl: member.avatar_url ?? undefined,
      targetCents,
      savedCents,
      progressPct,
    };
  });

  const entryViews: EntryView[] = entries.map((entry) => {
    const memberName =
      members.find((m) => m.id === entry.member_id)?.display_name ??
      "Tidak diketahui";

    return {
      id: entry.id,
      memberId: entry.member_id,
      memberName,
      amountCents: entry.amount_cents,
      type: entry.type,
      note: entry.note,
      date: entry.transaction_date,
    };
  });

  const groupProgress =
    group.target_total_cents > 0
      ? Math.min(100, (totalSavedCents / group.target_total_cents) * 100)
      : 0;

  return {
    group: {
      id: group.id,
      name: group.name,
      targetCents: group.target_total_cents,
      savedCents: totalSavedCents,
      progressPct: groupProgress,
      memberCount: members.length,
      description: group.description,
      avatarUrl: group.avatar_url,
    },
    members: membersStats,
    entries: entryViews,
  };
}

export default async function Home() {
  const dashboardData = await loadDashboardData();

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6">
        {dashboardData ? (
          <Dashboard data={dashboardData} />
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">
              Data tabungan belum tersedia
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Pastikan tabel saving_groups terisi untuk menampilkan dashboard.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
