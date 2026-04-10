import React, { useState, useEffect } from 'react';
import { 
  VideoCameraIcon, 
  DocumentTextIcon, 
  BookOpenIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowRightCircleIcon,
  ChevronLeftIcon,
  HomeIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  TrophyIcon
} from '@heroicons/react/24/solid';
import api from '../../services/api';
import toast from 'react-hot-toast';
import QuizResults from './QuizResults';

const LearningSpace = ({ onStartQuiz }) => {
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null); 
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const folderConfig = [
    { id: 'videos', name: 'Video Lessons', type: 'video', icon: VideoCameraIcon, folderColor: '#0EA5E9' },
    { id: 'pdfs', name: 'Lesson Notes', type: 'pdf', icon: DocumentTextIcon, folderColor: '#10B981' },
    { id: 'quizzes', name: 'Assessments', type: 'quiz', icon: BookOpenIcon, folderColor: '#FBBF24' },
    { id: 'pastpapers', name: 'Solved Past Papers', type: 'pastpaper', icon: ArchiveBoxIcon, folderColor: '#8B5CF6' },
    { id: 'results', name: 'My Results', type: 'results', icon: TrophyIcon, folderColor: '#F97316' }
  ];

  useEffect(() => { loadLessonsAndQuizzes(); }, []);

  const loadLessonsAndQuizzes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const lessonsRes = await api.get('/api/learner/lessons', { headers });
      const quizzesRes = await api.get('/api/quiz/quizzes', { headers });

      if (!lessonsRes.data.success) {
        throw new Error('Failed to load lessons');
      }

      const lessons = lessonsRes.data.lessons || [];
      let quizzes = [];
      if (quizzesRes.data.success) {
        quizzes = quizzesRes.data.quizzes || [];
      } else {
        console.warn('Quiz API returned error, continuing without quizzes');
      }

      // Preserve all fields from the quiz, including already_taken, attempt_status, disabled
      const quizItems = quizzes.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        quiz_id: quiz.id,
        resource_type: 'quiz',
        video_url: null,
        pdf_url: null,
        target_form: quiz.target_form,
        already_taken: quiz.already_taken || false,
        attempt_status: quiz.attempt_status || null,
        disabled: quiz.disabled || false
      }));

      const grouped = {
        video: lessons.filter(l => l.resource_type === 'video'),
        pdf: lessons.filter(l => l.resource_type === 'pdf'),
        quiz: quizItems,
        pastpaper: lessons.filter(l => l.resource_type === 'pastpaper'),
        results: []
      };

      setFolders(folderConfig.map(f => ({
        ...f,
        lessons: grouped[f.type] || [],
      })));
    } catch (error) {
      console.error('Error loading learning space:', error);
      toast.error('Could not load learning materials');
    } finally {
      setLoading(false);
    }
  };

  const activeFolder = folders.find(f => f.id === activeFolderId);

  if (loading) return <div className="h-64 flex items-center justify-center font-mono text-slate-400">Mounting drive...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
      
      {/* SYSTEM NAVIGATION BAR */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-3">
        <button 
          onClick={() => setActiveFolderId(null)}
          disabled={!activeFolderId}
          className={`p-1 rounded hover:bg-slate-200 transition ${!activeFolderId ? 'text-slate-300' : 'text-slate-600'}`}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div className="flex-1 flex items-center bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-mono text-slate-500 overflow-hidden">
          <HomeIcon className="w-3 h-3 mr-2 text-slate-400" />
          <span>C:/Users/Learner/Documents</span>
          {activeFolder && (
            <>
              <span className="mx-1">/</span>
              <span className="text-slate-900 font-bold">{activeFolder.name.replace(' ', '_')}</span>
            </>
          )}
        </div>

        {activeFolderId && activeFolderId !== 'results' && (
          <div className="flex bg-slate-200 p-0.5 rounded">
            <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><ListBulletIcon className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><Squares2X2Icon className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* DIRECTORY VIEWPORT */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!activeFolderId ? (
          /* ROOT LEVEL – show all folders */
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-8">
            {folders.map(f => (
              <div key={f.id} onClick={() => setActiveFolderId(f.id)} className="group flex flex-col items-center cursor-pointer">
                <div className="relative w-16 h-12 mb-2 transition-transform group-active:scale-95">
                  <div className="absolute top-0 left-0 w-6 h-2 rounded-t-sm" style={{ backgroundColor: f.folderColor, filter: 'brightness(0.8)' }} />
                  <div className="absolute top-1 left-0 w-full h-11 rounded-sm shadow-sm" style={{ backgroundColor: f.folderColor }} />
                </div>
                <span className="text-[11px] font-medium text-slate-600 text-center group-hover:underline">{f.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            {activeFolderId === 'results' ? (
              <QuizResults />
            ) : (
              <>
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" : "space-y-1"}>
                  {activeFolder.lessons.map(lesson => {
                    const isDisabled = lesson.disabled === true;
                    const isResumable = lesson.attempt_status === 'in-progress';
                    
                    return (
                      <div 
                        key={lesson.id}
                        onClick={() => {
                          if (activeFolder.type === 'quiz') {
                            if (isDisabled) {
                              if (isResumable) {
                                toast('You have an in‑progress attempt. Resume it?', { duration: 3000 });
                                if (onStartQuiz) onStartQuiz(lesson.quiz_id);
                              } else {
                                // ✅ GREEN toast for completed quiz
                                toast.success('You have already completed this quiz. Multiple attempts are not allowed.');
                              }
                              return;
                            }
                            if (onStartQuiz) onStartQuiz(lesson.quiz_id);
                          } else {
                            setSelectedLesson(lesson);
                            setShowLessonModal(true);
                          }
                        }}
                        className={`group flex items-center p-3 rounded border transition-all ${
                          isDisabled ? 'opacity-60 bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          viewMode === 'grid' 
                            ? 'flex-col text-center border-slate-100 hover:bg-sky-50' 
                            : 'border-transparent hover:bg-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className={`${viewMode === 'grid' ? 'mb-2' : 'mr-3'}`}>
                          <activeFolder.icon className={`w-5 h-5 ${activeFolder.id === 'videos' ? 'text-sky-500' : activeFolder.id === 'pdfs' ? 'text-emerald-500' : activeFolder.id === 'quizzes' ? 'text-amber-500' : 'text-purple-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-700 truncate">{lesson.title}</h4>
                          {viewMode === 'grid' && lesson.description && (
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{lesson.description}</p>
                          )}
                        </div>
                        {viewMode === 'list' && (
                          <div className="flex items-center gap-2">
                            {isDisabled && (
                              <span className="text-xs text-amber-600 font-medium">
                                {isResumable ? 'Resume' : 'Taken'}
                              </span>
                            )}
                            <ArrowRightCircleIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {activeFolder.lessons.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 text-sm">
                      This folder is empty.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* SYSTEM VIEWER (Modal for video/pdf) */}
      {showLessonModal && selectedLesson && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-slate-300">
            <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center select-none">
              <span className="text-[10px] font-mono text-slate-500">{selectedLesson.title}.sys</span>
              <button onClick={() => setShowLessonModal(false)} className="hover:bg-red-500 hover:text-white rounded p-0.5 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 bg-slate-900">
              <iframe 
                src={selectedLesson.resource_type === 'video' 
                  ? (selectedLesson.video_url?.includes('youtube.com') 
                      ? selectedLesson.video_url.replace('watch?v=', 'embed/') 
                      : selectedLesson.video_url)
                  : selectedLesson.pdf_url
                } 
                className="w-full h-full border-none" 
                title={selectedLesson.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningSpace;