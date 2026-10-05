import React, { useState } from 'react';
import { FileText, RotateCcw, X } from 'lucide-react';
import { MAINTENANCE_CONFIG } from '../maintenanceConfig';

export const MaintenanceNotice: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  // 점검 모드가 꺼져있거나(enabled: false) 배너를 닫은 경우 렌더링하지 않음
  if (!MAINTENANCE_CONFIG.enabled || dismissed) {
    return null;
  }

  // 1. 전체 화면 완전 차단 모드 (Block Mode - 사이트 공식 유리 질감 & 컴팩트 사이즈)
  if (MAINTENANCE_CONFIG.mode === 'block') {
    return (
      <div 
        className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 backdrop-blur-md text-stone-200 px-4 font-sans select-none"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="w-full max-w-[420px] bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-left">
          {/* 웹사이트 공식 헤더 & 뱃지 */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-[#e6005c] rounded-xl shadow-lg shadow-pink-500/20 shrink-0 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.15em]">CCFOLIA LOG FORMATTER</p>
                <span className="text-[13px] font-bold text-white whitespace-nowrap leading-tight">코코포리아 로그 편집기</span>
              </div>
            </div>

            <span className="px-2 py-0.5 bg-[#e6005c]/10 border border-[#e6005c]/25 text-[#e6005c] text-[10px] font-bold rounded-md shrink-0">
              {MAINTENANCE_CONFIG.badgeText}
            </span>
          </div>

          {/* 제목 */}
          <h2 className="text-base font-bold text-white mt-4 mb-2 tracking-tight">
            {MAINTENANCE_CONFIG.title}
          </h2>

          {/* 본문 */}
          <p className="text-xs text-white/70 leading-relaxed mb-5 whitespace-pre-line">
            {MAINTENANCE_CONFIG.message}
          </p>

          {/* 새로고침 버튼 */}
          <div className="pt-3 border-t border-white/5 flex justify-end">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e6005c] hover:bg-[#ff0066] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>새로고침</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. 상단 배너 모드 (Banner Mode - 사이트 공식 유리 질감)
  return (
    <div className="w-full shrink-0 z-[9999] bg-[#1a1a1a]/90 backdrop-blur-md border-b border-white/10 text-stone-200 px-4 py-2.5 text-xs font-medium shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <div className="w-5 h-5 bg-[#e6005c] rounded-md shrink-0 flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="shrink-0 px-1.5 py-0.5 bg-[#e6005c]/20 text-[#e6005c] text-[10px] font-bold rounded">
            {MAINTENANCE_CONFIG.badgeText}
          </span>
          <span className="truncate text-white/80">
            <strong className="text-white mr-1.5">{MAINTENANCE_CONFIG.title}:</strong>
            {MAINTENANCE_CONFIG.message}
          </span>
        </div>

        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          title="배너 닫기"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
