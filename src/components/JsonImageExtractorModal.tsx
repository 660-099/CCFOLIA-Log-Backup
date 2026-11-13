import React, { useState, useRef } from 'react';
import { Download, Upload, X, FileJson, CheckCircle2, AlertCircle, Loader2, Check, ArrowUpDown, Minus } from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface JsonImageExtractorModalProps {
  onClose: () => void;
  initialFile?: File | null;
}

interface ImageAsset {
  id: string;
  url: string;
  source: string;
  type: 'character' | 'background' | 'tab' | 'other';
  uid?: string;
}

export function JsonImageExtractorModal({ onClose, initialFile, onOpenBulkImgur }: JsonImageExtractorModalProps & { onOpenBulkImgur?: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'appearance' | 'name'>('appearance');
  const [error, setError] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayedAssets = React.useMemo(() => {
    if (sortBy === 'name') {
      return [...assets].sort((a, b) => a.id.localeCompare(b.id, 'ko', { numeric: true }));
    }
    return assets;
  }, [assets, sortBy]);

  React.useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
      processFile(initialFile);
    }
  }, [initialFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.json') || droppedFile.type === 'application/json') {
        processFile(droppedFile);
      } else {
        setError("JSON 파일만 업로드 가능합니다.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setError(null);
    setIsDownloaded(false);
    setAssets([]);

    try {
      const text = await selectedFile.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("유효하지 않은 JSON 형식입니다.");
      }

      const extractedAssets: ImageAsset[] = [];
      const seenUrls = new Set<string>();

      // 1. 메시지 데이터를 스캔하여 실제 등장 순서 및 이미지 해시별 발언 캐릭터 이름 매핑
      const hashToCharName = new Map<string, string>();
      const hashToExprIndex = new Map<string, number>();
      const charCounts = new Map<string, number>();
      const appearanceHashes: string[] = [];
      const seenAppearanceHashes = new Set<string>();

      if (data && Array.isArray(data.messages)) {
        data.messages.forEach((msg: any) => {
          const hash = msg.iconImage;
          if (hash && typeof hash === 'string') {
            if (!seenAppearanceHashes.has(hash)) {
              seenAppearanceHashes.add(hash);
              appearanceHashes.push(hash);
            }
            if (!hashToCharName.has(hash)) {
              let rawName = (msg.name !== undefined && msg.name !== null ? String(msg.name).trim() : '');
              rawName = rawName.replace(/[/\\?%*:|"<>]/g, '_').trim();
              if (rawName.toLowerCase() === 'system') return; // 시스템 메시지 아이콘 제외
              if (!rawName) rawName = '캐릭터';
              hashToCharName.set(hash, rawName);
              const nextCount = (charCounts.get(rawName) || 0) + 1;
              charCounts.set(rawName, nextCount);
              hashToExprIndex.set(hash, nextCount);
            }
          }
        });
      }

      // IF this is a standard V2 json log with `images` object
      if (data && data.images && typeof data.images === 'object') {
          // 메시지에 실제 등장한 순서대로 우선 배치하고, 미등장 이미지는 뒤에 배치
          const allImageHashes = Object.keys(data.images);
          const orderedHashes: string[] = [];
          const addedHashes = new Set<string>();

          appearanceHashes.forEach(hash => {
            if (data.images[hash] && !addedHashes.has(hash)) {
              orderedHashes.push(hash);
              addedHashes.add(hash);
            }
          });

          const remainingHashes = allImageHashes.filter(h => !addedHashes.has(h)).sort();
          remainingHashes.forEach(h => orderedHashes.push(h));
          
          let otherCounter = 1;
          orderedHashes.forEach(hashId => {
             const url = data.images[hashId];
             if (typeof url === 'string' && url.startsWith('data:image/')) {
                seenUrls.add(url);

                // 캐릭터 이름 기반 의미론적 파일명 생성 (예: 엘리스_01, 엘리스_02, 탐정_01)
                let semanticName = '';
                if (hashToCharName.has(hashId)) {
                  const cName = hashToCharName.get(hashId)!;
                  const exprNum = hashToExprIndex.get(hashId) || 1;
                  semanticName = `${cName}_${exprNum.toString().padStart(2, '0')}`;
                } else {
                  semanticName = `기타_${otherCounter.toString().padStart(2, '0')}`;
                  otherCounter++;
                }

                extractedAssets.push({
                   id: semanticName, // 사용자 친화적 및 Imgur 자동 식별용 파일명
                   url: url,
                   source: 'data.images',
                   type: hashToCharName.has(hashId) ? 'character' : 'other'
                });
             }
          });
      }

      // Extract images recursively
      const extractImagesFromNode = (node: any, path: string = '') => {
        if (!node) return;

        if (typeof node === 'object') {
          // Check if this object itself has image-like properties
          if (node.image || node.icon || node.url || node.backgroundUrl) {
            const url = node.image || node.icon || node.url || node.backgroundUrl;
            
            // Check if base64 or valid URL-like string
            if (typeof url === 'string' && url.trim() !== '' && !seenUrls.has(url)) {
              // Basic check to see if it looks like an image source
              if (url.startsWith('data:image/') || url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.gif') || url.includes('.webp') || url.length > 100 /* Likely base64 if very long */) {
                seenUrls.add(url);
                
                let type: ImageAsset['type'] = 'other';
                if (path.includes('character') || path.includes('avatar') || node.commands) type = 'character';
                else if (path.includes('background') || path.includes('scene')) type = 'background';
                else if (path.includes('tab') || path.includes('icon')) type = 'tab';
                
                extractedAssets.push({
                  id: `asset-\${extractedAssets.length + 1}`,
                  url,
                  source: path || 'root',
                  type
                });
              }
            }
          }
          
          // Fallback: Check all string properties for base64 images just in case
          for (const key in node) {
             const val = node[key];
             if (typeof val === 'string' && val.startsWith('data:image/')) {
                 if (!seenUrls.has(val)) {
                     seenUrls.add(val);
                     extractedAssets.push({
                         id: `asset-\${extractedAssets.length + 1}`,
                         url: val,
                         source: `\${path}.\${key}`,
                         type: 'other'
                     });
                 }
             }
          }

          // Traverse children
          for (const key in node) {
            if (typeof node[key] === 'object') {
              extractImagesFromNode(node[key], path ? `\${path}.\${key}` : key);
            }
          }
        } else if (Array.isArray(node)) {
          node.forEach((item, index) => {
            extractImagesFromNode(item, `\${path}[\${index}]`);
          });
        }
      };

      // Handle specific known Ccfolia structures if needed, but recursive is safer for varying structures
      extractImagesFromNode(data);
      
      // Also look through the top level 'images' array if it exists
      if (data.images && Array.isArray(data.images)) {
          // Some formats store base64 separately
          console.log("Found top level images array");
      }

      if (extractedAssets.length === 0) {
        setError("파일에서 추출할 수 있는 이미지 데이터(Base64 등)를 찾지 못했습니다.");
      } else {
        extractedAssets.forEach((asset, idx) => {
          asset.uid = `${asset.id}_${idx}`;
        });
        setAssets(extractedAssets);
        setSelectedAssetIds(new Set(extractedAssets.map(a => a.uid!)));
      }
    } catch (err: any) {
      setError(err.message || "파일 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectAsset = (uid: string) => {
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAssetIds.size === assets.length) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(assets.map(a => a.uid || a.id)));
    }
  };

  const handleDownloadZip = async () => {
    const assetsToDownload = assets.filter(a => selectedAssetIds.has(a.uid || a.id));
    if (assetsToDownload.length === 0) {
      setError("다운로드할 이미지가 선택되지 않았습니다. 1개 이상의 이미지를 선택해주세요.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const zip = new JSZip();

      // Process base64 strings
      assetsToDownload.forEach((asset, idx) => {
        if (asset.url.startsWith('data:image/')) {
          // Extract base64 data and mime type
          const matches = asset.url.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const base64Data = matches[2];
            let filename = '';
            if (asset.id && !asset.id.startsWith('asset-')) {
               filename = `${asset.id}.${ext}`;
            } else {
               filename = `asset_${idx + 1}.${ext}`;
            }
            zip.file(filename, base64Data, { base64: true });
          }
        } else {
            console.log("Skipping non-base64 URL for ZIP (might be external):", asset.url.substring(0, 50));
        }
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      const downloadName = file ? file.name.replace(/\.[^/.]+$/, "") + "_png.zip" : "extracted_png.zip";
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsDownloaded(true);
    } catch (err: any) {
      setError("ZIP 파일 생성 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#e6005c]/10 text-[#e6005c]">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">신버전 JSON 이미지 추출기</h2>
              <p className="text-[11px] text-white/50">코코포리아 JSON 데이터에서 스탠딩/배경 이미지를 ZIP으로 추출합니다.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Guide Steps */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-[11px] font-bold text-white/80 mb-3 flex items-center gap-1.5">
              <InfoIcon /> 이용 안내
            </h3>
            <ol className="text-[11px] text-white/60 space-y-2 list-decimal list-inside ml-1">
              <li>JSON 파일에서 스탠딩 이미지 데이터가 자동으로 스캔됩니다.</li>
              <li>ZIP 파일로 다운로드 후 Imgur 등에 업로드하여 외부 링크(URL)로 만들어주세요.</li>
              <li>Imgur 앨범 링크를 붙여넣으세요.</li>
            </ol>
          </div>

          {/* Upload Area */}
          {!file && (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "py-12 px-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                isDragging ? "border-[#e6005c] bg-[#e6005c]/10" : "border-white/10 hover:border-white/20 bg-white/[0.02]"
              )}
            >
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".json,application/json" 
                onChange={handleFileSelect} 
                className="hidden" 
              />
              <FileJson className="w-10 h-10 text-white/30 mb-3" />
              <p className="text-[13px] font-bold text-white mb-1">JSON 로그 파일 드래그 또는 클릭하여 선택</p>
              <p className="text-[11px] text-white/50">코코포리아 신버전 전체 로그 JSON 파일을 선택하면 이미지를 자동으로 추출합니다.</p>
            </div>
          )}

          {/* Processing / Results Area */}
          {file && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileJson className="w-4 h-4 text-[#e6005c] shrink-0" />
                  <span className="text-[11px] font-bold text-white/80 truncate">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] font-bold text-white/50 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors shrink-0"
                >
                  다른 파일 선택
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept=".json,application/json" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />
              </div>

              {isProcessing && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 text-[#e6005c] animate-spin mb-4" />
                  <p className="text-[12px] text-white/60">이미지 데이터를 스캔하고 있습니다...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[12px] font-bold text-red-400 mb-1">오류 발생</h4>
                    <p className="text-[11px] text-red-300/80">{error}</p>
                  </div>
                </div>
              )}

              {!isProcessing && !error && assets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[12px] font-bold text-white flex items-center gap-1.5">
                        <span>추출 완료</span>
                        <span className="text-white/90 font-bold">{assets.length}개</span>
                        <span className="text-[11px] font-normal text-white/50">
                          ({selectedAssetIds.size}개 선택됨)
                        </span>
                      </h4>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        클릭하여 ZIP 다운로드에서 제외할 이미지를 선택 해제할 수 있습니다.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSortBy(prev => prev === 'appearance' ? 'name' : 'appearance')}
                        className="text-[10px] font-bold text-white/70 hover:text-white px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 flex items-center gap-1.5"
                        title="정렬 방식 전환"
                      >
                        <ArrowUpDown className="w-3 h-3 text-white/40" />
                        <span>{sortBy === 'appearance' ? '등장순' : '가나다순'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className={cn(
                          "text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 border",
                          selectedAssetIds.size === assets.length
                            ? "bg-[#e6005c]/15 text-[#ff4d88] border-[#e6005c]/40 hover:bg-[#e6005c]/25 hover:border-[#e6005c]/60"
                            : "bg-[#e6005c] text-white border-[#e6005c] hover:bg-[#ff0066] shadow-sm shadow-pink-500/25"
                        )}
                      >
                        {selectedAssetIds.size === assets.length ? '전체 해제' : '전체 선택'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Thumbnails Preview (Natural grid, scrolled by modal body) */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {displayedAssets.map((asset) => {
                      const uid = asset.uid || asset.id;
                      const isSelected = selectedAssetIds.has(uid);
                      return (
                        <div 
                          key={uid} 
                          onClick={() => toggleSelectAsset(uid)}
                          className={cn(
                            "aspect-square rounded-lg overflow-hidden flex items-center justify-center relative cursor-pointer transition-all border select-none group",
                            isSelected 
                              ? "border-white/50 bg-white/[0.04] shadow-sm shadow-black/20 hover:border-white hover:bg-white/[0.08]" 
                              : "border-white/5 bg-black/30 opacity-40 hover:opacity-75 hover:border-white/20"
                          )}
                          title={`${asset.id} (${isSelected ? '선택됨 - 클릭 시 제외' : '제외됨 - 클릭 시 선택'})`}
                        >
                          <img 
                            src={asset.url} 
                            alt={asset.id} 
                            className="w-full h-full object-contain pointer-events-none"
                            loading="lazy"
                          />
                          {/* Selection / Exclusion Badge */}
                          <div className={cn(
                            "absolute top-1.5 right-1.5 z-10 transition-all",
                            isSelected ? "opacity-0 group-hover:opacity-100 group-hover:scale-105" : "opacity-100"
                          )}>
                            {isSelected ? (
                              <div className="w-4 h-4 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center shadow-sm">
                                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-black/75 backdrop-blur-sm border border-white/30 text-white/70 group-hover:border-white/50 group-hover:text-white flex items-center justify-center shadow-sm">
                                <Minus className="w-2.5 h-2.5 stroke-[2.5]" />
                              </div>
                            )}
                          </div>
                          {/* Semantic Name Tag */}
                          <div className="absolute inset-x-0 bottom-0 bg-black/75 backdrop-blur-[2px] px-1 py-0.5 text-[8px] text-white/80 font-mono truncate text-center pointer-events-none">
                            {asset.id.replace(/^asset-/, '')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 shrink-0 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            닫기
          </button>
          
          {file && !isProcessing && !error && assets.length > 0 && (
            <>
              <button 
                onClick={handleDownloadZip}
                disabled={selectedAssetIds.size === 0}
                className={cn(
                  "px-5 py-2 text-[12px] font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg",
                  selectedAssetIds.size === 0
                    ? "bg-white/10 text-white/30 cursor-not-allowed shadow-none"
                    : isDownloaded 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" 
                      : "bg-[#e6005c] hover:bg-[#ff0066] text-white shadow-pink-500/20"
                )}
              >
                {isDownloaded ? (
                  <><CheckCircle2 className="w-4 h-4" /> 다시 다운로드 (ZIP, {selectedAssetIds.size}개)</>
                ) : (
                  <><Download className="w-4 h-4" /> ZIP 파일로 저장하기 ({selectedAssetIds.size}개)</>
                )}
              </button>
              {typeof onOpenBulkImgur !== "undefined" && onOpenBulkImgur && (
                <button 
                  onClick={() => {
                    onClose();
                    onOpenBulkImgur();
                  }}
                  className="px-5 py-2 text-[12px] font-bold bg-[#e6005c]/20 text-[#e6005c] hover:bg-[#e6005c]/30 rounded-xl transition-all flex items-center gap-2"
                >
                  Imgur 앨범 링크 붙여넣기
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  );
}
