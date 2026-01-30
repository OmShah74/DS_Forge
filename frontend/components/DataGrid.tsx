import { Download, Table as TableIcon, Info, X } from "lucide-react";
import { api } from "@/lib/api";

interface DataGridProps {
  columns: string[];
  data: any[];
  datasetId?: number;
  onClose?: () => void;
}

export default function DataGrid({ columns, data, datasetId, onClose }: DataGridProps) {

  const handleDownload = async () => {
    if (!datasetId) return;
    try {
      const response = await api.get(`/datasets/${datasetId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dataset_${datasetId}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <TableIcon size={18} className="text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] leading-none">Stream Analysis</span>
            <span className="text-base font-bold text-white tracking-tight mt-1">Dataset Inspector</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {datasetId && (
            <button onClick={handleDownload} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 px-4 py-2 rounded-xl border border-emerald-500/20 transition-all shadow-lg shadow-emerald-500/5 group">
              <Download size={12} className="group-hover:-translate-y-0.5 transition-transform" /> Export Artifact
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#0a1219]/40 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-2xl custom-scrollbar relative ring-1 ring-emerald-500/10">
        <table className="w-full text-left border-separate border-spacing-0 min-w-max">
          <thead className="sticky top-0 z-30">
            <tr className="bg-[#112229]/95 backdrop-blur-xl">
              {columns.map((col) => (
                <th key={col} className="p-4 text-xs font-bold text-emerald-300/80 border-b border-r border-white/5 uppercase tracking-[0.15em] select-none text-center">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-emerald-500/[0.03] transition-colors group">
                {columns.map((col) => {
                  const val = row[col];
                  const isNull = val === null || val === undefined || val === "";
                  const isNum = typeof val === 'number';

                  return (
                    <td
                      key={`${idx}-${col}`}
                      className={`p-4 text-sm border-r border-white/[0.02] whitespace-nowrap font-medium transition-all
                        ${isNull ? 'bg-rose-500/20 text-rose-400 italic font-black text-center' :
                          isNum ? 'text-cyan-400 font-mono text-center' :
                            'text-gray-400 group-hover:text-emerald-100'}
                      `}
                    >
                      {isNull ? "NULL / NaN" : isNum ? val.toFixed(4).replace(/\.0000$/, '') : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/40"></div>
            <span className="text-gray-500">Anomaly</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-cyan-500/30 border border-cyan-500/40"></div>
            <span className="text-gray-500">Numerical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/40"></div>
            <span className="text-gray-500">Valid</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 opacity-60">
          <Info size={12} className="text-emerald-500" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
            Preview restricted to 100 entries for performance.
          </p>
        </div>
      </div>
    </div>
  );
}
