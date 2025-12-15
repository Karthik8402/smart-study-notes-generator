import { useState, useEffect } from 'react';
import { notesAPI } from '../services/api';
import { FileText, Trash2, Download, Eye, Search, BookOpen, ListChecks, Lightbulb, GraduationCap, X, CheckCircle, FileType, File } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';


const categories = [
    { id: null, name: 'All Notes', icon: FileText, color: 'from-purple-500 to-pink-500' },
    { id: 'summary', name: 'Summaries', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { id: 'mcqs', name: 'MCQs', icon: ListChecks, color: 'from-green-500 to-emerald-500' },
    { id: 'explanation', name: 'Explanations', icon: Lightbulb, color: 'from-yellow-500 to-orange-500' },
    { id: 'topic_notes', name: 'Topics', icon: GraduationCap, color: 'from-red-500 to-pink-500' },
    { id: 'definitions', name: 'Definitions', icon: FileText, color: 'from-indigo-500 to-purple-500' },
];

export default function SavedNotes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState(null);

    const filteredNotes = notes.filter(note => {
        const matchesFilter = filter === 'all' || note.note_type === filter;
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.note_type.replace('_', ' ').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const data = await notesAPI.getAll();
            setNotes(data || []);
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const [exportDropdown, setExportDropdown] = useState(null);

    // Export to PDF with professional styling and proper markdown parsing
    const exportToPDF = (note) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;

        // Helper function to check and add new page
        const checkNewPage = (requiredSpace = 20) => {
            if (yPos > pageHeight - 40 - requiredSpace) {
                doc.addPage();
                yPos = 20;
                return true;
            }
            return false;
        };

        // Header with gradient-like styling
        doc.setFillColor(124, 58, 237); // Purple
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Decorative accent
        doc.setFillColor(167, 139, 250); // Lighter purple
        doc.rect(0, 38, pageWidth, 4, 'F');

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        const titleLines = doc.splitTextToSize(note.title, pageWidth - 30);
        doc.text(titleLines, 15, 18);

        // Subtitle with note type badge
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const noteType = note.note_type.replace('_', ' ').toUpperCase();
        const dateStr = new Date(note.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        doc.text(`${noteType}  •  ${dateStr}`, 15, 32);

        yPos = 55;

        if (note.mcqs && note.mcqs.length > 0) {
            // MCQ Section Header
            doc.setFillColor(243, 232, 255); // Light purple
            doc.roundedRect(15, yPos - 8, pageWidth - 30, 14, 3, 3, 'F');
            doc.setTextColor(124, 58, 237);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Practice Questions', 20, yPos);
            yPos += 20;

            note.mcqs.forEach((mcq, idx) => {
                checkNewPage(80);

                // Question number badge
                doc.setFillColor(124, 58, 237);
                doc.roundedRect(15, yPos - 4, 25, 10, 2, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text(`Q${idx + 1}`, 22, yPos + 2);

                // Question text
                doc.setTextColor(31, 41, 55);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                const questionLines = doc.splitTextToSize(mcq.question, pageWidth - 60);
                doc.text(questionLines, 45, yPos + 2);
                yPos += questionLines.length * 6 + 12;

                // Options
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                mcq.options.forEach((opt, optIdx) => {
                    checkNewPage(15);
                    const letter = String.fromCharCode(65 + optIdx);
                    const isCorrect = opt === mcq.correct_answer;

                    if (isCorrect) {
                        doc.setFillColor(220, 252, 231);
                        doc.roundedRect(25, yPos - 4, pageWidth - 55, 10, 2, 2, 'F');
                        doc.setTextColor(22, 163, 74);
                        doc.setFont(undefined, 'bold');
                    } else {
                        doc.setTextColor(75, 85, 99);
                        doc.setFont(undefined, 'normal');
                    }

                    // Option letter circle
                    if (isCorrect) {
                        doc.setFillColor(22, 163, 74);
                    } else {
                        doc.setFillColor(209, 213, 219);
                    }
                    doc.circle(32, yPos, 4, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(8);
                    doc.text(letter, 30.5, yPos + 1.5);

                    // Option text
                    doc.setFontSize(10);
                    if (isCorrect) {
                        doc.setTextColor(22, 163, 74);
                    } else {
                        doc.setTextColor(75, 85, 99);
                    }
                    const optLines = doc.splitTextToSize(opt, pageWidth - 70);
                    doc.text(optLines, 40, yPos + 1);

                    if (isCorrect) {
                        doc.text('[Correct]', pageWidth - 35, yPos + 1);
                    }

                    yPos += optLines.length * 5 + 6;
                });

                // Explanation box
                if (mcq.explanation) {
                    checkNewPage(20);
                    doc.setFillColor(219, 234, 254); // Light blue
                    const explLines = doc.splitTextToSize(mcq.explanation, pageWidth - 60);
                    doc.roundedRect(25, yPos - 3, pageWidth - 55, explLines.length * 5 + 10, 2, 2, 'F');
                    doc.setTextColor(37, 99, 235);
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.text('Explanation:', 30, yPos + 3);
                    doc.setFont(undefined, 'normal');
                    doc.text(explLines, 30, yPos + 10);
                    yPos += explLines.length * 5 + 18;
                }

                // Separator between questions
                if (idx < note.mcqs.length - 1) {
                    doc.setDrawColor(229, 231, 235);
                    doc.setLineWidth(0.5);
                    doc.line(20, yPos, pageWidth - 20, yPos);
                    yPos += 10;
                }
            });
        } else {
            // Regular content - Parse line by line for proper formatting
            const lines = note.content.split('\n');

            lines.forEach((line) => {
                const trimmedLine = line.trim();

                if (!trimmedLine) {
                    yPos += 4;
                    return;
                }

                checkNewPage(15);

                // Check for headings (# ## ### etc)
                const headingMatch = trimmedLine.match(/^(#{1,6})\s*(.+)/);
                if (headingMatch) {
                    const level = headingMatch[1].length;
                    const headingText = headingMatch[2].replace(/[-=]+$/, '').trim();

                    if (level === 1) {
                        // Main heading - purple background
                        yPos += 5;
                        doc.setFillColor(243, 232, 255);
                        doc.roundedRect(15, yPos - 6, pageWidth - 30, 12, 2, 2, 'F');
                        doc.setTextColor(124, 58, 237);
                        doc.setFontSize(14);
                        doc.setFont(undefined, 'bold');
                        doc.text(headingText, 20, yPos + 2);
                        yPos += 18;
                    } else if (level === 2) {
                        // Secondary heading - blue
                        yPos += 3;
                        doc.setTextColor(37, 99, 235);
                        doc.setFontSize(12);
                        doc.setFont(undefined, 'bold');
                        doc.text(headingText, 15, yPos);
                        doc.setDrawColor(37, 99, 235);
                        doc.setLineWidth(0.5);
                        doc.line(15, yPos + 2, 15 + doc.getTextWidth(headingText), yPos + 2);
                        yPos += 12;
                    } else {
                        // Smaller headings
                        doc.setTextColor(55, 65, 81);
                        doc.setFontSize(11);
                        doc.setFont(undefined, 'bold');
                        doc.text(headingText, 15, yPos);
                        yPos += 10;
                    }
                    return;
                }

                // Check for bullet points (* or -)
                const bulletMatch = trimmedLine.match(/^[\*\-]\s+(.+)/);
                if (bulletMatch) {
                    const bulletText = bulletMatch[1]
                        .replace(/\*\*(.*?)\*\*/g, '$1')
                        .replace(/\*(.*?)\*/g, '$1');
                    const indent = line.search(/\S/);
                    const indentLevel = Math.floor(indent / 4);
                    const xOffset = 20 + (indentLevel * 10);

                    // Purple bullet
                    doc.setFillColor(124, 58, 237);
                    doc.circle(xOffset, yPos - 1, 2, 'F');

                    doc.setTextColor(55, 65, 81);
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    const bulletLines = doc.splitTextToSize(bulletText, pageWidth - xOffset - 25);
                    doc.text(bulletLines, xOffset + 6, yPos);
                    yPos += bulletLines.length * 5 + 4;
                    return;
                }

                // Check for section dividers (--- or ===)
                if (/^[-=]{3,}$/.test(trimmedLine)) {
                    doc.setDrawColor(209, 213, 219);
                    doc.setLineWidth(0.5);
                    doc.line(15, yPos, pageWidth - 15, yPos);
                    yPos += 8;
                    return;
                }

                // Regular paragraph - clean up markdown
                const cleanText = trimmedLine
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\*(.*?)\*/g, '$1')
                    .replace(/`(.*?)`/g, '$1');

                doc.setTextColor(55, 65, 81);
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                const paraLines = doc.splitTextToSize(cleanText, pageWidth - 30);
                doc.text(paraLines, 15, yPos);
                yPos += paraLines.length * 5 + 3;
            });
        }

        // Footer on all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Footer line
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.5);
            doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

            // Footer text
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text('Smart Study Notes', 15, pageHeight - 8);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
        }

        doc.save(`${note.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
        setExportDropdown(null);
    };

    // Export to Word with professional styling and proper markdown parsing
    const exportToWord = async (note) => {
        const children = [];

        // Title with colored border
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: note.title,
                        bold: true,
                        size: 52,
                        color: '7C3AED',
                    }),
                ],
                spacing: { after: 100 },
                border: {
                    bottom: { color: '7C3AED', style: BorderStyle.SINGLE, size: 12 },
                },
            })
        );

        // Subtitle with date
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${note.note_type.replace('_', ' ').toUpperCase()} • Generated on ${new Date(note.created_at).toLocaleDateString()}`,
                        size: 20,
                        color: '6B7280',
                        italics: true,
                    }),
                ],
                spacing: { after: 400 },
            })
        );

        if (note.mcqs && note.mcqs.length > 0) {
            // MCQs Section Header
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '📝 Practice Questions',
                            bold: true,
                            size: 32,
                            color: '1F2937',
                        }),
                    ],
                    spacing: { before: 300, after: 300 },
                })
            );

            note.mcqs.forEach((mcq, idx) => {
                // Question with background
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Question ${idx + 1}`,
                                bold: true,
                                size: 24,
                                color: '7C3AED',
                            }),
                        ],
                        spacing: { before: 300, after: 100 },
                    })
                );

                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: mcq.question,
                                size: 24,
                                color: '1F2937',
                            }),
                        ],
                        spacing: { after: 200 },
                        shading: { fill: 'F3F4F6' },
                    })
                );

                // Options with letters
                mcq.options.forEach((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isCorrect = opt === mcq.correct_answer;

                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `    ${letter}.  `,
                                    bold: true,
                                    size: 22,
                                    color: isCorrect ? '16A34A' : '4B5563',
                                }),
                                new TextRun({
                                    text: opt,
                                    size: 22,
                                    color: isCorrect ? '16A34A' : '4B5563',
                                    bold: isCorrect,
                                }),
                                ...(isCorrect ? [new TextRun({ text: '  ✓', color: '16A34A', bold: true, size: 22 })] : []),
                            ],
                            spacing: { after: 100 },
                            shading: isCorrect ? { fill: 'DCFCE7' } : undefined,
                        })
                    );
                });

                // Answer box
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `✓ Correct Answer: ${mcq.correct_answer}`,
                                bold: true,
                                size: 22,
                                color: '16A34A',
                            }),
                        ],
                        spacing: { before: 150, after: 100 },
                        shading: { fill: 'DCFCE7' },
                    })
                );

                if (mcq.explanation) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: '💡 Explanation: ',
                                    bold: true,
                                    size: 20,
                                    color: '2563EB',
                                }),
                                new TextRun({
                                    text: mcq.explanation,
                                    size: 20,
                                    color: '2563EB',
                                }),
                            ],
                            shading: { fill: 'DBEAFE' },
                            spacing: { after: 300 },
                        })
                    );
                }
            });
        } else {
            // Regular content - Parse line by line for proper formatting
            const lines = note.content.split('\n');

            lines.forEach((line, lineIdx) => {
                const trimmedLine = line.trim();

                if (!trimmedLine) {
                    // Empty line - add spacing
                    children.push(new Paragraph({ spacing: { after: 100 } }));
                    return;
                }

                // Check for headings (# ## ### etc)
                const headingMatch = trimmedLine.match(/^(#{1,6})\s*(.+)/);
                if (headingMatch) {
                    const level = headingMatch[1].length;
                    const headingText = headingMatch[2].replace(/[-=]+$/, '').trim();

                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: headingText,
                                    bold: true,
                                    size: level === 1 ? 36 : level === 2 ? 30 : 26,
                                    color: level === 1 ? '7C3AED' : level === 2 ? '2563EB' : '1F2937',
                                }),
                            ],
                            spacing: { before: level === 1 ? 400 : 300, after: 200 },
                            border: level <= 2 ? {
                                bottom: { color: 'E5E7EB', style: BorderStyle.SINGLE, size: 6 },
                            } : undefined,
                        })
                    );
                    return;
                }

                // Check for bullet points (* or -)
                const bulletMatch = trimmedLine.match(/^[\*\-]\s+(.+)/);
                if (bulletMatch) {
                    const bulletText = bulletMatch[1];
                    const indent = line.search(/\S/); // Count leading spaces
                    const indentLevel = Math.floor(indent / 4);

                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: '•  ',
                                    bold: true,
                                    size: 22,
                                    color: '7C3AED',
                                }),
                                new TextRun({
                                    text: bulletText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1'),
                                    size: 22,
                                    color: '374151',
                                }),
                            ],
                            indent: { left: 400 + (indentLevel * 300) },
                            spacing: { after: 80 },
                        })
                    );
                    return;
                }

                // Check for nested bullet (    * item)
                const nestedBulletMatch = trimmedLine.match(/^\s{2,}[\*\-]\s+(.+)/);
                if (nestedBulletMatch) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: '◦  ',
                                    size: 22,
                                    color: '6B7280',
                                }),
                                new TextRun({
                                    text: nestedBulletMatch[1],
                                    size: 22,
                                    color: '4B5563',
                                }),
                            ],
                            indent: { left: 700 },
                            spacing: { after: 60 },
                        })
                    );
                    return;
                }

                // Check for section dividers (--- or ===)
                if (/^[-=]{3,}$/.test(trimmedLine)) {
                    children.push(
                        new Paragraph({
                            border: {
                                bottom: { color: 'D1D5DB', style: BorderStyle.SINGLE, size: 6 },
                            },
                            spacing: { before: 200, after: 200 },
                        })
                    );
                    return;
                }

                // Regular paragraph - clean up markdown
                const cleanText = trimmedLine
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\*(.*?)\*/g, '$1')
                    .replace(/`(.*?)`/g, '$1');

                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: cleanText,
                                size: 22,
                                color: '374151',
                            }),
                        ],
                        spacing: { after: 120 },
                    })
                );
            });
        }

        // Divider line
        children.push(
            new Paragraph({
                spacing: { before: 400 },
                border: {
                    bottom: { color: 'D1D5DB', style: BorderStyle.SINGLE, size: 12 },
                },
            })
        );

        // Footer
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: '📚 Generated by Smart Study Notes',
                        italics: true,
                        size: 18,
                        color: '9CA3AF',
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200 },
            })
        );

        const doc = new Document({
            sections: [{
                properties: {},
                children: children,
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${note.title.replace(/[^a-z0-9]/gi, '_')}.docx`);
        setExportDropdown(null);
    };


    const handleDelete = async (noteId) => {
        if (!confirm('Delete this note?')) return;
        try {
            await notesAPI.delete(noteId);
            fetchNotes();
            if (selectedNote?.id === noteId) {
                setSelectedNote(null);
            }
        } catch (error) {
            alert('Failed to delete note');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };





    const getCategoryInfo = (noteType) => {
        return categories.find(c => c.id === noteType) || categories[0];
    };

    const getTypeIcon = (noteType) => {
        const cat = categories.find(c => c.id === noteType);
        return cat ? cat.icon : FileText;
    };

    // Skeleton component for note cards
    const NoteCardSkeleton = () => (
        <div className="group p-5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 animate-pulse">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="flex-1 space-y-3">
                    <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
        </div>
    );

    if (loading && notes.length === 0) {
        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Header Skeleton */}
                <div className="relative overflow-hidden rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 backdrop-blur-xl p-6">
                    <div className="flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                            <div className="space-y-2">
                                <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    </div>
                </div>

                {/* Filters Skeleton */}
                <div className="flex flex-wrap gap-2 animate-pulse">
                    <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>

                {/* Notes Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <NoteCardSkeleton />
                    <NoteCardSkeleton />
                    <NoteCardSkeleton />
                    <NoteCardSkeleton />
                    <NoteCardSkeleton />
                    <NoteCardSkeleton />
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header with Theme Awareness */}
            <div className="relative overflow-hidden rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 backdrop-blur-xl p-6 transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25 shrink-0">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                                Saved Notes
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300 text-sm md:text-base">Your generated study materials</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="px-4 py-2 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 w-full md:w-auto text-center md:text-left">
                            <span className="text-gray-700 dark:text-gray-400">Total: </span>
                            <span className="text-gray-900 dark:text-white font-semibold">{notes.length} notes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex flex-wrap gap-2 flex-1">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                            }`}
                    >
                        <FileText className="w-4 h-4 inline-block mr-2" />
                        All Notes
                    </button>
                    {['summary', 'mcqs', 'explanation', 'topic_notes', 'definitions'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize flex items-center gap-2 ${filter === type
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {getTypeIcon(type) && (
                                <span className={filter === type ? 'text-white' : 'text-gray-500 dark:text-gray-400'}>
                                    {(() => {
                                        const Icon = getTypeIcon(type);
                                        return <Icon className="w-4 h-4" />;
                                    })()}
                                </span>
                            )}
                            {type.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notes..."
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-white placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
                <div className="text-center py-16 bg-gray-100 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700/50 border-dashed">
                    <FileText className="w-16 h-16 text-gray-700 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-700 dark:text-gray-600 dark:text-gray-400 text-lg">No saved notes found</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                        Generate and save notes from the Notes page to see them here
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNotes.map((note) => {
                        const catInfo = getCategoryInfo(note.note_type);
                        const Icon = catInfo.icon;
                        return (
                            <div
                                key={note.id}
                                className="group p-5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${catInfo.color} bg-opacity-20 shrink-0`}>
                                        <Icon className="w-6 h-6 text-gray-900 dark:text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r ${catInfo.color} text-gray-900 dark:text-white mb-2`}>
                                            {note.note_type.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <h3 className="text-gray-900 dark:text-white font-medium truncate" title={note.title}>
                                            {note.title}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-1 line-clamp-2">
                                            {note.mcqs ? `${note.mcqs.length} multiple choice questions` : note.content.substring(0, 100)}
                                        </p>
                                        <p className="text-gray-700 dark:text-gray-600 text-xs mt-2">
                                            {formatDate(note.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                                    <button
                                        onClick={() => setSelectedNote(note)}
                                        className="flex-1 px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition flex items-center justify-center gap-1.5 text-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setExportDropdown(exportDropdown === note.id ? null : note.id)}
                                            className="px-3 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition flex items-center gap-1.5"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        {exportDropdown === note.id && (
                                            <div className="absolute bottom-full right-0 mb-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-10 animate-fadeIn">
                                                <button
                                                    onClick={() => exportToPDF(note)}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition"
                                                >
                                                    <FileType className="w-4 h-4 text-red-500" />
                                                    Export PDF
                                                </button>
                                                <button
                                                    onClick={() => exportToWord(note)}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2 transition"
                                                >
                                                    <File className="w-4 h-4 text-blue-500" />
                                                    Export Word
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Note Viewer Modal */}
            {selectedNote && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700/50 shadow-2xl animate-slideUp">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryInfo(selectedNote.note_type).color}`}>
                                    <FileText className="w-5 h-5 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-md">
                                        {selectedNote.title}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                                        {selectedNote.note_type.replace('_', ' ')} • {formatDate(selectedNote.created_at)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <button
                                        onClick={() => setExportDropdown(exportDropdown === 'modal' ? null : 'modal')}
                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition flex items-center gap-1.5 text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button>
                                    {exportDropdown === 'modal' && (
                                        <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-10 animate-fadeIn">
                                            <button
                                                onClick={() => exportToPDF(selectedNote)}
                                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition"
                                            >
                                                <FileType className="w-4 h-4 text-red-500" />
                                                Export as PDF
                                            </button>
                                            <button
                                                onClick={() => exportToWord(selectedNote)}
                                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2 transition"
                                            >
                                                <File className="w-4 h-4 text-blue-500" />
                                                Export as Word
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setSelectedNote(null)}
                                    className="p-2 text-gray-700 dark:text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-700 rounded-lg transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            {selectedNote.mcqs && selectedNote.mcqs.length > 0 ? (
                                <div className="space-y-6">
                                    {selectedNote.mcqs.map((mcq, idx) => (
                                        <div key={idx} className="p-5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
                                            <h4 className="text-gray-900 dark:text-white font-medium text-lg mb-4">
                                                {idx + 1}. {mcq.question}
                                            </h4>
                                            <div className="space-y-2 mb-4">
                                                {mcq.options.map((opt, optIdx) => {
                                                    const letter = String.fromCharCode(65 + optIdx);
                                                    const isCorrect = opt === mcq.correct_answer || letter === mcq.correct_answer;
                                                    return (
                                                        <div
                                                            key={optIdx}
                                                            className={`p-3 rounded-lg border flex items-center gap-3 ${isCorrect
                                                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                                                : 'bg-gray-700/30 border-gray-200 dark:border-gray-700/50 text-gray-300'
                                                                }`}
                                                        >
                                                            <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium">
                                                                {letter}
                                                            </span>
                                                            {opt}
                                                            {isCorrect && <CheckCircle className="w-4 h-4 ml-auto" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {mcq.explanation && (
                                                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                    <p className="text-blue-400 text-sm">
                                                        <strong>Explanation:</strong> {mcq.explanation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="notes-content-viewer text-base leading-7">
                                    {(() => {
                                        const lines = selectedNote.content.split('\n');
                                        const elements = [];
                                        let i = 0;

                                        while (i < lines.length) {
                                            const line = lines[i];
                                            const trimmedLine = line.trim();

                                            if (!trimmedLine) {
                                                i++;
                                                continue;
                                            }

                                            // Remove markdown bold markers
                                            const cleanLine = trimmedLine.replace(/\*\*/g, '');

                                            // Section headers (# Heading or Glossary...)
                                            if (cleanLine.match(/^#+\s/) || cleanLine.startsWith('Glossary')) {
                                                elements.push(
                                                    <h2 key={i} className="text-lg font-bold text-gray-900 dark:text-white mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
                                                        {cleanLine.replace(/^#+\s*/, '')}
                                                    </h2>
                                                );
                                                i++;
                                                continue;
                                            }

                                            // Term: Definition pattern
                                            const termMatch = cleanLine.match(/^([A-Z][A-Za-z0-9_\s()]*?):\s*(.+)/);
                                            if (termMatch) {
                                                const term = termMatch[1].trim();
                                                const definition = termMatch[2].trim();

                                                // Look ahead for Example: line
                                                let exampleLine = null;
                                                if (i + 1 < lines.length) {
                                                    const nextLine = lines[i + 1].trim();
                                                    if (nextLine.startsWith('Example:')) {
                                                        exampleLine = nextLine.replace('Example:', '').trim();
                                                        i++;
                                                    }
                                                }

                                                elements.push(
                                                    <div key={i} className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                                        <p className="mb-2">
                                                            <span className="font-semibold text-purple-600 dark:text-purple-400">{term}:</span>
                                                            <span className="text-gray-700 dark:text-gray-300 ml-2">{definition}</span>
                                                        </p>
                                                        {exampleLine && (
                                                            <div className="mt-3 ml-4 pl-4 border-l-2 border-emerald-400 dark:border-emerald-500">
                                                                <span className="text-gray-500 dark:text-gray-400 text-sm">Example: </span>
                                                                <code className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                                                                    {exampleLine}
                                                                </code>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                                i++;
                                                continue;
                                            }

                                            // Standalone Example: lines
                                            if (cleanLine.startsWith('Example:')) {
                                                const exampleCode = cleanLine.replace('Example:', '').trim();
                                                elements.push(
                                                    <div key={i} className="mb-4 ml-4 pl-4 border-l-2 border-emerald-400 dark:border-emerald-500">
                                                        <span className="text-gray-500 dark:text-gray-400 text-sm">Example: </span>
                                                        <code className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                                                            {exampleCode}
                                                        </code>
                                                    </div>
                                                );
                                                i++;
                                                continue;
                                            }

                                            // Bullet points
                                            if (cleanLine.match(/^[-•*]\s/)) {
                                                const bulletText = cleanLine.replace(/^[-•*]\s/, '');
                                                elements.push(
                                                    <div key={i} className="flex gap-3 mb-3 pl-4">
                                                        <span className="text-purple-500">•</span>
                                                        <span className="text-gray-700 dark:text-gray-300">{bulletText}</span>
                                                    </div>
                                                );
                                                i++;
                                                continue;
                                            }

                                            // Regular paragraph
                                            elements.push(
                                                <p key={i} className="text-gray-700 dark:text-gray-300 mb-4">
                                                    {cleanLine}
                                                </p>
                                            );
                                            i++;
                                        }

                                        return elements;
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



