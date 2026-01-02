
import React, { useState, useEffect } from 'react';
import { generateWallpaper, testConnection } from './services/geminiService';
import { Wallpaper, AppState } from './types';
import { 
  Sparkles, 
  Download, 
  RotateCcw, 
  Maximize2,
  X,
  AlertCircle,
  Loader2,
  Key,
  Settings,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

// Using the pre-defined AIStudio interface from the environment to resolve type mismatch and modifier errors.
declare global {
  interface Window {
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [selectedImage, setSelectedImage] = useState<Wallpaper | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('아이디어를 구체화하는 중...');
  const [showSettings, setShowSettings] = useState(false);
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
  const [quality, setQuality] = useState<"1K" | "2K" | "4K">("1K");

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeySelected(hasKey);
    } catch (e) {
      setIsKeySelected(false);
    }
  };

  const handleOpenKeyPicker = async () => {
    await window.aistudio.openSelectKey();
    setIsKeySelected(true); // Assume success per guidelines to mitigate race condition
    setTestStatus('idle');
  };

  const loadingMessages = [
    '아름다운 배경화면을 구상하고 있어요...',
    '색감과 빛을 조절하는 중입니다...',
    '9:16 비율로 완벽하게 다듬고 있어요...',
    '잠시만 기다려주세요, 거의 다 되었습니다!'
  ];

  const handleGenerate = async (targetPrompt?: string) => {
    if (!isKeySelected) {
      setShowSettings(true);
      return;
    }

    const finalPrompt = targetPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setStatus(AppState.GENERATING);
    setWallpapers([]);
    
    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[msgIndex]);
    }, 2500);

    try {
      const promises = Array.from({ length: 4 }).map(async (_, i) => {
        const variations = ["vibrant 8k cinematic", "minimalist aesthetic", "dreamy pastel", "dramatic lighting"];
        const variantPrompt = `${finalPrompt}, ${variations[i]}`;
        const url = await generateWallpaper(variantPrompt, quality);
        return {
          id: `${Date.now()}-${i}`,
          url,
          prompt: finalPrompt
        };
      });

      const results = await Promise.all(promises);
      setWallpapers(results);
      setStatus(AppState.RESULTS);
    } catch (error: any) {
      if (error.message === "KEY_NOT_FOUND") {
        setIsKeySelected(false);
        setShowSettings(true);
      }
      console.error(error);
      setStatus(AppState.ERROR);
    } finally {
      clearInterval(interval);
    }
  };

  const handleDownload = (wallpaper: Wallpaper) => {
    const link = document.createElement('a');
    link.href = wallpaper.url;
    link.download = `wallpaper-${wallpaper.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemix = (wallpaper: Wallpaper) => {
    setPrompt(wallpaper.prompt);
    setSelectedImage(null);
    handleGenerate(wallpaper.prompt);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="p-6 flex items-center justify-between z-10 sticky top-0 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            MoodPaper
          </h1>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className={`p-2 rounded-xl transition-all ${!isKeySelected ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          <Settings className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pb-32 overflow-y-auto">
        {!isKeySelected && status !== AppState.GENERATING && (
          <div className="mt-10 p-4 bg-red-950/20 border border-red-500/30 rounded-2xl text-center">
            <p className="text-red-400 text-sm font-medium mb-3">API 키가 설정되지 않았습니다.</p>
            <button 
              onClick={handleOpenKeyPicker}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-900/20"
            >
              API 키 연결하기
            </button>
          </div>
        )}

        {status === AppState.IDLE && (
          <div className="mt-20 text-center px-4">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Sparkles className="w-10 h-10 text-indigo-400 opacity-50" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">어떤 배경화면을 만들까요?</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
              상상하시는 장면을 한글이나 영어로 설명해주세요. 고화질 9:16 배경화면을 생성합니다.
            </p>
          </div>
        )}

        {status === AppState.GENERATING && (
          <div className="mt-20 flex flex-col items-center justify-center text-center">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <p className="text-lg font-medium text-white mb-2">{loadingMessage}</p>
            <p className="text-sm text-slate-500">Pro 모델을 사용하여 고품질 이미지를 생성 중입니다.</p>
          </div>
        )}

        {status === AppState.RESULTS && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-4">
            {wallpapers.map((wp) => (
              <div 
                key={wp.id}
                onClick={() => setSelectedImage(wp)}
                className="group relative aspect-9-16 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl active:scale-95 transition-transform cursor-pointer"
              >
                <img 
                  src={wp.url} 
                  alt={wp.prompt} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <Maximize2 className="w-5 h-5 text-white/80" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Action Sheet (Input Area) */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/50 pb-8 z-20">
        <div className="relative group">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="예: 숲속의 고요한 새벽녘 호수..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl py-4 pl-5 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-500 text-sm"
            disabled={status === AppState.GENERATING}
          />
          <button 
            onClick={() => handleGenerate()}
            disabled={status === AppState.GENERATING || !prompt.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 active:scale-90 disabled:opacity-50 disabled:active:scale-100 transition-all"
          >
            {status === AppState.GENERATING ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </button>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                API 설정
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* API Key Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">외부 API 키 관리</label>
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${isKeySelected ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isKeySelected ? 'bg-indigo-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-slate-300">
                      {isKeySelected ? 'API 키 연결됨' : 'API 키 연결 필요'}
                    </span>
                  </div>
                  <button 
                    onClick={handleOpenKeyPicker}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                  >
                    키 변경/설정
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  개인 API 키는 브라우저 보안 저장소에 안전하게 관리됩니다. 결제 정보가 포함된 프로젝트의 키를 선택해야 합니다.
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-400 inline-flex items-center gap-1 ml-1">
                    결제 안내 <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              {/* Connection Test Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">연결 테스트</label>
                <button 
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing' || !isKeySelected}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-slate-700"
                >
                  {testStatus === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  서버 연결 테스트
                </button>
                {testStatus === 'success' && <p className="text-xs text-green-500 text-center">연결 성공! 모든 기능을 사용할 수 있습니다.</p>}
                {testStatus === 'fail' && <p className="text-xs text-red-500 text-center">연결 실패. API 키 권한을 확인해주세요.</p>}
              </div>

              {/* Quality Settings */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">생성 품질 (Gemini Pro)</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1K', '2K', '4K'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${quality === q ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all"
              >
                설정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black animate-in fade-in duration-300">
          <div className="relative flex-1 flex items-center justify-center">
            <img 
              src={selectedImage.url} 
              alt="Fullscreen Preview" 
              className="w-full h-full object-contain"
            />
            
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 active:scale-90 transition-transform"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="text-white/80 font-medium text-sm">배경화면 미리보기</div>
              <div className="w-10"></div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 flex gap-4 bg-gradient-to-t from-black/90 to-transparent">
              <button 
                onClick={() => handleDownload(selectedImage)}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-white text-black rounded-2xl font-bold shadow-xl active:scale-95 transition-transform"
              >
                <Download className="w-5 h-5" />
                다운로드
              </button>
              <button 
                onClick={() => handleRemix(selectedImage)}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-800 text-white rounded-2xl font-bold border border-slate-700 active:scale-95 transition-transform"
              >
                <RotateCcw className="w-5 h-5" />
                리믹스
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
