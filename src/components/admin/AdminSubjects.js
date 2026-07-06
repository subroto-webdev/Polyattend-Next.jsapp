'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';
import toast from 'react-hot-toast';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', departmentId: '', semester: '', section: '', shift: '', teacherId: '' });
  const [saving, setSaving] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');

  const load = () => {
    setLoading(true);
    const params = { ...(filterDept && { departmentId: filterDept }), ...(filterSem && { semester: filterSem }) };
    Promise.all([
      api.get('/subjects', { params }),
      api.get('/departments/public'),
      api.get('/users?role=teacher')
    ]).then(([s, d, t]) => {
      setSubjects(s.data.subjects || []);
      setDepartments(d.data.departments || []);
      setTeachers(t.data.users || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, [filterDept, filterSem]);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', code: '', departmentId: '', semester: '', section: '', teacherId: '' });
    setShowModal(true);
  };
  const openEdit = s => {
    setEditItem(s);
    setForm({ name: s.name, code: s.code, departmentId: s.departmentId?._id || '', semester: s.semester, section: s.section, shift: s.shift || '', teacherId: s.teacherId?._id || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.departmentId || !form.semester || !form.section || !form.shift) return toast.error('সব required field পূরণ করুন');
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/subjects/${editItem._id}`, form);
        toast.success('Updated!');
      } else {
        await api.post('/subjects', form);
        toast.success('Subject তৈরি!');
      }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete করবেন?')) return;
    try { await api.delete(`/subjects/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  // Group subjects
  const grouped = {};
  subjects.forEach(s => {
    const key = `${s.departmentId?.name} — Semester ${s.semester} Section ${s.section}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="page-title">Subjects</h2>
          <p className="page-sub">সমস্ত subject পরিচালনা করুন</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '9px 18px' }} onClick={openCreate}>
          <Icon name="plus" size={16} /> New Subject
        </button>
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 'auto' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={filterSem} onChange={e => setFilterSem(e.target.value)}>
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> :
        subjects.length === 0 ? (
          <div className="card"><div className="empty"><div className="empty-icon"><Icon name="book" size={24} /></div><p>কোনো subject নেই</p></div></div>
        ) : Object.entries(grouped).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 20 }}>
            <div className="section-title">{group}</div>
            <div className="card">
              {items.map(s => (
                <div key={s._id} className="list-item">
                  <div className="item-icon icon-green"><Icon name="book" size={18} /></div>
                  <div className="item-content">
                    <div className="item-title">{s.name}</div>
                    <div className="item-sub">Code: {s.code} • Teacher: {s.teacherId?.name || 'Unassigned'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-icon" onClick={() => openEdit(s)}><Icon name="edit" size={16} /></button>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(s._id)}><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      }

      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">{editItem ? 'Subject Edit' : 'নতুন Subject'}</div>
            <div className="form-group">
              <label className="form-label">Subject Name *</label>
              <input className="form-input" placeholder="যেমন: Data Structure" value={form.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Code *</label>
              <input className="form-input" placeholder="যেমন: CST-301" value={form.code} onChange={set('code')} />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" value={form.departmentId} onChange={set('departmentId')}>
                <option value="">-- বেছে নিন --</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Semester *</label>
                <select className="form-select" value={form.semester} onChange={set('semester')}>
                  <option value="">--</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Shift *</label>
                <select className="form-select" value={form.shift} onChange={set('shift')}>
                  <option value="">-- Shift বেছে নিন --</option>
                  <option value="1st">1st Shift</option>
                  <option value="2nd">2nd Shift</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section *</label>
                <select className="form-select" value={form.section} onChange={set('section')}>
                  <option value="">--</option>
                  {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Assign Teacher</label>
              <select className="form-select" value={form.teacherId} onChange={set('teacherId')}>
                <option value="">-- Teacher বেছে নিন (ঐচ্ছিক) --</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>বাতিল</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <><div className="spinner spinner-sm" /> সংরক্ষণ...</> : editItem ? 'Update' : 'তৈরি করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
