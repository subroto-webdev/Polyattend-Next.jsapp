'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';
import toast from 'react-hot-toast';

export default function TeacherSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', departmentId: '', semester: '', section: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/subjects'), api.get('/departments/public')])
      .then(([s, d]) => { setSubjects(s.data.subjects || []); setDepartments(d.data.departments || []); })
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const openCreate = () => { setEditItem(null); setForm({ name: '', code: '', departmentId: '', semester: '', section: '' }); setShowModal(true); };
  const openEdit = (s) => { setEditItem(s); setForm({ name: s.name, code: s.code, departmentId: s.departmentId?._id || '', semester: s.semester, section: s.section }); setShowModal(true); };

  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.departmentId || !form.semester || !form.section) return toast.error('সব field পূরণ করুন');
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/subjects/${editItem._id}`, form);
        toast.success('Subject updated!');
      } else {
        await api.post('/subjects', form);
        toast.success('Subject তৈরি হয়েছে!');
      }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('এই subject delete করবেন?')) return;
    try { await api.delete(`/subjects/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  // Group by dept/sem/section
  const grouped = {};
  subjects.forEach(s => {
    const key = `${s.departmentId?.name || 'Unknown Department'} — Semester ${s.semester} Section ${s.section}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];
  const ordinal = n => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);

  return (
    <div className="page">
      <div className="page-header flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="page-title">আমার Subjects</h2>
          <p className="page-sub">Subject তৈরি ও পরিচালনা করুন</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 shadow-brand transition-colors"
        >
          <Icon name="plus" size={16} /> New Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
            <Icon name="book" size={22} />
          </div>
          <p className="text-slate-500">কোনো subject নেই।<br />উপরের বোতাম দিয়ে তৈরি করুন।</p>
        </div>
      ) : Object.entries(grouped).map(([group, items]) => (
        <div key={group} className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 px-1">{group}</div>
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
            {items.map(s => (
              <div key={s._id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Icon name="book" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{s.name}</div>
                  <div className="text-xs text-slate-500">
                    Code: <span className="font-mono">{s.code}</span> • {s.departmentId?.name || <span className="text-amber-600">Department নেই</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(s)}
                    title="Edit"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-brand-600 transition-colors"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    title="Delete"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showModal && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-elevated max-h-[92vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="w-10 h-1.5 rounded-full bg-slate-200" />
            </div>

            <div className="px-6 pt-5 pb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editItem ? 'Subject Edit করুন' : 'নতুন Subject তৈরি করুন'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject Name *</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
                  placeholder="যেমন: Data Structure"
                  value={form.name}
                  onChange={set('name')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject Code *</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
                  placeholder="যেমন: CST-301"
                  value={form.code}
                  onChange={set('code')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department *</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition appearance-none"
                  value={form.departmentId}
                  onChange={set('departmentId')}
                >
                  <option value="">-- Department বেছে নিন --</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Semester *</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition appearance-none"
                    value={form.semester}
                    onChange={set('semester')}
                  >
                    <option value="">--</option>
                    {semesterOptions.map(s => <option key={s} value={s}>{ordinal(s)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Section *</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition appearance-none"
                    value={form.section}
                    onChange={set('section')}
                  >
                    <option value="">--</option>
                    {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-slate-200 text-slate-600 font-semibold py-2.5 hover:bg-slate-50 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-semibold py-2.5 shadow-brand transition-colors"
              >
                {saving ? <><div className="spinner spinner-sm" /> সংরক্ষণ...</> : editItem ? 'Update করুন' : 'তৈরি করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
