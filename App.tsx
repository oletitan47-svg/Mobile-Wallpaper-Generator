
import React, { useState, useCallback, useRef } from 'react';
import { generateWallpaper } from './services/geminiService';
import { Wallpaper, AppState } from './types';
import { 
  Sparkles, 
  Download, 
  RotateCcw, 
  ArrowLeft, 
  Maximize2,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [selectedImage, setSelectedImage] = useState<Wallpaper | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('아이디어를 구체화하는 중...');

  const loadingMessages = [
    '아름다운 배경화면을 구상하고 있어요...',
    '색감과 빛을 조절하는 중입니다...',
    '9:16 비율로 완벽하게 다듬고 있어요...',
    '잠시만 기다려주세요, 거의 다 되었습니다!'
  ];

  const handleGenerate = async (targetPrompt?: string) => {
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
      // 4 parallel requests for 4 variations
      const promises = Array.from({ length: 4 }).map(async (_, i) => {
        // Add slight variation to each prompt to get different results
        const variations = ["minimalist style", "dreamy atmosphere", "vivid colors", "artistic brushwork"];
        const variantPrompt = `${finalPrompt}, ${variations[i]}`;
        const url = await generateWallpaper(variantPrompt);
        return {
          id: `${Date.now()}-${i}`,
          url,
          prompt: finalPrompt
        };
      });

      const results = await Promise.all(promises);
      setWallpapers(results);
      setStatus(AppState.RESULTS);
    } catch (error) {
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
      <header className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            MoodPaper
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pb-32 overflow-y-auto">
        {status === AppState.IDLE && (
          <div className="mt-20 text-center px-4">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-indigo-400 opacity-50" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">어떤 분위기를 원하시나요?</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              "비 오는 밤의 사이버펑크 도시", "숲속의 평화로운 아침" 등 당신이 상상하는 배경화면을 설명해주세요.
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
            <p className="text-sm text-slate-500">최대 30초 정도 소요될 수 있습니다.</p>
          </div>
        )}

        {status === AppState.ERROR && (
          <div className="mt-20 text-center px-6">
            <div className="w-16 h-16 bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">생성에 실패했습니다</h2>
            <p className="text-slate-400 text-sm mb-6">네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.</p>
            <button 
              onClick={() => handleGenerate()}
              className="px-6 py-3 bg-slate-800 rounded-xl font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              다시 시도하기
            </button>
          </div>
        )}

        {status === AppState.RESULTS && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/50 pb-8">
        <div className="relative group">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="분위기나 장면을 설명해주세요..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl py-4 pl-5 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-500"
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

      {/* Fullscreen Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black animate-in fade-in duration-300">
          <div className="relative flex-1 flex items-center justify-center p-0">
            <img 
              src={selectedImage.url} 
              alt="Fullscreen Preview" 
              className="w-full h-full object-contain"
            />
            
            {/* Top Bar Overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 active:scale-90 transition-transform"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="text-white/80 font-medium text-sm">미리보기</div>
              <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Bottom Actions Overlay */}
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
