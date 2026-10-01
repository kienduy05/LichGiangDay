import { useRef } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';

export default function LopHocPhanImportExport({
  filterHocKy, filterBoMon,
  importLoading, importResult,
  onImport, onExport
}) {
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  return (
    <div>
      <div className="lhp-import-bar">
        {/* Import */}
        <button
          className="lhp-import-btn upload"
          onClick={() => fileRef.current?.click()}
          disabled={importLoading || !filterHocKy || !filterBoMon}
          title={!filterHocKy || !filterBoMon ? 'Chọn Học kỳ + Bộ môn trước' : 'Import Excel'}
        >
          {importLoading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {importLoading ? 'Đang import...' : 'Import Excel'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Export */}
        <button
          className="lhp-import-btn download"
          onClick={onExport}
          disabled={!filterHocKy}
          title={!filterHocKy ? 'Chọn Học kỳ trước' : 'Export Excel'}
        >
          <Download size={15} />
          Export Excel
        </button>

        {(!filterHocKy || !filterBoMon) && (
          <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-sub)', fontStyle: 'italic' }}>
            * Import yêu cầu chọn cả Học kỳ và Bộ môn
          </span>
        )}
      </div>

      {/* Import result */}
      {importResult && (
        <div className={`lhp-import-result ${importResult.dongLoi > 0 ? 'error-list' : 'success'}`}>
          <h4>
            Kết quả Import: {importResult.dongThanhCong} thành công, {importResult.dongLoi} lỗi
            ({importResult.tongSoDong} dòng)
          </h4>
          {importResult.errors && importResult.errors.length > 0 && (
            <ul>
              {importResult.errors.slice(0, 20).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {importResult.errors.length > 20 && (
                <li>... và {importResult.errors.length - 20} lỗi khác</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
