import React, { useEffect, useState } from 'react';


if (typeof window !== 'undefined' && !(window as any).XLSX) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  document.head.appendChild(script);
}

// TypeScript Interfaces
interface Member {
  id: string;
  name: string;
}

interface Split {
  memberId: string;
  amount: number;
}

interface Expense {
  id: string;
  title: string;
  payerId: string;
  total: number;
  splits: Split[];
  category: string;
  date: string;
}

interface Trip {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
}

interface NewTripModalProps {
  onClose: () => void;
  onCreate: (trip: Trip) => void;
}

interface TripCardProps {
  trip: Trip;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

interface MemberListProps {
  members: Member[];
  addMember: (member: Member) => void;
  removeMember: (id: string) => void;
}

interface ExpenseFormProps {
  members: Member[];
  onAdd: (expense: Expense) => void;
}

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  onDelete: (id: string) => void;
}

interface SummaryPanelProps {
  trip: Trip;
}

// TripExpenseApp.tsx
// Single-file React component (Tailwind CSS expected in parent project)
// Default export at bottom

// Data model (saved to localStorage):
// trips: [{ id, name, members: [{id,name}], expenses: [{id, title, payerId, total, splits: [{memberId, amount}], category, date}] }]

function uid(prefix: string = ''): string {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function currency(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function useLocalState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch (e) {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
}

function NewTripModal({ onClose, onCreate }: NewTripModalProps) {
  const [name, setName] = useState<string>('');
  const create = () => {
    if (!name.trim()) return alert('Enter trip name');
    onCreate({ id: uid('t_'), name: name.trim(), members: [], expenses: [] });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Create new trip</h3>
        <input 
          className="w-full border p-2 rounded mb-4" 
          value={name} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
          placeholder="Trip name" 
        />
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={create}>Create</button>
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, onOpen, onDelete }: TripCardProps) {
  const total = trip.expenses.reduce((s: number, e: Expense) => s + Number(e.total), 0);
  return (
    <div className="border p-4 rounded-lg shadow-sm bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-lg">{trip.name}</h4>
          <div className="text-sm text-gray-600">Members: {trip.members.length} • Expenses: {trip.expenses.length}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total</div>
          <div className="font-bold">₹{currency(total)}</div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded" onClick={() => onOpen(trip.id)}>Open</button>
        <button className="px-3 py-2 border rounded" onClick={() => onDelete(trip.id)}>Delete</button>
      </div>
    </div>
  );
}

function MemberList({ members, addMember, removeMember }: MemberListProps) {
  const [name, setName] = useState<string>('');
  return (
    <div className="border rounded p-3 bg-white">
      <h5 className="font-medium mb-2">Members</h5>
      <div className="flex gap-2 mb-3">
        <input 
          value={name} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
          placeholder="Member name" 
          className="flex-1 border p-2 rounded" 
        />
        <button 
          className="px-3 py-2 bg-green-600 text-white rounded" 
          onClick={() => { 
            if (!name.trim()) return; 
            addMember({ id: uid('m_'), name: name.trim() }); 
            setName(''); 
          }}
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {members.map((m: Member) => (
          <div key={m.id} className="px-3 py-1 bg-gray-100 rounded flex items-center gap-2">
            <div className="text-sm">{m.name}</div>
            <button className="text-xs text-red-600" onClick={() => removeMember(m.id)}>remove</button>
          </div>
        ))}
        {members.length === 0 && <div className="text-sm text-gray-500">No members yet</div>}
      </div>
    </div>
  );
}

function ExpenseForm({ members, onAdd }: ExpenseFormProps) {
  const categories = ['bus','auto','petrol', 'car', 'hotel', 'food','other'];
  const [title, setTitle] = useState<string>('');
  const [payerId, setPayerId] = useState<string>(members[0]?.id || '');
  const [total, setTotal] = useState<string>('');
  const [category, setCategory] = useState<string>('food');
  const [method, setMethod] = useState<'equal' | 'unequal'>('equal');
  const [selected, setSelected] = useState<string[]>(() => members.map((m: Member) => m.id));
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

useEffect(() => {
  setPayerId(members[0]?.id || '');
  setSelected(members.map((m) => m.id));
}, [members]);

  const toggleSelected = (id: string) => {
    setSelected((prev: string[]) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = () => {
    if (!title.trim()) return alert('Title required');
    const t = Number(total);
    if (!t || t <= 0) return alert('Enter valid total');
    let splits: Split[] = [];
    if (method === 'equal') {
      const participants = selected.length || members.length;
      const per = t / (participants || 1);
      const targets = (participants ? selected : members.map((m: Member) => m.id));
      splits = targets.map((id: string) => ({ memberId: id, amount: Number(currency(per)) }));
    } else {
      // unequal: customSplits must add up to total
      const entries = Object.entries(customSplits).map(([memberId, amt]: [string, string]) => ({ memberId, amount: Number(amt || 0) }));
      const sum = entries.reduce((s: number, e: Split) => s + e.amount, 0);
      if (Math.abs(sum - t) > 0.01) return alert(`Custom splits must add up to total (current ${currency(sum)})`);
      splits = entries.filter((e: Split) => e.amount > 0);
    }

    onAdd({ 
      id: uid('e_'), 
      title: title.trim(), 
      payerId, 
      total: Number(t), 
      splits, 
      category, 
      date: new Date().toISOString() 
    });
    // reset
    setTitle('');
    setTotal('');
    setSelected(members.map((m: Member) => m.id));
    setCustomSplits({});
    setMethod('equal');
  };

  return (
    <div className="border rounded p-3 bg-white">
      <h5 className="font-medium mb-2">Add expense</h5>
      <input 
        value={title} 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
        placeholder="Expense title" 
        className="w-full border p-2 rounded mb-2" 
      />
      <div className="flex gap-2 mb-2">
        <select 
          value={payerId} 
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPayerId(e.target.value)} 
          className="flex-1 border p-2 rounded"
        >
          {members.map((m: Member) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input 
          value={total} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotal(e.target.value)} 
          placeholder="Total" 
          className="w-28 border p-2 rounded" 
        />
        <select 
          value={category} 
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)} 
          className="w-36 border p-2 rounded"
        >
          {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="mb-2">
        <div className="text-sm mb-1">Split method</div>
        <div className="flex gap-2">
          <label className={`px-3 py-1 border rounded ${method==='equal' ? 'bg-gray-100' : ''}`}>
            <input 
              type="radio" 
              name="method" 
              checked={method==='equal'} 
              onChange={() => setMethod('equal')} 
            /> Equal
          </label>
          <label className={`px-3 py-1 border rounded ${method==='unequal' ? 'bg-gray-100' : ''}`}>
            <input 
              type="radio" 
              name="method" 
              checked={method==='unequal'} 
              onChange={() => setMethod('unequal')} 
            /> Custom
          </label>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-sm mb-1">Participants</div>
        <div className="flex flex-wrap gap-2">
          {members.map((m: Member) => (
            <label key={m.id} className={`px-2 py-1 border rounded ${selected.includes(m.id) ? 'bg-gray-100' : ''}`}>
              <input 
                type="checkbox" 
                checked={selected.includes(m.id)} 
                onChange={() => toggleSelected(m.id)} 
              /> {m.name}
            </label>
          ))}
        </div>
      </div>

      {method === 'unequal' && (
        <div className="mb-2">
          <div className="text-sm mb-1">Custom split amounts (must sum to total)</div>
          <div className="flex flex-col gap-2">
            {members.map((m: Member) => (
              <div key={m.id} className="flex gap-2 items-center">
                <div className="w-28 text-sm">{m.name}</div>
                <input 
                  className="flex-1 border p-2 rounded" 
                  value={customSplits[m.id] ?? ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomSplits(prev => ({ ...prev, [m.id]: e.target.value }))} 
                  placeholder="0" 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button 
          className="px-3 py-2 border rounded" 
          onClick={() => { setTitle(''); setTotal(''); setMethod('equal'); setCustomSplits({}); }}
        >
          Reset
        </button>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={submit}>Add expense</button>
      </div>
    </div>
  );
}

function ExpenseList({ expenses, members, onDelete }: ExpenseListProps) {
  const nameOf = (id: string): string => members.find((m: Member) => m.id === id)?.name || 'Unknown';
  return (
    <div className="border rounded p-3 bg-white">
      <h5 className="font-medium mb-2">Expenses</h5>
      {expenses.length === 0 && <div className="text-sm text-gray-500">No expenses yet</div>}
      <div className="space-y-2">
        {expenses.map((e: Expense) => (
          <div key={e.id} className="p-2 border rounded flex justify-between items-start">
            <div>
              <div className="font-medium">{e.title} <span className="text-xs text-gray-500">({e.category})</span></div>
              <div className="text-sm text-gray-600">Paid by {nameOf(e.payerId)} • ₹{currency(e.total)}</div>
              <div className="text-sm mt-1">Split:</div>
              <div className="flex gap-2 flex-wrap mt-1">
                {e.splits.map((s: Split) => (
                  <div key={s.memberId} className="text-sm px-2 py-1 bg-gray-100 rounded">
                    {members.find((m: Member) => m.id===s.memberId)?.name || s.memberId}: ₹{currency(s.amount)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="font-semibold">₹{currency(e.total)}</div>
              <button className="text-xs text-red-600" onClick={() => onDelete(e.id)}>remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryPanel({ trip }: SummaryPanelProps) {
  const members = trip.members;
  const totalsByMemberPaid: Record<string, number> = {};
  const totalsByMemberOwed: Record<string, number> = {};
  const categoryTotals: Record<string, number> = {};

  members.forEach((m: Member) => { 
    totalsByMemberPaid[m.id] = 0; 
    totalsByMemberOwed[m.id] = 0; 
  });

  trip.expenses.forEach((e: Expense) => {
    totalsByMemberPaid[e.payerId] = (totalsByMemberPaid[e.payerId] || 0) + Number(e.total);
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.total);
    e.splits.forEach((s: Split) => {
      totalsByMemberOwed[s.memberId] = (totalsByMemberOwed[s.memberId] || 0) + Number(s.amount);
    });
  });

  // net = paid - owed (positive means others owe them; negative means they owe others)
  const net = members.map((m: Member) => ({ 
    id: m.id, 
    name: m.name, 
    paid: totalsByMemberPaid[m.id] || 0, 
    owed: totalsByMemberOwed[m.id] || 0, 
    net: (totalsByMemberPaid[m.id] || 0) - (totalsByMemberOwed[m.id] || 0) 
  }));

  // Simplified settlement suggestion: who owes who — greedy algorithm
  function settlements() {
    const list = net.map(x => ({ ...x }));
    const debtors = list.filter(x => x.net < -0.005).map(x => ({ ...x, need: -x.net }));
    const creditors = list.filter(x => x.net > 0.005).map(x => ({ ...x, can: x.net }));
    const ops: { from: string; to: string; amount: number }[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const d = debtors[i];
      const c = creditors[j];
      const amt = Math.min(d.need, c.can);
      ops.push({ from: d.name, to: c.name, amount: Number(currency(amt)) });
      d.need -= amt; c.can -= amt;
      if (d.need <= 0.005) i++;
      if (c.can <= 0.005) j++;
    }
    return ops;
  }

  const settle = settlements();
  const totalTrip = trip.expenses.reduce((s: number, e: Expense) => s + Number(e.total), 0);
  const perHead = members.length ? totalTrip / members.length : 0;

  return (
    <div className="border rounded p-3 bg-white">
      <h5 className="font-medium mb-2">Summary</h5>
      <div className="mb-3">
        <div className="text-sm text-gray-600">Trip total</div>
        <div className="font-bold text-lg">₹{currency(totalTrip)}</div>
        <div className="text-sm text-gray-600">Per head (if shared equally): ₹{currency(perHead)}</div>
      </div>

      <div className="mb-3">
        <div className="text-sm font-medium mb-2">Paid vs Owed</div>
        <div className="grid grid-cols-1 gap-2">
          {net.map(n => (
            <div key={n.id} className="flex justify-between items-center p-2 border rounded">
              <div>
                <div className="font-medium">{n.name}</div>
                <div className="text-sm text-gray-600">Paid ₹{currency(n.paid)} • Owes ₹{currency(n.owed)}</div>
              </div>
              <div className={`font-semibold ${n.net>=0 ? 'text-green-600' : 'text-red-600'}`}>
                {n.net>=0 ? 'Receives' : 'Pays'} ₹{currency(Math.abs(n.net))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-sm font-medium mb-2">Settlement suggestions</div>
        {settle.length === 0 && <div className="text-sm text-gray-500">All settled</div>}
        <div className="space-y-2">
          {settle.map((s, idx: number) => (
            <div key={idx} className="p-2 border rounded flex justify-between">
              <div className="text-sm">{s.from} → {s.to}</div>
              <div className="font-medium">₹{currency(s.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Category breakdown</div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(categoryTotals).map(([cat, amt]: [string, number]) => (
            <div key={cat} className="p-2 border rounded">{cat}: ₹{currency(amt)}</div>
          ))}
          {Object.keys(categoryTotals).length === 0 && <div className="text-sm text-gray-500">No expenses yet</div>}
        </div>
      </div>
    </div>
  );
}

export default function TripExpenseApp() {
  const [trips, setTrips] = useLocalState<Trip[]>('trips_v1', []);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [openTripId, setOpenTripId] = useState<string | null>(null);

  const createTrip = (t: Trip) => setTrips((prev: Trip[]) => [t, ...prev]);
  const deleteTrip = (id: string) => setTrips((prev: Trip[]) => prev.filter((t: Trip) => t.id !== id));

  const openTrip = (id: string) => setOpenTripId(id);
  const closeTrip = () => setOpenTripId(null);

  const updateTrip = (updated: Trip) => setTrips((prev: Trip[]) => prev.map((t: Trip) => t.id === updated.id ? updated : t));

  const current = trips.find((t: Trip) => t.id === openTripId);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Trip Expense Manager</h1>
          <div className="flex gap-2">
            <button 
              className="px-3 py-2 border rounded" 
              onClick={() => { localStorage.removeItem('trips_v1'); setTrips([]); }}
            >
              Reset data
            </button>
            <button 
              className="px-3 py-2 bg-indigo-600 text-white rounded" 
              onClick={() => setShowNew(true)}
            >
              New trip
            </button>
          </div>
        </header>

        {!current && (
          <main className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="font-semibold mb-3">Your trips</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trips.map((t: Trip) => (
                    <TripCard key={t.id} trip={t} onOpen={openTrip} onDelete={deleteTrip} />
                  ))}
                  {trips.length === 0 && <div className="text-sm text-gray-500 p-4">No trips yet — create one</div>}
                </div>
              </div>

              <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="font-semibold mb-3">How it works</h3>
                <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
                  <li>Create a trip</li>
                  <li>Add members</li>
                  <li>Add expenses and choose split method</li>
                  <li>Open Summary to see who owes whom and category totals</li>
                </ol>
              </div>
            </div>

            <aside>
              <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="font-semibold mb-3">Quick stats</h3>
                <div className="text-sm text-gray-700">Trips: {trips.length}</div>
                <div className="text-sm text-gray-700">
                  Total expenses (all trips): ₹{currency(trips.reduce((s: number, t: Trip) => s + t.expenses.reduce((ss: number, e: Expense) => ss + Number(e.total), 0), 0))}
                </div>
              </div>
            </aside>
          </main>
        )}

        {current && (
          <main className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{current.name}</h2>
                <div className="text-sm text-gray-600">Members: {current.members.length} • Expenses: {current.expenses.length}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 border rounded" onClick={closeTrip}>Back</button>
                <button 
                  className="px-3 py-2 bg-red-600 text-white rounded" 
                  onClick={() => { 
                    if (window.confirm('Delete this trip?')) { 
                      deleteTrip(current.id); 
                      closeTrip(); 
                    } 
                  }}
                >
                  Delete trip
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <MemberList 
                  members={current.members} 
                  addMember={(m: Member) => { 
                    const upd = { ...current, members: [...current.members, m] }; 
                    updateTrip(upd); 
                  }} 
                  removeMember={(id: string) => { 
                    const upd = { 
                      ...current, 
                      members: current.members.filter((x: Member) => x.id !== id), 
                      expenses: current.expenses.map((exp: Expense) => ({ 
                        ...exp, 
                        splits: exp.splits.filter((s: Split) => s.memberId !== id) 
                      })) 
                    }; 
                    updateTrip(upd); 
                  }} 
                />

                <ExpenseForm 
                  members={current.members.length ? current.members : [{ id: 'm_empty', name: 'No members' }]} 
                  onAdd={(exp: Expense) => { 
                    const upd = { ...current, expenses: [...current.expenses, exp] }; 
                    updateTrip(upd); 
                  }} 
                />

                <ExpenseList 
                  expenses={current.expenses} 
                  members={current.members} 
                  onDelete={(id: string) => { 
                    const upd = { ...current, expenses: current.expenses.filter((e: Expense) => e.id !== id) }; 
                    updateTrip(upd); 
                  }} 
                />
              </div>

              <div className="space-y-4">
                <SummaryPanel trip={current} />
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium mb-2">Actions</h5>
<div className="space-y-2">
  <button 
    className="w-full px-3 py-2 border rounded text-sm" 
    onClick={() => { 
      // Export to CSV
      const nameOf = (id: string): string => current.members.find((m: Member) => m.id === id)?.name || 'Unknown';
      
      // Create CSV data for expenses
      const csvRows = [
        ['Date', 'Title', 'Category', 'Paid By', 'Total Amount', 'Participant', 'Split Amount'].join(',')
      ];
      
      current.expenses.forEach((exp: Expense) => {
        exp.splits.forEach((split: Split) => {
          csvRows.push([
            new Date(exp.date).toLocaleDateString(),
            `"${exp.title}"`,
            exp.category,
            nameOf(exp.payerId),
            exp.total.toString(),
            nameOf(split.memberId),
            split.amount.toString()
          ].join(','));
        });
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${current.name.replace(/\s+/g,'_')}_expenses.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }}
  >
    Export CSV
  </button>
  <button 
    className="w-full px-3 py-2 border rounded text-sm" 
    onClick={() => { 
      // Export to XLSX using SheetJS
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
        alert('XLSX library not loaded');
        return;
      }
      
      const nameOf = (id: string): string => current.members.find((m: Member) => m.id === id)?.name || 'Unknown';
      
      // Create expenses sheet data
      const expensesData = current.expenses.flatMap((exp: Expense) => 
        exp.splits.map((split: Split) => ({
          'Date': new Date(exp.date).toLocaleDateString(),
          'Title': exp.title,
          'Category': exp.category,
          'Paid By': nameOf(exp.payerId),
          'Total Amount': exp.total,
          'Participant': nameOf(split.memberId),
          'Split Amount': split.amount
        }))
      );
      
      // Create summary sheet data
      const totalsByMemberPaid: Record<string, number> = {};
      const totalsByMemberOwed: Record<string, number> = {};
      
      current.members.forEach((m: Member) => { 
        totalsByMemberPaid[m.id] = 0; 
        totalsByMemberOwed[m.id] = 0; 
      });
      
      current.expenses.forEach((e: Expense) => {
        totalsByMemberPaid[e.payerId] = (totalsByMemberPaid[e.payerId] || 0) + Number(e.total);
        e.splits.forEach((s: Split) => {
          totalsByMemberOwed[s.memberId] = (totalsByMemberOwed[s.memberId] || 0) + Number(s.amount);
        });
      });
      
      const summaryData = current.members.map((m: Member) => ({
        'Member': m.name,
        'Total Paid': totalsByMemberPaid[m.id] || 0,
        'Total Owed': totalsByMemberOwed[m.id] || 0,
        'Net Balance': (totalsByMemberPaid[m.id] || 0) - (totalsByMemberOwed[m.id] || 0)
      }));
      
      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      const expensesWs = XLSX.utils.json_to_sheet(expensesData);
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      
      XLSX.utils.book_append_sheet(wb, expensesWs, 'Expenses');
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      XLSX.writeFile(wb, `${current.name.replace(/\s+/g,'_')}_expenses.xlsx`);
    }}
  >
    Export XLSX
  </button>
</div>
                  <button 
                    className="w-full px-3 py-2 bg-green-600 text-white rounded" 
                    onClick={() => alert('Settle feature is manual — use settlement suggestions to perform transfers')}
                  >
                    Mark settled
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {showNew && <NewTripModal onClose={() => setShowNew(false)} onCreate={createTrip} />}
    </div>
  );
}