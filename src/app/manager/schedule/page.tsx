"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Clock,
  Calendar,
  Users,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  Building2,
  X,
} from "lucide-react";

interface ScheduleShift {
  id: string;
  staffName: string;
  role: "cashier" | "warehouse" | "floor_supervisor";
  assignedRegister?: string;
  day: string;
  timeSlot: "Morning (08:00 - 16:00)" | "Evening (16:00 - 22:00)" | "Full Day (08:00 - 20:00)";
  status: "scheduled" | "active" | "completed";
}

export default function ManagerSchedulePage() {
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("Today, Nov 06");

  const [newStaffName, setNewStaffName] = useState("");
  const [newRole, setNewRole] = useState<"cashier" | "warehouse" | "floor_supervisor">("cashier");
  const [newRegister, setNewRegister] = useState("POS-01");
  const [newSlot, setNewSlot] = useState<ScheduleShift["timeSlot"]>("Morning (08:00 - 16:00)");

  const [shifts, setShifts] = useState<ScheduleShift[]>([
    {
      id: "SCH-001",
      staffName: "Adaeze Okon",
      role: "cashier",
      assignedRegister: "POS-01",
      day: "Today, Nov 06",
      timeSlot: "Morning (08:00 - 16:00)",
      status: "active",
    },
    {
      id: "SCH-002",
      staffName: "John Danladi",
      role: "cashier",
      assignedRegister: "POS-02",
      day: "Today, Nov 06",
      timeSlot: "Evening (16:00 - 22:00)",
      status: "scheduled",
    },
    {
      id: "SCH-003",
      staffName: "Emeka Chidi",
      role: "warehouse",
      day: "Today, Nov 06",
      timeSlot: "Morning (08:00 - 16:00)",
      status: "active",
    },
    {
      id: "SCH-004",
      staffName: "Fatima Aliyu",
      role: "floor_supervisor",
      day: "Today, Nov 06",
      timeSlot: "Full Day (08:00 - 20:00)",
      status: "active",
    },
    {
      id: "SCH-005",
      staffName: "Adaeze Okon",
      role: "cashier",
      assignedRegister: "POS-01",
      day: "Tomorrow, Nov 07",
      timeSlot: "Morning (08:00 - 16:00)",
      status: "scheduled",
    },
    {
      id: "SCH-006",
      staffName: "John Danladi",
      role: "cashier",
      assignedRegister: "POS-02",
      day: "Tomorrow, Nov 07",
      timeSlot: "Full Day (08:00 - 20:00)",
      status: "scheduled",
    },
  ]);

  const filteredShifts = shifts.filter((s) => s.day === selectedDay);

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const newShift: ScheduleShift = {
      id: `SCH-${String(shifts.length + 1).padStart(3, "0")}`,
      staffName: newStaffName.trim(),
      role: newRole,
      assignedRegister: newRole === "cashier" ? newRegister : undefined,
      day: selectedDay,
      timeSlot: newSlot,
      status: "scheduled",
    };

    setShifts([...shifts, newShift]);
    setNewStaffName("");
    setIsAddShiftOpen(false);
  };

  return (
    <AppShell role="manager">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Shift Scheduling</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-mono">
                {filteredShifts.length} Staff On Roster
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Plan cashier terminal coverage, warehouse shifts, and daily store supervision.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddShiftOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Assign Shift</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Day Selector */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
            {["Today, Nov 06", "Tomorrow, Nov 07", "Sunday, Nov 08", "Monday, Nov 09"].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  selectedDay === d
                    ? "bg-indigo-700 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Schedule Roster Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShifts.map((shift) => (
              <div
                key={shift.id}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400">{shift.id}</span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-md border uppercase tracking-wider ${
                        shift.status === "active"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-300"
                      }`}
                    >
                      {shift.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{shift.staffName}</h3>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">
                    {shift.role.replace(/_/g, " ")}{" "}
                    {shift.assignedRegister ? `· Assigned: ${shift.assignedRegister}` : ""}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-indigo-600" />
                    <span>{shift.timeSlot}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Assign Shift Modal */}
        {isAddShiftOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-700" />
                  <h3 className="font-bold text-sm text-slate-900">Assign Staff Shift</h3>
                </div>
                <button
                  onClick={() => setIsAddShiftOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateShift} className="p-5 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800">Staff Member Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adaeze Okon, John Danladi"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800">Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                    >
                      <option value="cashier">Cashier</option>
                      <option value="warehouse">Warehouse Clerk</option>
                      <option value="floor_supervisor">Floor Supervisor</option>
                    </select>
                  </div>

                  {newRole === "cashier" ? (
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-800">Assigned Register</label>
                      <select
                        value={newRegister}
                        onChange={(e) => setNewRegister(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                      >
                        <option value="POS-01">POS-01 (Main Till)</option>
                        <option value="POS-02">POS-02 (Express Till)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-800">Location</label>
                      <input
                        type="text"
                        disabled
                        value="Main Store Floor"
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-slate-500"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800">Shift Time Block</label>
                  <select
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                  >
                    <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                    <option value="Evening (16:00 - 22:00)">Evening (16:00 - 22:00)</option>
                    <option value="Full Day (08:00 - 20:00)">Full Day (08:00 - 20:00)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddShiftOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md shadow-xs transition-colors"
                  >
                    Save Shift
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

