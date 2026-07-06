import ExcelJS from 'exceljs';
import Subject from '@/lib/models/Subject';
import Session from '@/lib/models/Session';
import User from '@/lib/models/User';
import Attendance from '@/lib/models/Attendance';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const GREEN = 'FF1A6B4A';
const headerStyle = {
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
};
const applyBorder = (cell) => {
  cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
};

// GET /api/reports/subject/:subjectId
export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const subject = await Subject.findById(params.subjectId)
      .populate('departmentId', 'name code').populate('teacherId', 'name');
    if (!subject) return errorResponse(new Error('Subject not found'), 404);
    if (!subject.departmentId) return errorResponse(new Error('এই subject-এর Department খুঁজে পাওয়া যায়নি'), 400);

    if (auth.user.role === 'teacher' && subject.teacherId?._id?.toString() !== auth.user._id.toString()) {
      return errorResponse(new Error('এটা আপনার subject নয়'), 403);
    }

    const sessions = await Session.find({ subjectId: subject._id, status: 'ended' }).sort({ date: 1 });

    const studentFilter = {
      role: 'student', departmentId: subject.departmentId._id, semester: subject.semester,
      section: subject.section, isActive: true,
    };
    if (subject.shift) studentFilter.shift = subject.shift;

    const students = await User.find(studentFilter).sort({ name: 1 });

    const allAtt = await Attendance.find({ subjectId: subject._id });
    const attMap = {};
    allAtt.forEach(a => {
      const sid = a.studentId.toString();
      if (!attMap[sid]) attMap[sid] = {};
      attMap[sid][a.sessionId.toString()] = a.status;
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'PolyAttend';
    const ws = wb.addWorksheet('Attendance Report');

    const totalCols = 7 + sessions.length;
    ws.mergeCells(1, 1, 1, totalCols);
    const title = ws.getCell('A1');
    title.value = `ATTENDANCE REPORT - ${subject.departmentId.name}`;
    title.font = { bold: true, size: 14, color: { argb: GREEN } };
    title.alignment = { horizontal: 'center' };
    ws.getRow(1).height = 22;

    ws.mergeCells(2, 1, 2, totalCols);
    ws.getCell('A2').value = `Subject: ${subject.name} (${subject.code}) | Semester: ${subject.semester} | Section: ${subject.section} | Shift: ${subject.shift || 'N/A'} | Teacher: ${subject.teacherId?.name || 'N/A'}`;
    ws.getCell('A2').alignment = { horizontal: 'center' };
    ws.getRow(2).font = { size: 10, italic: true };

    ws.addRow([]);

    const baseHeaders = ['#', 'Student ID', 'Student Name', 'Department', 'Semester', 'Section'];
    const dateHeaders = sessions.map(s => new Date(s.date).toLocaleDateString('en-BD', { day: '2-digit', month: 'short' }));
    const summaryHeaders = ['Total', 'Present', 'Absent', 'Percentage'];
    const headerRow = ws.addRow([...baseHeaders, ...dateHeaders, ...summaryHeaders]);
    headerRow.eachCell(cell => Object.assign(cell, headerStyle));
    ws.getRow(4).height = 18;

    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 14;
    ws.getColumn(3).width = 22;
    ws.getColumn(4).width = 18;
    ws.getColumn(5).width = 10;
    ws.getColumn(6).width = 10;
    for (let i = 0; i < sessions.length; i++) ws.getColumn(7 + i).width = 10;
    ws.getColumn(7 + sessions.length).width = 8;
    ws.getColumn(8 + sessions.length).width = 10;
    ws.getColumn(9 + sessions.length).width = 10;
    ws.getColumn(10 + sessions.length).width = 12;

    students.forEach((student, idx) => {
      const sid = student._id.toString();
      const recs = attMap[sid] || {};
      const total = sessions.length;
      const present = sessions.filter(s => recs[s._id.toString()] === 'present').length;
      const absent = total - present;
      const pct = total ? Math.round((present / total) * 100) : 0;

      const dateStatuses = sessions.map(s => {
        const st = recs[s._id.toString()];
        return st === 'present' ? 'P' : st === 'absent' ? 'A' : '-';
      });

      const row = ws.addRow([
        idx + 1, student.studentId, student.name,
        subject.departmentId.name, subject.semester, subject.section,
        ...dateStatuses, total, present, absent, `${pct}%`,
      ]);

      row.eachCell(cell => applyBorder(cell));

      dateStatuses.forEach((st, i) => {
        const cell = row.getCell(7 + i);
        if (st === 'P') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
          cell.font = { color: { argb: 'FF065F46' }, bold: true };
        } else if (st === 'A') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { color: { argb: 'FF991B1B' }, bold: true };
        }
      });

      const pctCell = row.getCell(10 + sessions.length);
      if (pct >= 75) pctCell.font = { color: { argb: 'FF065F46' }, bold: true };
      else if (pct >= 60) pctCell.font = { color: { argb: 'FF92400E' }, bold: true };
      else pctCell.font = { color: { argb: 'FF991B1B' }, bold: true };
    });

    ws.addRow([]);
    const sumRow = ws.addRow(['', '', `Total Students: ${students.length}`, '', '', '',
      ...sessions.map(() => ''), sessions.length, '', '', '']);
    sumRow.font = { bold: true };

    const buffer = await wb.xlsx.writeBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="subject_${subject.code}_report.xlsx"`,
      },
    });
  } catch (error) { return errorResponse(error); }
}
