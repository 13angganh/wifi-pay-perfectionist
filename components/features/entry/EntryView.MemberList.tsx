// ══════════════════════════════════════════
// components/features/entry/EntryView.MemberList.tsx
// Dipecah dari EntryView.tsx (task 1.15)
// Daftar member card dalam entry view
// ══════════════════════════════════════════
'use client';
import MemberCard from '@/components/features/members/MemberCard';

interface Props { members: string[]; }

export default function EntryMemberList({ members }: Props) {

  if (members.length === 0) return (
    <div style={{ padding:'32px 0', textAlign:'center', color:'var(--txt4)', fontSize:13 }}>
      Tidak ada member ditemukan
    </div>
  );

  return (
    <>
      {members.map((name, i) => (
        <MemberCard
          key={name}
          index={i}
          name={name}
        />
      ))}
    </>
  );
}
