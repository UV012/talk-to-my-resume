import { jsPDF } from 'jspdf';
import { Scorecard, ChatMessage, ChatSession, Avatar } from '@/types/database';
import { formatPlainTextTranscript } from '@/lib/format';

export interface GeneratePdfOptions {
  session: ChatSession;
  avatar: Avatar;
  candidateName: string;
  candidateEmail: string;
  scorecard: Scorecard;
  messages: ChatMessage[];
}

export function generateScorecardPdf(options: GeneratePdfOptions): Buffer {
  const { session, avatar, candidateName, scorecard, messages } = options;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  function checkPageBreak(requiredHeight: number) {
    if (y + requiredHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AI CANDIDATE AVATAR - INTERVIEW BRIEF', margin + 6, y + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const roleText = avatar.target_role ? ` | Target Role: ${avatar.target_role}` : '';
  doc.text(`Candidate: ${candidateName}${roleText}`, margin + 6, y + 16);

  y += 28;

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 24, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Recruiter Details:', margin + 4, y + 6);
  doc.text('Session Timing & Role:', margin + contentWidth / 2, y + 6);

  doc.setFont('helvetica', 'normal');
  const recruiterLine = session.recruiter_email
    ? `${session.recruiter_name} (${session.recruiter_email})`
    : session.recruiter_name;
  doc.text(recruiterLine, margin + 4, y + 11);
  if (session.recruiter_company) {
    doc.text(`Company: ${session.recruiter_company}`, margin + 4, y + 16);
  }

  const inquiryRole = session.recruiter_target_role ? `Target Role: ${session.recruiter_target_role}` : `Avatar Profile: ${avatar.target_role || 'General'}`;
  doc.text(inquiryRole, margin + contentWidth / 2, y + 11);
  doc.text(`Started: ${new Date(session.started_at).toLocaleString()} | Msgs: ${messages.length}`, margin + contentWidth / 2, y + 16);

  y += 30;

  // Section: Topic Coverage Matrix
  checkPageBreak(30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. TOPIC COVERAGE MATRIX', margin, y);
  y += 5;

  const topics = Object.entries(scorecard.topic_coverage);
  const colWidth = contentWidth / 2;
  let topicRowY = y;

  topics.forEach(([topic, covered], idx) => {
    const col = idx % 2;
    const xPos = margin + col * colWidth;
    const currentY = topicRowY + Math.floor(idx / 2) * 7;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(covered ? 16 : 100, covered ? 185 : 116, covered ? 129 : 139);
    doc.text(covered ? '[x]' : '[ ]', xPos + 2, currentY);

    doc.setTextColor(30, 41, 59);
    doc.text(topic, xPos + 8, currentY);
  });

  y += Math.ceil(topics.length / 2) * 7 + 6;

  // Section: Key Evidence Cited
  checkPageBreak(35);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. KEY EVIDENCE & GROUNDED CLAIMS', margin, y);
  y += 6;

  if (scorecard.key_evidence.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('No explicit factual claims recorded during the interview session.', margin, y);
    y += 6;
  } else {
    for (const ev of scorecard.key_evidence) {
      checkPageBreak(14);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);

      const splitClaim = doc.splitTextToSize(`* ${ev.claim}`, contentWidth - 4);
      doc.text(splitClaim, margin + 2, y);
      y += splitClaim.length * 4.5;

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text(`   Source: ${ev.source_citation}`, margin + 2, y);
      y += 5.5;
    }
  }

  y += 4;

  // Section: Open Questions (Out of Resume Scope)
  checkPageBreak(25);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. OPEN / UNLISTED QUESTIONS', margin, y);
  y += 6;

  if (scorecard.open_questions.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('None (all recruiter questions were addressed by the knowledge base).', margin, y);
    y += 6;
  } else {
    for (const q of scorecard.open_questions) {
      checkPageBreak(10);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const splitQ = doc.splitTextToSize(`- ${q}`, contentWidth - 4);
      doc.text(splitQ, margin + 2, y);
      y += splitQ.length * 4.5;
    }
  }

  y += 6;

  // Section: Full Transcript
  checkPageBreak(30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('4. FULL INTERVIEW TRANSCRIPT', margin, y);
  y += 6;

  for (const msg of messages) {
    const isAvatar = msg.role === 'avatar';
    const speakerLabel = isAvatar ? `${candidateName}'s Avatar:` : `${session.recruiter_name}:`;
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isAvatar ? 15 : 79, isAvatar ? 118 : 70, isAvatar ? 110 : 229);
    
    checkPageBreak(12);
    doc.text(speakerLabel, margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const cleanContent = formatPlainTextTranscript(msg.content);
    const splitContent = doc.splitTextToSize(cleanContent, contentWidth - 4);
    
    checkPageBreak(splitContent.length * 4.5 + 4);
    doc.text(splitContent, margin + 2, y);
    y += splitContent.length * 4.5 + 4;
  }

  // Footer / Page numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by AI Candidate Avatar | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
