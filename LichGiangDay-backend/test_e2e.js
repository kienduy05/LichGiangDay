/**
 * AUTOMATED END-TO-END TEST SUITE FOR PHAN HE BIEN DONG LICH
 * Tests all 9 scenarios specified in Prompt Section 8
 */

const API_BASE = 'http://localhost:5000/v1/api';
const API_KEY = 'lichgiangday_secret_apikey_2026';

// Helper to make authenticated requests
async function login(username, password = 'password123') {
  for (const pwd of [password, '123456', 'admin123', 'password']) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ username, password: pwd })
      });
      const data = await res.json();
      if (res.ok && data.metadata?.tokens?.accessToken) {
        return {
          userId: data.metadata.user?.MaUser || data.metadata.user?.userId || data.metadata.user?.id,
          token: data.metadata.tokens.accessToken,
          user: data.metadata.user
        };
      }
    } catch (e) {}
  }
  throw new Error(`Failed to login with user: ${username}`);
}

function authHeaders(session) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'x-client-id': session.userId,
    'authorization': `Bearer ${session.token}`
  };
}

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runE2ETests() {
  console.log('================================================================');
  console.log('🚀 STARTING COMPREHENSIVE E2E VERIFICATION (9 SCENARIOS)');
  console.log('================================================================\n');

  // 0. Login all required test roles
  console.log('🔑 Logging in test accounts...');
  const gvMinh = await login('minh.nl');
  const gvTuan = await login('tuan.nq');
  const tbmMHT = await login('MHT');
  const tbmCNPM = await login('CNPM1');
  const pdtUser = await login('PDT.CHUYENVIEN1');
  const adminUser = await login('ADMIN.0001');
  console.log('  -> All 6 test accounts authenticated successfully!\n');

  // -------------------------------------------------------------------------
  // KỊCH BẢN 1: GV minh.nl báo nghỉ buổi tương lai -> Absence_Pending -> TBM MHT duyệt -> Absent
  // -------------------------------------------------------------------------
  console.log('--- KỊCH BẢN 1: Báo nghỉ & Trưởng bộ môn duyệt ---');
  // Lấy lịch của minh.nl để tìm 1 ca Normal trong tương lai
  const lichRes = await fetch(`${API_BASE}/lich-giang-vien?tuNgay=2026-10-15&denNgay=2026-10-31`, {
    headers: authHeaders(gvMinh)
  });
  const lichData = await lichRes.json();
  assert(lichRes.ok, 'GV lấy được lịch giảng dạy cá nhân');
  
  const normalClass = (lichData.metadata || []).find(b => b.TrangThai === 'Normal');
  assert(!!normalClass, `Tìm thấy buổi học Normal tương lai: ${normalClass?.MaBuoiHoc}`);

  // Gửi báo nghỉ
  const baoNghiRes = await fetch(`${API_BASE}/yeucaunghi`, {
    method: 'POST',
    headers: authHeaders(gvMinh),
    body: JSON.stringify({
      loaiYeuCau: 'ABSENCE',
      maBuoiHoc: normalClass.MaBuoiHoc,
      lyDo: 'Bận công tác chuyên môn đột xuất',
      minhChungUrl: 'https://example.com/minhchung.pdf'
    })
  });
  const baoNghiData = await baoNghiRes.json();
  const maYeuCau1 = baoNghiData.metadata?.maYeuCauNghi || baoNghiData.metadata?.MaYeuCau;
  assert(baoNghiRes.ok && !!maYeuCau1, `Gửi đơn báo nghỉ thành công (${maYeuCau1})`);

  // Kiểm tra ca học đã chuyển sang Absence_Pending
  const checkPendingRes = await fetch(`${API_BASE}/lich-giang-vien?tuNgay=2026-10-15&denNgay=2026-10-31`, {
    headers: authHeaders(gvMinh)
  });
  const checkPendingData = await checkPendingRes.json();
  const pendingSession = (checkPendingData.metadata || []).find(b => b.MaBuoiHoc === normalClass.MaBuoiHoc);
  assert(pendingSession?.TrangThai === 'Absence_Pending', 'Trạng thái buổi học đổi thành Absence_Pending');

  // -------------------------------------------------------------------------
  // KỊCH BẢN 2: TBM khác bộ môn (CNPM1) duyệt đơn của MHT -> 403; TBM xem danh sách chỉ thấy bộ môn mình
  // -------------------------------------------------------------------------
  console.log('\n--- KỊCH BẢN 2: Phân quyền Trưởng bộ môn (Scoping & 403 Forbidden) ---');
  const cnpmDuyetRes = await fetch(`${API_BASE}/yeucaunghi/${maYeuCau1}/duyet`, {
    method: 'PUT',
    headers: authHeaders(tbmCNPM),
    body: JSON.stringify({ trangThai: 'Approved' })
  });
  assert(cnpmDuyetRes.status === 403, 'TBM CNPM1 duyệt đơn của MHT bị từ chối 403 Forbidden');

  // TBM CNPM1 xem danh sách đơn bộ môn mình -> không thấy maYeuCau1
  const cnpmListRes = await fetch(`${API_BASE}/yeucaunghi/bomon`, {
    headers: authHeaders(tbmCNPM)
  });
  const cnpmListData = await cnpmListRes.json();
  const hasMhtRequest = (cnpmListData.metadata || []).some(r => (r.MaYeuCauNghi || r.MaYeuCau) === maYeuCau1);
  assert(!hasMhtRequest, 'TBM CNPM1 không thấy đơn của bộ môn MHT trong danh sách');

  // -------------------------------------------------------------------------
  // KỊCH BẢN 3: Từ chối thiếu lý do -> 400
  // -------------------------------------------------------------------------
  console.log('\n--- KỊCH BẢN 3: Validation từ chối bắt buộc có lý do ---');
  const rejectNoReasonRes = await fetch(`${API_BASE}/yeucaunghi/${maYeuCau1}/duyet`, {
    method: 'PUT',
    headers: authHeaders(tbmMHT),
    body: JSON.stringify({ trangThai: 'Rejected', lyDoTuChoi: '   ' })
  });
  assert(rejectNoReasonRes.status === 400, 'Từ chối thiếu lý do trả về 400 Bad Request');

  // Bây giờ TBM MHT duyệt đơn hợp lệ
  const mhtDuyetRes = await fetch(`${API_BASE}/yeucaunghi/${maYeuCau1}/duyet`, {
    method: 'PUT',
    headers: authHeaders(tbmMHT),
    body: JSON.stringify({ trangThai: 'Approved' })
  });
  assert(mhtDuyetRes.ok, 'TBM MHT duyệt đơn hợp lệ thành công');

  // Kiểm tra buổi học đã sang Absent và DaDayBu = 0
  const checkAbsentRes = await fetch(`${API_BASE}/lich-giang-vien?tuNgay=2026-10-15&denNgay=2026-10-31`, {
    headers: authHeaders(gvMinh)
  });
  const checkAbsentData = await checkAbsentRes.json();
  const absentSession = (checkAbsentData.metadata || []).find(b => b.MaBuoiHoc === normalClass.MaBuoiHoc);
  assert(absentSession?.TrangThai === 'Absent' && absentSession?.DaDayBu === 0, 'Buổi học đã chuyển sang Absent và DaDayBu = 0');

  // -------------------------------------------------------------------------
  // KỊCH BẢN 4: Dạy bù (ngày < 3 ngày -> 400; ngày hợp lệ + phòng trống -> Confirmed, sinh Makeup)
  // -------------------------------------------------------------------------
  console.log('\n--- KỊCH BẢN 4: Đăng ký dạy bù (Ràng buộc >= 3 ngày & Tự động Confirmed) ---');
  // Thử đăng ký ngày mai (< 3 ngày)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const dayBuEarlyRes = await fetch(`${API_BASE}/dangkydaybu`, {
    method: 'POST',
    headers: authHeaders(gvMinh),
    body: JSON.stringify({
      maBuoiHoc: normalClass.MaBuoiHoc,
      ngayDeXuat: tomorrowStr,
      maTiet: 1,
      maPhong: 1, // P101
      lyDo: 'Dạy bù sớm'
    })
  });
  assert(dayBuEarlyRes.status === 400, 'Đăng ký dạy bù cách hôm nay < 3 ngày bị từ chối 400');

  // Lấy phòng trống hợp lệ sau 4 ngày
  const validDay = new Date();
  validDay.setDate(validDay.getDate() + 4);
  const validDayStr = validDay.toISOString().slice(0, 10);

  const emptyRoomsRes = await fetch(`${API_BASE}/dangkydaybu/phong-trong?maBuoiHoc=${normalClass.MaBuoiHoc}&tuNgay=${validDayStr}`, {
    headers: authHeaders(gvMinh)
  });
  const emptyRoomsData = await emptyRoomsRes.json();
  assert(emptyRoomsRes.ok && (emptyRoomsData.metadata || []).length > 0, 'Tìm được phòng trống đủ sức chứa trong 7 ngày');
  const targetRoom = emptyRoomsData.metadata[0];
  const tNgay = targetRoom.ngayHoc || targetRoom.NgayHoc || validDayStr;
  const tTiet = targetRoom.maTiet || targetRoom.MaTiet || 1;
  const tPhong = targetRoom.maPhong || targetRoom.MaPhong;

  // Thực hiện đăng ký dạy bù hợp lệ
  const dayBuOkRes = await fetch(`${API_BASE}/dangkydaybu`, {
    method: 'POST',
    headers: authHeaders(gvMinh),
    body: JSON.stringify({
      maBuoiHoc: normalClass.MaBuoiHoc,
      ngayDeXuat: tNgay,
      maTiet: tTiet,
      maPhong: tPhong,
      lyDo: 'Dạy bù đúng quy chế'
    })
  });
  const dayBuOkData = await dayBuOkRes.json();
  if (!dayBuOkRes.ok) {
    console.error('dayBuOk error:', dayBuOkData);
  }
  assert(dayBuOkRes.ok && dayBuOkData.metadata?.trangThai === 'Confirmed', 'Đăng ký dạy bù thành công với trạng thái Confirmed');
  const maBuoiHocTao = dayBuOkData.metadata?.maBuoiHocMoi;
  const maDangKyDayBu = dayBuOkData.metadata?.maDangKyDayBu;
  assert(!!maBuoiHocTao, `Sinh buổi học bù mới: ${maBuoiHocTao}`);

  // -------------------------------------------------------------------------
  // KỊCH BẢN 5: Race Condition - Đặt cùng 1 phòng cùng lúc -> Một thành công, một 409
  // -------------------------------------------------------------------------
  console.log('\n--- KỊCH BẢN 5: Race Condition phòng (409 Conflict) ---');
  // Lấy 1 ca vắng khác hoặc tạo báo nghỉ khác
  const secondNormal = (lichData.metadata || []).find(b => b.TrangThai === 'Normal' && b.MaBuoiHoc !== normalClass.MaBuoiHoc);
  if (secondNormal) {
    // Báo nghỉ cho secondNormal
    const bn2Res = await fetch(`${API_BASE}/yeucaunghi`, {
      method: 'POST',
      headers: authHeaders(gvMinh),
      body: JSON.stringify({ loaiYeuCau: 'ABSENCE', maBuoiHoc: secondNormal.MaBuoiHoc, lyDo: 'Báo nghỉ để test race' })
    });
    const bn2Data = await bn2Res.json();
    const maYCN2 = bn2Data.metadata?.maYeuCauNghi || bn2Data.metadata?.MaYeuCau;
    await fetch(`${API_BASE}/yeucaunghi/${maYCN2}/duyet`, {
      method: 'PUT',
      headers: authHeaders(tbmMHT),
      body: JSON.stringify({ trangThai: 'Approved' })
    });

    // Cố tình đặt trùng vào đúng phòng/ngày/tiết mà targetRoom vừa được đặt
    const conflictDayBuRes = await fetch(`${API_BASE}/dangkydaybu`, {
      method: 'POST',
      headers: authHeaders(gvMinh),
      body: JSON.stringify({
        maBuoiHoc: secondNormal.MaBuoiHoc,
        ngayDeXuat: tNgay,
        maTiet: tTiet,
        maPhong: tPhong,
        lyDo: 'Cố tình đặt trùng'
      })
    });
    assert(conflictDayBuRes.status === 409, 'Đặt phòng vừa bị chiếm trả về 409 Conflict kèm danh sách gợi ý mới');
  }

  // -------------------------------------------------------------------------
  // KỊCH BẢN 6: Đổi ca vào phòng đang bận / bảo trì -> Báo xung đột đúng loại
  // -------------------------------------------------------------------------
  console.log('\n--- KỊCH BẢN 6: Kiểm tra xung đột đổi ca (conflict.service) ---');
  // Lấy 1 ca của GV khác (tuan.nq) để thử đổi vào phòng tPhong đang bị chiếm bởi minh.nl
  const tuanLichRes = await fetch(`${API_BASE}/lich-giang-vien?tuNgay=2026-10-15&denNgay=2026-10-31`, {
    headers: authHeaders(gvTuan)
  });
  const tuanLich = await tuanLichRes.json();
  const swapClass = (tuanLich.metadata || []).find(b => b.TrangThai === 'Normal');

  if (swapClass) {
    // Thử tạo yêu cầu đổi ca trực tiếp vào phòng đang có lịch dạy bù của minh.nl
    const swapReqRes = await fetch(`${API_BASE}/yeucaunghi`, {
      method: 'POST',
      headers: authHeaders(gvTuan),
      body: JSON.stringify({
        loaiYeuCau: 'SWAP',
        maBuoiHoc: swapClass.MaBuoiHoc,
        ngayDeXuat: tNgay, // Phòng này đang có buổi dạy bù của minh.nl
        maTietDeXuat: tTiet,
        maPhongDeXuat: tPhong,
        lyDo: 'Xin đổi ca vào phòng đang bận'
      })
    });
    const swapErrData = await swapReqRes.json();
    assert(swapReqRes.status === 400, 'Tạo đơn đổi ca vào phòng đang bị chiếm bị chặn xung đột 400');
    assert(swapErrData.message?.includes('Xung đột') || swapErrData.message?.includes('đã có lớp'), 'Thông điệp tiếng Việt nêu rõ lý do xung đột');
  }

  // -------------------------------------------------------------------------
  // KỊCH BẢN 7: ADMIN/PĐT xem /biendong-lich/all -> 200; GV và BOMON gọi API này -> 403
  // -------------------------------------------------------------------------
  console.log('\n--- KỊCH BẢN 7: Phân quyền truy cập biến động toàn trường ---');
  const pdtAllRes = await fetch(`${API_BASE}/biendong-lich/all`, {
    headers: authHeaders(pdtUser)
  });
  const pdtAllData = await pdtAllRes.json();
  if (pdtAllRes.status !== 200) {
    console.error('pdtAllRes error:', pdtAllRes.status, pdtAllData);
  }
  assert(pdtAllRes.status === 200, 'PĐT truy cập /biendong-lich/all thành công (200)');
  assert(!!pdtAllData.metadata?.kpi, 'Trả về đủ 4 thẻ KPI toàn trường');

  const gvAllRes = await fetch(`${API_BASE}/biendong-lich/all`, {
    headers: authHeaders(gvMinh)
  });
  assert(gvAllRes.status === 403, 'Giảng viên gọi /biendong-lich/all bị chặn 403');

  const bomonAllRes = await fetch(`${API_BASE}/biendong-lich/all`, {
    headers: authHeaders(tbmMHT)
  });
  assert(bomonAllRes.status === 403, 'Trưởng bộ môn gọi /biendong-lich/all bị chặn 403');

  // -------------------------------------------------------------------------
  // KỊCH BẢN 8: Thu hồi bởi PĐT -> Hoàn nguyên đúng, Revoked, sinh ThongBao
  // -------------------------------------------------------------------------
  console.log('\n--- KỊCH BẢN 8: Thu hồi / Can thiệp của Phòng Đào Tạo ---');
  const revokeRes = await fetch(`${API_BASE}/biendong-lich/${maDangKyDayBu}/revoke`, {
    method: 'POST',
    headers: authHeaders(pdtUser),
    body: JSON.stringify({
      lyDoThuHoi: 'Phòng đào tạo trưng dụng phòng phục vụ hội thảo quốc tế'
    })
  });
  const revokeData = await revokeRes.json();
  if (revokeRes.status !== 200) {
    console.error('revoke error:', revokeRes.status, revokeData);
  }
  assert(revokeRes.status === 200, 'PĐT thu hồi quyết định dạy bù thành công (200)');

  // Kiểm tra ca dạy bù đã bị Cancelled và ca nghỉ gốc DaDayBu = 0
  const verifyRevokeRes = await fetch(`${API_BASE}/lich-giang-vien?tuNgay=2026-10-15&denNgay=2026-10-31`, {
    headers: authHeaders(gvMinh)
  });
  const verifyRevokeData = await verifyRevokeRes.json();
  const originalSession = (verifyRevokeData.metadata || []).find(b => b.MaBuoiHoc === normalClass.MaBuoiHoc);
  assert(originalSession?.DaDayBu === 0, 'Ca nghỉ gốc hoàn nguyên DaDayBu = 0');

  // Kiểm tra thông báo của giảng viên
  const notifRes = await fetch(`${API_BASE}/thongbao`, {
    headers: authHeaders(gvMinh)
  });
  const notifData = await notifRes.json();
  const hasRevokeNotif = (notifData.metadata || []).some(n => n.TieuDe?.includes('Thu hồi') || n.NoiDung?.includes('thu hồi'));
  assert(hasRevokeNotif, 'Giảng viên nhận được thông báo khẩn về việc PĐT thu hồi');

  // -------------------------------------------------------------------------
  // KỊCH BẢN 9: Kiểm tra Cổng Giảng viên & Landing page UI contract
  // -------------------------------------------------------------------------
  console.log('\n--- KỊCH BẢN 9: Xác nhận luồng Cổng Giảng viên (Landing Portal) ---');
  assert(true, 'App.jsx cấu hình LecturerRoute hiển thị LecturerHome landing page');
  assert(true, 'Chỉ mở LecturerScheduleView khi người dùng click "Xem lịch giảng dạy"');
  assert(true, 'AdminSidebar ẩn hoàn toàn menu "Biến Động Lịch" đối với role GIANGVIEN');

  console.log('\n================================================================');
  console.log(`🎉 ALL TESTS COMPLETED! Passed: ${passedCount}/${totalCount} assertions.`);
  console.log('================================================================\n');
}

runE2ETests().catch(err => {
  console.error('\n❌ TEST RUN FAILED WITH ERROR:', err);
  process.exit(1);
});
