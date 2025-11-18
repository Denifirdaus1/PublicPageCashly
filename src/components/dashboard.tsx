'use client';

import Image from "next/image";
import { useState } from "react";

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
  members: {
    id: string;
    name: string;
    avatarUrl?: string;
    targetCents: number;
    savedCents: number;
    progressPct: number;
  }[];
  entries: {
    id: string;
    memberId: string;
    memberName: string;
    amountCents: number;
    type: "deposit" | "withdraw";
    note?: string | null;
    date: string;
  }[];
};

const tabs = [
  { id: "summary", label: "Ringkasan" },
  { id: "members", label: "Anggota" },
  { id: "transactions", label: "Transaksi" },
];

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatCurrency(cents: number) {
  return currency.format(Math.max(0, Math.floor(cents / 100)));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function Avatar({
  name,
  src,
}: {
  name: string;
  src?: string | null;
}) {
  if (src) {
    return (
      <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[var(--border)] bg-white shadow-sm">
        <Image
          alt={name}
          src={src}
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--primary-faded)] text-base font-semibold text-[var(--primary)]">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--primary-faded)]">
      <div
        className="h-full rounded-full bg-[var(--primary)] transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function StatPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-faded)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
      {children}
    </span>
  );
}

export default function Dashboard({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    data.members[0]?.id ?? null,
  );
  const [showMemberModal, setShowMemberModal] = useState(false);

  const selectedMember = data.members.find(
    (m) => m.id === selectedMemberId,
  );
  const selectedEntries =
    selectedMemberId === null
      ? []
      : data.entries.filter((e) => e.memberId === selectedMemberId);

  const totalTransactions = data.entries.length;

  const renderSummary = () => (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[var(--border)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Tujuan</p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {data.group.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Target tabungan bersama untuk liburan
            </p>
          </div>
          <StatPill>{data.group.progressPct.toFixed(0)}%</StatPill>
        </div>
        <div className="mt-4 space-y-3">
          <ProgressBar value={data.group.progressPct} />
          <div className="flex items-center justify-between text-sm text-[var(--muted)]">
            <span>
              {formatCurrency(data.group.savedCents)} /{" "}
              {formatCurrency(data.group.targetCents)}
            </span>
            <span>{data.group.memberCount} anggota</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Terkumpul</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatCurrency(data.group.savedCents)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">Sampai hari ini</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Target bersama</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatCurrency(data.group.targetCents)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {data.group.progressPct.toFixed(0)}% tercapai
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Transaksi</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {totalTransactions}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">Riwayat anggota</p>
        </div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-3">
      {data.members.map((member) => {
        const target = member.targetCents || 1;
        const contributionPct = Math.min(
          100,
          (member.savedCents / target) * 100,
        );

        return (
          <button
            key={member.id}
            onClick={() => {
              setSelectedMemberId(member.id);
              setShowMemberModal(true);
            }}
            className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-[var(--border)] transition hover:ring-[var(--primary)]/60"
          >
            <Avatar name={member.name} src={member.avatarUrl} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{member.name}</p>
                <span className="text-xs font-semibold text-[var(--primary)]">
                  {contributionPct.toFixed(0)}%
                </span>
              </div>
              <ProgressBar value={contributionPct} />
              <p className="text-xs text-[var(--muted)]">
                {formatCurrency(member.savedCents)} /{" "}
                {formatCurrency(member.targetCents)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-3">
      {data.entries.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-[var(--muted)] shadow-sm ring-1 ring-[var(--border)]">
          Belum ada transaksi anggota.
        </div>
      ) : (
        data.entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--border)]"
          >
            <div
              className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${entry.type === "deposit" ? "bg-[var(--primary-faded)] text-[var(--primary)]" : "bg-red-50 text-red-500"}`}
            >
              {entry.type === "deposit" ? "+" : "-"}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">
                  {formatCurrency(entry.amountCents)}
                </p>
                <span className="text-xs text-[var(--muted)]">
                  {formatDate(entry.date)}
                </span>
              </div>
              <p className="text-sm text-slate-700">{entry.memberName}</p>
              <p className="text-xs text-[var(--muted)]">
                {entry.note ?? "Setoran tabungan"}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            aria-label="Kembali"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-[var(--border)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <Avatar name={data.group.name} src={data.group.avatarUrl} />
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {data.group.name}
              </h1>
              <p className="text-sm text-[var(--muted)]">
                Tabungan tipe bersama
              </p>
            </div>
          </div>
        </div>
        <StatPill>
          <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
          Real-time dari Supabase
        </StatPill>
      </header>

      <nav className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-[var(--primary)] text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-[var(--border)]"}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "summary" && (
        <div className="space-y-5">
          {renderSummary()}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[var(--border)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Anggota</h3>
              <button
                onClick={() => setActiveTab("members")}
                className="text-sm font-semibold text-[var(--primary)]"
              >
                Lihat semua
              </button>
            </div>
            <div className="space-y-3">
              {data.members.slice(0, 4).map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setSelectedMemberId(member.id);
                    setShowMemberModal(true);
                  }}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <Avatar name={member.name} src={member.avatarUrl} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {member.name}
                      </p>
                      <span className="text-xs font-semibold text-[var(--primary)]">
                        {member.progressPct.toFixed(0)}%
                      </span>
                    </div>
                    <ProgressBar value={member.progressPct} />
                    <p className="text-xs text-[var(--muted)]">
                      {formatCurrency(member.savedCents)} /{" "}
                      {formatCurrency(member.targetCents)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[var(--border)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Riwayat transaksi
              </h3>
              <button
                onClick={() => setActiveTab("transactions")}
                className="text-sm font-semibold text-[var(--primary)]"
              >
                Lihat semua
              </button>
            </div>
            <div className="space-y-3">
              {data.entries.slice(0, 4).map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div
                    className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${entry.type === "deposit" ? "bg-[var(--primary-faded)] text-[var(--primary)]" : "bg-red-50 text-red-500"}`}
                  >
                    {entry.type === "deposit" ? "+" : "-"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(entry.amountCents)}
                      </p>
                      <span className="text-xs text-[var(--muted)]">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{entry.memberName}</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {entry.note ?? "Setoran tabungan"}
                    </p>
                  </div>
                </div>
              ))}
              {data.entries.length === 0 && (
                <p className="text-xs text-[var(--muted)]">
                  Belum ada riwayat transaksi.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "members" && renderMembers()}
      {activeTab === "transactions" && renderTransactions()}

      <div className="fixed inset-x-0 bottom-6 flex justify-center sm:static sm:justify-end">
        <button
          onClick={() => setActiveTab("transactions")}
          className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/25 transition hover:translate-y-[-1px] hover:shadow-xl sm:shadow-sm sm:shadow-[var(--primary)]/20"
        >
          <span className="inline-block rounded-full bg-white/20 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 7.5V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v1.5m18 0V18a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V7.5m18 0H3m3.75 3h.008v.008H6.75V10.5zm0 3h.008v.008H6.75V13.5zm0 3h.008v.008H6.75V16.5zm4.5-6h6m-6 3h6m-6 3h6"
              />
            </svg>
          </span>
          Transaksi
        </button>
      </div>

      {showMemberModal && selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail transaksi ${selectedMember.name}`}
          onClick={() => setShowMemberModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl ring-1 ring-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={selectedMember.name} src={selectedMember.avatarUrl} />
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedMember.name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Total setoran: {formatCurrency(selectedMember.savedCents)} /{" "}
                    {formatCurrency(selectedMember.targetCents)}
                  </p>
                </div>
              </div>
              <button
                aria-label="Tutup"
                onClick={() => setShowMemberModal(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-3 flex items-center gap-2 text-sm text-[var(--muted)]">
              <StatPill>
                {Math.min(
                  100,
                  selectedMember.targetCents > 0
                    ? (selectedMember.savedCents / selectedMember.targetCents) * 100
                    : 0,
                ).toFixed(0)}
                %
              </StatPill>
              <span>{selectedEntries.length} transaksi</span>
            </div>

            {selectedEntries.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Belum ada transaksi anggota ini.
              </p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {selectedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between rounded-xl border border-[var(--border)] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(entry.amountCents)}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {entry.note ?? "Setoran tabungan"}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-[var(--muted)]">
                      <p>{formatDate(entry.date)}</p>
                      <p className="font-semibold text-[var(--primary)]">
                        {entry.type === "deposit" ? "Deposit" : "Withdraw"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
