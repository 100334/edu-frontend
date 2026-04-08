import React, { useState, useEffect } from 'react';
import { 
  AcademicCapIcon, BookOpenIcon, TrophyIcon, 
  ClipboardDocumentListIcon, ArrowDownTrayIcon, 
  EyeIcon, VideoCameraIcon, DocumentTextIcon,
  ChevronRightIcon, ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';
import QuizList from './QuizList';
import QuizResults from './QuizResults';
import QuizTaking from './QuizTaking';

const LearningSpace = ({ onStartQuiz }) => {
  const [activeSubTab, setActiveSubTab] = useState('lessons');
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showQuiz, setShowQuiz] = useState(null);

  useEffect(() => {
    if (activeSubTab === 'lessons') loadLessons();
  }, [activeSubTab]);

  const loadLessons = async () => {
    setLoadingLessons(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/learner/lessons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setLessons(res.data.lessons);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load lessons');
    } finally {
      setLoadingLessons(false);
    }
  };

  const openLesson = (lesson) => {
    setSelectedLesson(lesson);
    setShowLessonModal(true);
  };

  const handleStartQuizFromLesson = (quizId) => {
    setShowQuiz(quizId);
    setShowLessonModal(false);
    if (onStartQuiz) onStartQuiz(quizId);
  };

  const isDirectVideo = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|mov|ogg)$/i.test(url) || url.includes('r2.dev') || url.includes('cloudflare.com');
  };

  const videoLessons = lessons.filter(lesson => lesson.video_url);
  const pdfNotes = lessons.filter(lesson => lesson.pdf_url && !lesson.video_url);

  if (showQuiz) {
    return (
      <div className="animate-in fade-in duration-500">
        <button 
          onClick={() => setShowQuiz(null)} 
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-navy-900 font-medium transition-all group"
        >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Learning Hub
        </button>
        <QuizTaking quizId={showQuiz} onComplete={() => setShowQuiz(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-1">
      {/* Tab Navigation */}
      <div className="mb-8 flex justify-center">
        <nav className="inline-flex p-1 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-white/50 shadow-inner">
          {[
            { id: 'lessons', label: 'Lessons', icon: BookOpenIcon },
            { id: 'quizzes', label: 'Quizzes', icon: ClipboardDocumentListIcon },
            { id: 'results', label: 'Results', icon: TrophyIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeSubTab === tab.id
                  ? 'bg-[#0F172A] text-white shadow-lg shadow-navy-900/20 scale-105'
                  : 'text-slate-600 hover:text-[#007FFF] hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeSubTab === 'lessons' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          {loadingLessons ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-[#007FFF] rounded-full animate-spin"></div>
              <p className="text-navy-900 font-medium animate-pulse">Curating your curriculum...</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <AcademicCapIcon className="w-20 h-20 mx-auto text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-navy-900">No lessons found</h3>
              <p className="text-slate-500 mt-1">Check back later for new study materials.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Videos Section */}
              {videoLessons.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <VideoCameraIcon className="w-6 h-6 text-[#007FFF]" />
                      </div>
                      <h2 className="text-xl font-bold text-[#0F172A]">Video Lectures</h2>
                    </div>
                    <span className="text-xs font-bold text-[#007FFF] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                      {videoLessons.length} Modules
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videoLessons.map((lesson) => (
                      <LessonCard key={lesson.id} lesson={lesson} type="video" onClick={openLesson} />
                    ))}
                  </div>
                </section>
              )}

              {/* PDFs Section */}
              {pdfNotes.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <DocumentTextIcon className="w-6 h-6 text-[#0F172A]" />
                      </div>
                      <h2 className="text-xl font-bold text-[#0F172A]">Study Material & PDFs</h2>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pdfNotes.map((lesson) => (
                      <LessonCard key={lesson.id} lesson={lesson} type="pdf" onClick={openLesson} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'quizzes' && <QuizList onStartQuiz={setShowQuiz} />}
      {activeSubTab === 'results' && <QuizResults />}

      {/* Modern Modal Design */}
      {showLessonModal && selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-md transition-opacity" onClick={() => setShowLessonModal(false)} />
          
          <div className="relative bg-white rounded-[2rem] max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-black text-[#0F172A] leading-tight">{selectedLesson.title}</h3>
                <span className="text-xs font-bold text-[#007FFF] uppercase tracking-widest">{selectedLesson.target_form}</span>
              </div>
              <button onClick={() => setShowLessonModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
              {/* Media Content */}
              <div className="rounded-2xl overflow-hidden shadow-lg bg-slate-50 border border-slate-100">
                {selectedLesson.video_url ? (
                  isDirectVideo(selectedLesson.video_url) ? (
                    <video controls className="w-full max-h-[500px]">
                      <source src={selectedLesson.video_url} type="video/mp4" />
                    </video>
                  ) : (
                    <div className="aspect-video">
                      <iframe src={selectedLesson.video_url} className="w-full h-full" allowFullScreen title={selectedLesson.title} />
                    </div>
                  )
                ) : selectedLesson.pdf_url ? (
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedLesson.pdf_url)}&embedded=true`} 
                    className="w-full h-[600px]" 
                    title="PDF Viewer"
                  />
                ) : null}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h4 className="text-lg font-bold text-[#0F172A] mb-3">Lesson Overview</h4>
                  <p className="text-slate-600 leading-relaxed text-lg">{selectedLesson.description || "No detailed description provided for this lesson."}</p>
                  
                  {selectedLesson.pdf_url && selectedLesson.video_url && (
                    <div className="mt-6 flex gap-4">
                      <a href={selectedLesson.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] text-white text-sm font-semibold hover:bg-[#007FFF] transition-all">
                        <ArrowDownTrayIcon className="w-4 h-4" /> Download PDF Notes
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {selectedLesson.quiz && (
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-[#0F172A] mb-2">Knowledge Check</h4>
                      <p className="text-sm text-slate-600 mb-4">Complete the quiz to test your understanding of this topic.</p>
                      <button 
                        onClick={() => handleStartQuizFromLesson(selectedLesson.quiz.id)}
                        className="w-full py-3 px-4 bg-[#007FFF] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        Launch Quiz <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for Cleaner Card Design
const LessonCard = ({ lesson, type, onClick }) => {
  const isVideo = type === 'video';
  return (
    <div 
      onClick={() => onClick(lesson)}
      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#007FFF]/5 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
    >
      <div className={`h-32 flex items-center justify-center relative overflow-hidden ${isVideo ? 'bg-[#0F172A]' : 'bg-[#007FFF]'}`}>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        {isVideo ? (
          <VideoCameraIcon className="w-12 h-12 text-white/80 z-10 group-hover:scale-110 transition-transform" />
        ) : (
          <DocumentTextIcon className="w-12 h-12 text-white/80 z-10 group-hover:scale-110 transition-transform" />
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${isVideo ? 'bg-blue-50 text-[#007FFF]' : 'bg-slate-100 text-slate-600'}`}>
            {lesson.target_form === 'All' ? 'Open Access' : lesson.target_form}
          </span>
        </div>
        
        <h3 className="text-base font-bold text-[#0F172A] mb-2 line-clamp-1 group-hover:text-[#007FFF] transition-colors">
          {lesson.title}
        </h3>
        
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-grow">
          {lesson.description || "Access detailed learning resources for this module."}
        </p>

        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">
            {isVideo ? "Video Lecture" : "PDF Notes"}
          </span>
          <div className="flex items-center gap-1 text-[#007FFF] text-sm font-bold">
            {isVideo ? 'Watch' : 'Read'} <ChevronRightIcon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningSpace;