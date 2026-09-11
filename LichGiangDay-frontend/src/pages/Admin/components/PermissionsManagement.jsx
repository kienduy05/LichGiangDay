import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  KeyRound, Search, Save, AlertCircle, Loader2, CheckCircle2 
} from 'lucide-react';
import { 
  apiGetRoles, apiGetRolePermissions, apiUpdateRolePermissions 
} from '../../../utils/api';
import './PermissionsManagement.css';

export default function PermissionsManagement() {
  const { hasPermission } = useAuth();

  const [roles, setRoles] = useState([]);
  const [permRoleId, setPermRoleId] = useState('ADMIN');
  const [permissionMatrix, setPermissionMatrix] = useState([]);
  const [permLoading, setPermLoading] = useState(false);
  const [permError, setPermError] = useState('');
  const [permSaveLoading, setPermSaveLoading] = useState(false);
  const [permSaveSuccess, setPermSaveSuccess] = useState('');
  const [permSearchQuery, setPermSearchQuery] = useState('');

  const fetchRoles = async () => {
    try {
      const data = await apiGetRoles();
      setRoles(data || []);
    } catch (err) {
      console.error('Fetch roles error:', err);
    }
  };

  const fetchPermissions = async (roleId) => {
    setPermLoading(true);
    setPermError('');
    try {
      const data = await apiGetRolePermissions(roleId);
      setPermissionMatrix(data || []);
    } catch (err) {
      setPermError(err.message || 'Không thể tải ma trận phân quyền.');
    } finally {
      setPermLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (permRoleId) {
      fetchPermissions(permRoleId);
    }
  }, [permRoleId]);

  const handleToggleCell = (resourceId, field) => {
    setPermissionMatrix(prev => 
      prev.map(item => {
        if (item.ResourceId === resourceId) {
          return {
            ...item,
            [field]: item[field] === 1 ? 0 : 1
          };
        }
        return item;
      })
    );
  };

  const handleToggleRowAll = (resourceId) => {
    setPermissionMatrix(prev =>
      prev.map(item => {
        if (item.ResourceId === resourceId) {
          const allChecked = item.CanRead === 1 && item.CanCreate === 1 && item.CanUpdate === 1 && item.CanDelete === 1;
          const nextVal = allChecked ? 0 : 1;
          return {
            ...item,
            CanRead: nextVal,
            CanCreate: nextVal,
            CanUpdate: nextVal,
            CanDelete: nextVal
          };
        }
        return item;
      })
    );
  };

  const handleToggleColumnAll = (field) => {
    const isAllChecked = permissionMatrix.length > 0 && permissionMatrix.every(item => item[field] === 1);
    const nextVal = isAllChecked ? 0 : 1;

    setPermissionMatrix(prev =>
      prev.map(item => ({
        ...item,
        [field]: nextVal
      }))
    );
  };

  const handleSavePermissions = async () => {
    setPermSaveLoading(true);
    setPermSaveSuccess('');
    setPermError('');

    try {
      const payload = permissionMatrix.map(item => ({
        resourceId: item.ResourceId,
        canRead: item.CanRead,
        canCreate: item.CanCreate,
        canUpdate: item.CanUpdate,
        canDelete: item.CanDelete
      }));

      await apiUpdateRolePermissions(permRoleId, payload);
      setPermSaveSuccess(`Lưu ma trận phân quyền cho nhóm '${permRoleId}' thành công!`);
      setTimeout(() => setPermSaveSuccess(''), 2500);
    } catch (err) {
      setPermError(err.message || 'Lưu phân quyền thất bại.');
    } finally {
      setPermSaveLoading(false);
    }
  };

  const filteredPermissionMatrix = permissionMatrix.filter(item => 
    item.ResourceId?.toLowerCase().includes(permSearchQuery.toLowerCase()) ||
    item.ResourceName?.toLowerCase().includes(permSearchQuery.toLowerCase()) ||
    item.Description?.toLowerCase().includes(permSearchQuery.toLowerCase())
  );

  const isColAllReadChecked = permissionMatrix.length > 0 && permissionMatrix.every(item => item.CanRead === 1);
  const isColAllCreateChecked = permissionMatrix.length > 0 && permissionMatrix.every(item => item.CanCreate === 1);
  const isColAllUpdateChecked = permissionMatrix.length > 0 && permissionMatrix.every(item => item.CanUpdate === 1);
  const isColAllDeleteChecked = permissionMatrix.length > 0 && permissionMatrix.every(item => item.CanDelete === 1);

  return (
    <div className="permissions-management-container">
      {/* Page Header Toolbar */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Cấu Hình Ma Trận Phân Quyền Chức Năng</h2>
          <p className="page-subtitle">Chọn nhóm người dùng và thiết lập chi tiết các quyền Xem, Thêm, Sửa, Xóa trên 26 tài nguyên CSDL</p>
        </div>
        {hasPermission('RolePermissions', 'CanUpdate') && (
          <button 
            className="btn-primary-add" 
            onClick={handleSavePermissions}
            disabled={permSaveLoading || permLoading}
          >
            {permSaveLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Lưu Ma Trận Quyền</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Role Selection Dropdown Bar */}
      <div className="perm-header-actions" style={{ marginBottom: '20px' }}>
        <div className="perm-role-select-box">
          <KeyRound size={18} className="perm-select-icon" />
          <span className="perm-select-label">Nhóm người dùng:</span>
          <select 
            className="perm-role-dropdown"
            value={permRoleId}
            onChange={(e) => setPermRoleId(e.target.value)}
          >
            {roles.map(r => (
              <option key={r.RoleId} value={r.RoleId}>
                {r.RoleName} ({r.RoleId})
              </option>
            ))}
          </select>
        </div>

        {permRoleId === 'ADMIN' && (
          <div className="admin-permission-note" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 14px', borderRadius: '10px' }}>
            🛡️ <b>Lưu ý:</b> Nhóm <b>ADMIN</b> có toàn quyền tối cao trong toàn bộ hệ thống (Bypassed system checks).
          </div>
        )}
      </div>

      {/* Main Matrix Card */}
      <div className="table-container-card">
        {/* Search Bar Toolbar */}
        <div className="table-filter-bar">
          <div className="table-search-box">
            <Search size={18} className="search-box-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tài nguyên (VD: ToaNha, GiangVien, Roles, Users...)" 
              value={permSearchQuery}
              onChange={(e) => setPermSearchQuery(e.target.value)}
            />
          </div>

          {permSaveSuccess && (
            <div className="alert-banner success" style={{ margin: 0, padding: '8px 16px' }}>
              <CheckCircle2 size={16} />
              <span>{permSaveSuccess}</span>
            </div>
          )}

          {permError && (
            <div className="alert-banner error" style={{ margin: 0, padding: '8px 16px' }}>
              <AlertCircle size={16} />
              <span>{permError}</span>
            </div>
          )}
        </div>

        {/* Matrix Data Table */}
        <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 270px)', overflowY: 'auto' }}>
          <table className="custom-data-table matrix-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                <th colSpan="2">Tài Nguyên Hệ Thống & Mã CSDL</th>
                
                {/* Column Toggle Xem */}
                <th style={{ width: '110px', textAlign: 'center' }}>
                  <div className="col-header-toggle">
                    <span>Xem (Read)</span>
                    <label className="custom-checkbox-wrapper col-toggle">
                      <input 
                        type="checkbox"
                        checked={isColAllReadChecked}
                        onChange={() => handleToggleColumnAll('CanRead')}
                      />
                      <span className="checkbox-custom-box"></span>
                    </label>
                  </div>
                </th>

                {/* Column Toggle Thêm */}
                <th style={{ width: '110px', textAlign: 'center' }}>
                  <div className="col-header-toggle">
                    <span>Thêm (Create)</span>
                    <label className="custom-checkbox-wrapper col-toggle">
                      <input 
                        type="checkbox"
                        checked={isColAllCreateChecked}
                        onChange={() => handleToggleColumnAll('CanCreate')}
                      />
                      <span className="checkbox-custom-box"></span>
                    </label>
                  </div>
                </th>

                {/* Column Toggle Sửa */}
                <th style={{ width: '110px', textAlign: 'center' }}>
                  <div className="col-header-toggle">
                    <span>Sửa (Update)</span>
                    <label className="custom-checkbox-wrapper col-toggle">
                      <input 
                        type="checkbox"
                        checked={isColAllUpdateChecked}
                        onChange={() => handleToggleColumnAll('CanUpdate')}
                      />
                      <span className="checkbox-custom-box"></span>
                    </label>
                  </div>
                </th>

                {/* Column Toggle Xóa */}
                <th style={{ width: '110px', textAlign: 'center' }}>
                  <div className="col-header-toggle">
                    <span>Xóa (Delete)</span>
                    <label className="custom-checkbox-wrapper col-toggle">
                      <input 
                        type="checkbox"
                        checked={isColAllDeleteChecked}
                        onChange={() => handleToggleColumnAll('CanDelete')}
                      />
                      <span className="checkbox-custom-box"></span>
                    </label>
                  </div>
                </th>

                {/* Column Toggle Hàng */}
                <th style={{ width: '110px', textAlign: 'center' }}>
                  <span>Tất cả hàng</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {permLoading ? (
                <tr>
                  <td colSpan="8" className="table-loading-cell">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Đang tải ma trận phân quyền...</span>
                  </td>
                </tr>
              ) : filteredPermissionMatrix.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty-cell">
                    Không tìm thấy tài nguyên nào phù hợp từ khóa tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredPermissionMatrix.map((item, idx) => {
                  const isRowAllChecked = item.CanRead === 1 && item.CanCreate === 1 && item.CanUpdate === 1 && item.CanDelete === 1;

                  return (
                    <tr key={item.ResourceId}>
                      <td style={{ textAlign: 'center', color: 'var(--admin-text-sub)' }}>{idx + 1}</td>
                      <td colSpan="2">
                        <div className="perm-resource-cell">
                          <div className="resource-name-title" style={{ fontWeight: 600 }}>{item.ResourceName || item.ResourceId}</div>
                          <div className="resource-id-tag">
                            <code>{item.ResourceId}</code> - <span style={{ color: 'var(--admin-text-sub)' }}>{item.Description || 'Tài nguyên CSDL'}</span>
                          </div>
                        </div>
                      </td>

                      {/* CHECKBOX XEM */}
                      <td style={{ textAlign: 'center' }}>
                        <label className="custom-checkbox-wrapper">
                          <input 
                            type="checkbox"
                            checked={item.CanRead === 1}
                            onChange={() => handleToggleCell(item.ResourceId, 'CanRead')}
                          />
                          <span className="checkbox-custom-box"></span>
                        </label>
                      </td>

                      {/* CHECKBOX THÊM */}
                      <td style={{ textAlign: 'center' }}>
                        <label className="custom-checkbox-wrapper">
                          <input 
                            type="checkbox"
                            checked={item.CanCreate === 1}
                            onChange={() => handleToggleCell(item.ResourceId, 'CanCreate')}
                          />
                          <span className="checkbox-custom-box"></span>
                        </label>
                      </td>

                      {/* CHECKBOX SỬA */}
                      <td style={{ textAlign: 'center' }}>
                        <label className="custom-checkbox-wrapper">
                          <input 
                            type="checkbox"
                            checked={item.CanUpdate === 1}
                            onChange={() => handleToggleCell(item.ResourceId, 'CanUpdate')}
                          />
                          <span className="checkbox-custom-box"></span>
                        </label>
                      </td>

                      {/* CHECKBOX XÓA */}
                      <td style={{ textAlign: 'center' }}>
                        <label className="custom-checkbox-wrapper">
                          <input 
                            type="checkbox"
                            checked={item.CanDelete === 1}
                            onChange={() => handleToggleCell(item.ResourceId, 'CanDelete')}
                          />
                          <span className="checkbox-custom-box"></span>
                        </label>
                      </td>

                      {/* CHECKBOX TẤT CẢ ROW */}
                      <td style={{ textAlign: 'center' }}>
                        <label className="custom-checkbox-wrapper row-all">
                          <input 
                            type="checkbox"
                            checked={isRowAllChecked}
                            onChange={() => handleToggleRowAll(item.ResourceId)}
                          />
                          <span className="checkbox-custom-box"></span>
                        </label>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
